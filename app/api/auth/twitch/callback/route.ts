import { NextRequest, NextResponse } from "next/server";
import {
  exchangeTwitchAuthCode,
  subscribeTwitchEventSub,
  getTwitchStreamState,
} from "@/lib/twitch";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId encoded in state
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/editor?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/editor?error=Missing_code_or_state`
    );
  }

  try {
    const userId = state;
    const redirectUri =
      process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI ||
      `${appUrl}/api/auth/twitch/callback`;

    // 1. Exchange authorization code for tokens and user details
    const authResult = await exchangeTwitchAuthCode(code, redirectUri);

    const accessTokenEncrypted = encryptToken(authResult.accessToken);
    const refreshTokenEncrypted = authResult.refreshToken
      ? encryptToken(authResult.refreshToken)
      : undefined;

    // 2. Register Twitch EventSub webhooks for real-time live sync
    let webhookSubId: string | null = null;
    try {
      const subOnline = await subscribeTwitchEventSub(
        authResult.broadcasterId,
        "stream.online"
      );
      await subscribeTwitchEventSub(
        authResult.broadcasterId,
        "stream.offline"
      );
      webhookSubId = subOnline.subscriptionId;
    } catch (subErr) {
      console.warn(
        "[Twitch EventSub Subscription Warning]: Could not register webhooks (normal during local dev without ngrok/public URL):",
        subErr
      );
    }

    // 3. Upsert OAuthConnection in PostgreSQL
    await prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "TWITCH",
        },
      },
      update: {
        providerAccountId: authResult.broadcasterId,
        accessTokenEncrypted,
        ...(refreshTokenEncrypted ? { refreshTokenEncrypted } : {}),
        expiresAt: authResult.expiresAt,
        scope: "user:read:email",
        webhookSubscriptionId: webhookSubId,
      },
      create: {
        userId,
        provider: "TWITCH",
        providerAccountId: authResult.broadcasterId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt: authResult.expiresAt,
        scope: "user:read:email",
        webhookSubscriptionId: webhookSubId,
      },
    });

    // 4. Check initial stream state
    const initialStreamState = await getTwitchStreamState(
      authResult.broadcasterId,
      authResult.broadcasterLogin
    );

    if (initialStreamState.isLive) {
      await prisma.profile.updateMany({
        where: { userId },
        data: {
          isLive: true,
          livePlatform: "TWITCH",
          liveDataJson: initialStreamState as any,
          lastLiveCheckedAt: new Date(),
        },
      });
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/editor?connected=twitch&channel=${encodeURIComponent(
        authResult.displayName
      )}`
    );
  } catch (err: any) {
    console.error("[Twitch OAuth Callback Error]:", err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/editor?error=${encodeURIComponent(
        err.message || "Failed to link Twitch account"
      )}`
    );
  }
}
