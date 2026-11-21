import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleAuthCode, checkYouTubeLiveStatus } from "@/lib/youtube";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: 'code' or 'userId'" },
        { status: 400 }
      );
    }

    // 1. Exchange code for access & refresh tokens with Google
    const tokenResult = await exchangeGoogleAuthCode(code);

    const accessTokenEncrypted = encryptToken(tokenResult.accessToken);
    const refreshTokenEncrypted = tokenResult.refreshToken
      ? encryptToken(tokenResult.refreshToken)
      : undefined;

    // 2. Persist encrypted credentials into OAuthConnection
    const oauthConnection = await prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "YOUTUBE",
        },
      },
      update: {
        providerAccountId: tokenResult.channelId,
        accessTokenEncrypted,
        ...(refreshTokenEncrypted
          ? { refreshTokenEncrypted }
          : {}),
        expiresAt: tokenResult.expiresAt,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
      },
      create: {
        userId,
        provider: "YOUTUBE",
        providerAccountId: tokenResult.channelId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt: tokenResult.expiresAt,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
      },
    });

    // 3. Immediately trigger a live status check and update profile
    const liveStatus = await checkYouTubeLiveStatus(userId);

    return NextResponse.json({
      success: true,
      channelId: tokenResult.channelId,
      channelTitle: tokenResult.channelTitle,
      liveStatus,
      connectionId: oauthConnection.id,
    });
  } catch (error: any) {
    console.error("[Google OAuth Callback Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to authenticate with Google" },
      { status: 500 }
    );
  }
}
