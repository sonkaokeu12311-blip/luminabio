import { encryptToken, decryptToken } from "./crypto";
import { prisma } from "./prisma";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  error?: string;
  error_description?: string;
}

/**
 * Exchanges Discord OAuth2 code for Access and Refresh Tokens
 * Official Docs: https://discord.com/developers/docs/topics/oauth2
 */
export async function exchangeDiscordAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  discordUser: DiscordUser;
}> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Discord OAuth credentials in environment variables");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const tokenData = (await res.json()) as DiscordTokenResponse;

  if (!res.ok || tokenData.error) {
    throw new Error(
      `Discord OAuth exchange failed: ${tokenData.error_description || tokenData.error}`
    );
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Fetch Discord User Details
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userRes.ok) {
    throw new Error("Failed to fetch Discord user profile");
  }

  const discordUser = (await userRes.json()) as DiscordUser;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    discordUser,
  };
}

/**
 * Generates user avatar URL from Discord CDN
 */
export function getDiscordAvatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  }
  const defaultIndex = (parseInt(user.id.slice(-4), 10) || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}
