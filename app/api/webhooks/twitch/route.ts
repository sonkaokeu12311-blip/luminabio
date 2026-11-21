import { NextRequest, NextResponse } from "next/server";
import {
  verifyTwitchEventSubSignature,
  getTwitchStreamState,
} from "@/lib/twitch";
import { setCache } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const messageId = req.headers.get("twitch-eventsub-message-id");
    const messageTimestamp = req.headers.get("twitch-eventsub-message-timestamp");
    const messageSignature = req.headers.get("twitch-eventsub-message-signature");
    const messageType = req.headers.get("twitch-eventsub-message-type");

    if (!messageId || !messageTimestamp || !messageSignature || !messageType) {
      return new NextResponse("Missing required Twitch EventSub headers", {
        status: 400,
      });
    }

    // 1. Verify HMAC-SHA256 signature
    const isValid = verifyTwitchEventSubSignature(
      messageId,
      messageTimestamp,
      rawBody,
      messageSignature
    );

    if (!isValid) {
      console.warn("[Twitch EventSub] Invalid webhook signature detected.");
      return new NextResponse("Invalid signature", { status: 403 });
    }

    const payload = JSON.parse(rawBody);

    // 2. Handle Twitch Webhook Challenge Verification
    if (messageType === "webhook_callback_verification") {
      const challenge = payload.challenge;
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 3. Handle Webhook Notifications
    if (messageType === "notification") {
      const subscriptionType = payload.subscription?.type;
      const event = payload.event;
      const broadcasterId = event?.broadcaster_user_id;

      if (!broadcasterId) {
        return new NextResponse("Missing broadcaster ID in event", {
          status: 400,
        });
      }

      console.log(
        `[Twitch EventSub Notification] Received ${subscriptionType} for broadcaster ${broadcasterId}`
      );

      // Look up OAuthConnection to find associated User and Profile
      const connection = await prisma.oAuthConnection.findFirst({
        where: {
          provider: "TWITCH",
          providerAccountId: broadcasterId,
        },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      if (subscriptionType === "stream.online") {
        // Broadcaster just went live: fetch full stream metadata
        const streamState = await getTwitchStreamState(broadcasterId);

        // Update Redis live cache immediately
        await setCache(`twitch:live:${broadcasterId}`, streamState, 120);

        if (connection?.user?.profile) {
          await prisma.profile.update({
            where: { id: connection.user.profile.id },
            data: {
              isLive: true,
              livePlatform: "TWITCH",
              liveDataJson: streamState as any,
              lastLiveCheckedAt: new Date(),
            },
          });
        }
      } else if (subscriptionType === "stream.offline") {
        // Broadcaster ended their stream
        const offlineState = { isLive: false, broadcasterId };
        await setCache(`twitch:live:${broadcasterId}`, offlineState, 120);

        if (connection?.user?.profile) {
          await prisma.profile.update({
            where: { id: connection.user.profile.id },
            data: {
              isLive: false,
              livePlatform: "NONE",
              liveDataJson: Prisma.DbNull,
              lastLiveCheckedAt: new Date(),
            },
          });
        }
      }

      return new NextResponse(null, { status: 204 });
    }

    // 4. Handle Subscription Revocation
    if (messageType === "revocation") {
      console.warn(
        `[Twitch EventSub Revocation] Subscription ${payload.subscription?.id} was revoked: ${payload.subscription?.status}`
      );
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse("Unhandled message type", { status: 200 });
  } catch (error: any) {
    console.error("[Twitch Webhook Processing Error]:", error);
    return new NextResponse(error.message || "Internal server error", {
      status: 500,
    });
  }
}
