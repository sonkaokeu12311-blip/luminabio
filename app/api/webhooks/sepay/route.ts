import { NextRequest, NextResponse } from "next/server";
import {
  SePayWebhookPayload,
  verifySepayApiKey,
  parseTransactionContent,
  broadcastDonationAlert,
} from "@/lib/sepay";
import { prisma } from "@/lib/prisma";
import { getCache } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    // 1. Verify SePay API Key
    if (!verifySepayApiKey(authHeader)) {
      console.warn("[SePay Webhook] Invalid or missing Authorization header.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid SePay API Key" },
        { status: 401 }
      );
    }

    const payload = (await req.json()) as SePayWebhookPayload;

    if (!payload || !payload.id) {
      return NextResponse.json(
        { error: "Invalid payload: missing transaction id" },
        { status: 400 }
      );
    }

    // Only process incoming money (amountIn > 0)
    if (!payload.amountIn || payload.amountIn <= 0) {
      return NextResponse.json({
        success: true,
        message: "Ignored outgoing or zero-amount transaction",
      });
    }

    console.log(
      `[SePay Webhook] Received ${payload.amountIn.toLocaleString()} VND via ${
        payload.gateway
      } (${payload.accountNumber}). Remark: "${payload.transactionContent}"`
    );

    // 2. Parse donation code and message
    const { code, cleanedMessage } = parseTransactionContent(
      payload.transactionContent
    );

    // 3. Locate Creator Profile
    let targetProfile = null;

    // Check if code was cached with a target profileId
    if (code) {
      const cachedSession = await getCache<{ profileId: string; donorName: string }>(
        `pending:donation:${code}`
      );
      if (cachedSession?.profileId) {
        targetProfile = await prisma.profile.findUnique({
          where: { id: cachedSession.profileId },
        });
      }
    }

    // Fallback: match by bank account number configured on Creator Profile
    if (!targetProfile && payload.accountNumber) {
      targetProfile = await prisma.profile.findFirst({
        where: { sepayAccountNumber: payload.accountNumber },
      });
    }

    // Fallback to first active creator profile if single-streamer setup
    if (!targetProfile) {
      targetProfile = await prisma.profile.findFirst();
    }

    if (!targetProfile) {
      console.warn(
        `[SePay Webhook] No matching creator profile found for account ${payload.accountNumber}`
      );
      return NextResponse.json(
        { error: "No creator profile found to receive this donation" },
        { status: 404 }
      );
    }

    // 4. Check for cached donor name if pre-registered in tip modal
    let donorName = "Một bạn ẩn danh";
    if (code) {
      const cached = await getCache<{ donorName?: string }>(
        `pending:donation:${code}`
      );
      if (cached?.donorName) {
        donorName = cached.donorName;
      }
    }

    // 5. Upsert DonationTransaction (idempotent via sepayId)
    const transaction = await prisma.donationTransaction.upsert({
      where: { sepayId: payload.id },
      update: {
        amount: payload.amountIn,
        transactionContent: payload.transactionContent,
        referenceNumber: payload.referenceNumber,
        status: "SUCCESS",
      },
      create: {
        profileId: targetProfile.id,
        sepayId: payload.id,
        gateway: payload.gateway,
        accountNumber: payload.accountNumber,
        amount: payload.amountIn,
        currency: "VND",
        transactionContent: payload.transactionContent,
        referenceNumber: payload.referenceNumber,
        code,
        donorName,
        donorMessage: cleanedMessage,
        status: "SUCCESS",
        transactionDate: payload.transactionDate
          ? new Date(payload.transactionDate)
          : new Date(),
      },
    });

    // 6. Update Creator Goal Progress in TipJar Widget
    try {
      const tipWidget = await prisma.bentoWidget.findFirst({
        where: {
          profileId: targetProfile.id,
          type: "TIP_JAR",
        },
      });

      if (tipWidget && tipWidget.configJson) {
        const config = tipWidget.configJson as any;
        const currentAmount = (config.currentAmount || 0) + payload.amountIn;
        await prisma.bentoWidget.update({
          where: { id: tipWidget.id },
          data: {
            configJson: {
              ...config,
              currentAmount,
            },
          },
        });
      }
    } catch (widgetErr) {
      console.warn("[SePay Webhook] Failed to update TipJar widget goal:", widgetErr);
    }

    // 7. Broadcast real-time donation alert to OBS and Donor Browser
    await broadcastDonationAlert({
      id: transaction.id,
      profileId: targetProfile.id,
      donorName,
      amount: payload.amountIn,
      message: cleanedMessage,
      code,
    });

    return NextResponse.json({
      success: true,
      donationId: transaction.id,
      amount: payload.amountIn,
      creator: targetProfile.displayName,
      message: "Donation processed and alert broadcasted successfully",
    });
  } catch (error: any) {
    console.error("[SePay Webhook Fatal Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
