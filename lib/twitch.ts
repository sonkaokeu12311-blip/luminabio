import crypto from "crypto";
import { prisma } from "./prisma";
import { encryptToken, decryptToken } from "./crypto";
import { getCache, setCache } from "./redis";

export interface TwitchStreamState {
  isLive: boolean;
  streamId?: string;
  broadcasterId?: string;
  broadcasterName?: string;
  title?: string;
  gameName?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  startedAt?: string;
  embedUrl?: string;
}

interface TwitchTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
  message?: string;
}

/**
 * Retrieves a cached or fresh Twitch App Access Token (Client Credentials)
 * Used for server-to-server Twitch Helix API queries and EventSub subscriptions
 */
export async function getTwitchAppAccessToken(): Promise<string> {
  const cacheKey = "twitch:app_access_token";
  const cached = await getCache<string>(cacheKey);
  if (cached) return cached;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json()) as TwitchTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Failed to obtain Twitch App Access Token: ${data.message || "Unknown error"}`
    );
  }

  // Cache token with safe margin before expiration (expires_in - 300s)
  const ttl = Math.max(data.expires_in - 300, 300);
  await setCache(cacheKey, data.access_token, ttl);

  return data.access_token;
}

/**
 * Exchanges Twitch Authorization Code for User Tokens and Broadcaster Details
 */
export async function exchangeTwitchAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  broadcasterId: string;
  broadcasterLogin: string;
  displayName: string;
  profileImageUrl: string;
}> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch credentials in environment variables");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json()) as TwitchTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Twitch code exchange failed: ${data.message || JSON.stringify(data)}`
    );
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Fetch broadcaster user details
  const userRes = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${data.access_token}`,
    },
  });

  const userData = await userRes.json();
  const userItem = userData.data?.[0];

  if (!userItem) {
    throw new Error("Failed to retrieve user profile from Twitch Helix API");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresAt,
    broadcasterId: userItem.id,
    broadcasterLogin: userItem.login,
    displayName: userItem.display_name,
    profileImageUrl: userItem.profile_image_url,
  };
}

/**
 * Queries Twitch Helix API for the current live stream status of a broadcaster
 */
export async function getTwitchStreamState(
  broadcasterId: string,
  broadcasterLogin?: string
): Promise<TwitchStreamState> {
  const cacheKey = `twitch:live:${broadcasterId}`;
  const cached = await getCache<TwitchStreamState>(cacheKey);
  if (cached) return cached;

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID is not configured");
  }

  const token = await getTwitchAppAccessToken();

  const url = new URL("https://api.twitch.tv/helix/streams");
  url.searchParams.set("user_id", broadcasterId);

  const res = await fetch(url.toString(), {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("[Twitch API] Failed to fetch stream:", await res.text());
    return { isLive: false, broadcasterId };
  }

  const data = await res.json();
  const stream = data.data?.[0];

  if (!stream || stream.type !== "live") {
    const offlineState: TwitchStreamState = {
      isLive: false,
      broadcasterId,
      broadcasterName: broadcasterLogin,
    };
    await setCache(cacheKey, offlineState, 60);
    return offlineState;
  }

  const liveState: TwitchStreamState = {
    isLive: true,
    streamId: stream.id,
    broadcasterId: stream.user_id,
    broadcasterName: stream.user_name || broadcasterLogin,
    title: stream.title,
    gameName: stream.game_name,
    viewerCount: stream.viewer_count,
    thumbnailUrl: stream.thumbnail_url
      ?.replace("{width}", "1280")
      ?.replace("{height}", "720"),
    startedAt: stream.started_at,
    embedUrl: `https://player.twitch.tv/?channel=${stream.user_login || broadcasterLogin}&parent=${
      process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "localhost"
    }&autoplay=true&muted=false`,
  };

  await setCache(cacheKey, liveState, 60);
  return liveState;
}

/**
 * Subscribes to Twitch EventSub webhook events (stream.online, stream.offline)
 */
export async function subscribeTwitchEventSub(
  broadcasterId: string,
  eventType: "stream.online" | "stream.offline"
): Promise<{ subscriptionId: string }> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !webhookSecret || !appUrl) {
    throw new Error("Missing required Twitch Webhook configuration variables");
  }

  const appToken = await getTwitchAppAccessToken();
  const callbackUrl = `${appUrl}/api/webhooks/twitch`;

  const body = {
    type: eventType,
    version: "1",
    condition: {
      broadcaster_user_id: broadcasterId,
    },
    transport: {
      method: "webhook",
      callback: callbackUrl,
      secret: webhookSecret,
    },
  };

  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${appToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    // If subscription already exists, retrieve existing id or log info
    if (res.status === 409) {
      console.log(`[Twitch EventSub] Subscription for ${eventType} already exists.`);
      return { subscriptionId: "existing" };
    }
    throw new Error(
      `Failed to subscribe to Twitch EventSub: ${data.message || JSON.stringify(data)}`
    );
  }

  return { subscriptionId: data.data?.[0]?.id };
}

/**
 * Validates the Twitch EventSub HMAC-SHA256 signature
 */
export function verifyTwitchEventSubSignature(
  messageId: string,
  messageTimestamp: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Twitch Webhook] TWITCH_WEBHOOK_SECRET is not configured");
    return false;
  }

  // Prevent replay attacks: verify timestamp is within 10 minutes
  const timestampDate = new Date(messageTimestamp).getTime();
  const now = Date.now();
  if (Math.abs(now - timestampDate) > 10 * 60 * 1000) {
    console.warn("[Twitch Webhook] Timestamp delta too large; potential replay attack.");
    return false;
  }

  const message = messageId + messageTimestamp + rawBody;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
