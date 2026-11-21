import { NextRequest, NextResponse } from "next/server";
import { exchangeDiscordAuthCode, getDiscordAvatarUrl } from "@/lib/discord";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // Optional userId or returnTo
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=Missing_authorization_code`
    );
  }

  try {
    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
      `${appUrl}/api/auth/discord/callback`;

    // 1. Exchange authorization code for tokens and Discord user profile
    const authResult = await exchangeDiscordAuthCode(code, redirectUri);
    const { discordUser } = authResult;

    const accessTokenEncrypted = encryptToken(authResult.accessToken);
    const refreshTokenEncrypted = authResult.refreshToken
      ? encryptToken(authResult.refreshToken)
      : undefined;

    const email =
      discordUser.email || `${discordUser.id}@discord.livehub.me`;
    const username = discordUser.username.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const avatarUrl = getDiscordAvatarUrl(discordUser);
    const displayName =
      discordUser.global_name || discordUser.username;

    // 2. Find or create User and BioProfile
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: `${username}_${Math.floor(100 + Math.random() * 900)}`,
          role: "CREATOR",
          profile: {
            create: {
              displayName,
              avatarUrl,
              bio: "Creator & Streamer powered by LiveHub",
              accentColor: "#5865F2", // Discord Blurple
            },
          },
        },
      });
    }

    // 3. Upsert OAuthConnection
    await prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "DISCORD",
        },
      },
      update: {
        providerAccountId: discordUser.id,
        accessTokenEncrypted,
        ...(refreshTokenEncrypted ? { refreshTokenEncrypted } : {}),
        expiresAt: authResult.expiresAt,
        scope: "identify email guilds",
      },
      create: {
        userId: user.id,
        provider: "DISCORD",
        providerAccountId: discordUser.id,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt: authResult.expiresAt,
        scope: "identify email guilds",
      },
    });

    // 4. Redirect to Creator Dashboard
    const response = NextResponse.redirect(
      `${appUrl}/dashboard/editor?connected=discord&username=${encodeURIComponent(
        user.username
      )}`
    );

    // Set simple session cookie for development auth persistence
    response.cookies.set("livehub_user_id", user.id, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("[Discord OAuth Callback Error]:", err);
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(
        err.message || "Failed to authenticate with Discord"
      )}`
    );
  }
}
