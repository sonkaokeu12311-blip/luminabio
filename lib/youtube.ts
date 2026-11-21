import { prisma } from "./prisma";
import { encryptToken, decryptToken } from "./crypto";
import { getCache, setCache } from "./redis";

export interface YouTubeLiveState {
  isLive: boolean;
  broadcastId?: string;
  title?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  embedUrl?: string;
  channelId?: string;
  publishedAt?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

/**
 * Exchanges Google GIS Authorization Code for Access & Refresh Tokens
 */
export async function exchangeGoogleAuthCode(
  code: string,
  redirectUri = "postmessage"
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  channelId: string;
  channelTitle: string;
}> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials in environment");
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

  if (!tokenRes.ok || tokenData.error) {
    throw new Error(
      `Google token exchange failed: ${tokenData.error_description || tokenData.error || "Unknown error"}`
    );
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Fetch YouTube Channel Details to identify the creator
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  const channelData = await channelRes.json();
  const channelItem = channelData.items?.[0];

  if (!channelItem) {
    throw new Error(
      "No YouTube channel found associated with this Google account."
    );
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    channelId: channelItem.id,
    channelTitle: channelItem.snippet.title,
  };
}

/**
 * Ensures a valid Access Token exists, auto-refreshing via Refresh Token if expired
 */
export async function getValidYouTubeAccessToken(userId: string): Promise<string> {
  const connection = await prisma.oAuthConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "YOUTUBE",
      },
    },
  });

  if (!connection) {
    throw new Error(`No YouTube OAuth connection found for user ${userId}`);
  }

  const now = new Date();
  // Refresh if token expires in less than 5 minutes
  const isExpiringSoon =
    connection.expiresAt &&
    connection.expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (!isExpiringSoon && connection.accessTokenEncrypted) {
    return decryptToken(connection.accessTokenEncrypted);
  }

  // Token is expired or expiring; attempt refresh
  if (!connection.refreshTokenEncrypted) {
    throw new Error(
      "YouTube Access Token expired and no Refresh Token is available. Re-authorization required."
    );
  }

  const refreshToken = decryptToken(connection.refreshTokenEncrypted);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const refreshParams = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: refreshParams.toString(),
  });

  const refreshData = (await refreshRes.json()) as GoogleTokenResponse;

  if (!refreshRes.ok || refreshData.error) {
    throw new Error(
      `Failed to refresh YouTube access token: ${refreshData.error_description || refreshData.error}`
    );
  }

  const newAccessTokenEncrypted = encryptToken(refreshData.access_token);
  const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

  // Update DB with fresh encrypted token
  await prisma.oAuthConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: newAccessTokenEncrypted,
      expiresAt: newExpiresAt,
    },
  });

  return refreshData.access_token;
}

/**
 * Checks if the user is currently live streaming on YouTube
 * Uses Redis caching (60s TTL) to prevent YouTube API quota exhaustion
 */
export async function checkYouTubeLiveStatus(
  userId: string
): Promise<YouTubeLiveState> {
  const cacheKey = `youtube:live:${userId}`;
  const cached = await getCache<YouTubeLiveState>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const accessToken = await getValidYouTubeAccessToken(userId);

    // 1. Check active live broadcasts
    const broadcastUrl = new URL(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts"
    );
    broadcastUrl.searchParams.set("part", "snippet,status,contentDetails");
    broadcastUrl.searchParams.set("broadcastStatus", "active");

    const broadcastRes = await fetch(broadcastUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!broadcastRes.ok) {
      const err = await broadcastRes.text();
      console.error("[YouTube API] Error fetching liveBroadcasts:", err);
      return { isLive: false };
    }

    const broadcastData = await broadcastRes.json();
    const activeBroadcast = broadcastData.items?.[0];

    if (!activeBroadcast) {
      const inactiveState: YouTubeLiveState = { isLive: false };
      await setCache(cacheKey, inactiveState, 60);
      return inactiveState;
    }

    const videoId = activeBroadcast.id;
    let viewerCount = 0;

    // 2. Fetch concurrent viewer count from videos.list
    try {
      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.searchParams.set("part", "liveStreamingDetails,statistics");
      videoUrl.searchParams.set("id", videoId);

      const videoRes = await fetch(videoUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (videoRes.ok) {
        const videoData = await videoRes.json();
        const videoItem = videoData.items?.[0];
        if (videoItem?.liveStreamingDetails?.concurrentViewers) {
          viewerCount = parseInt(
            videoItem.liveStreamingDetails.concurrentViewers,
            10
          );
        }
      }
    } catch (viewerErr) {
      console.warn("[YouTube API] Failed to fetch concurrent viewers:", viewerErr);
    }

    const liveState: YouTubeLiveState = {
      isLive: true,
      broadcastId: videoId,
      title: activeBroadcast.snippet.title,
      thumbnailUrl:
        activeBroadcast.snippet.thumbnails?.maxres?.url ||
        activeBroadcast.snippet.thumbnails?.high?.url ||
        activeBroadcast.snippet.thumbnails?.default?.url,
      viewerCount,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`,
      channelId: activeBroadcast.snippet.channelId,
      publishedAt: activeBroadcast.snippet.publishedAt,
    };

    // Cache in Redis for 60 seconds
    await setCache(cacheKey, liveState, 60);

    // Sync state into PostgreSQL Profile
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        isLive: true,
        livePlatform: "YOUTUBE",
        liveDataJson: liveState as any,
        lastLiveCheckedAt: new Date(),
      },
    });

    return liveState;
  } catch (err) {
    console.error(`[YouTube Sync] Error checking live status for user ${userId}:`, err);
    return { isLive: false };
  }
}
