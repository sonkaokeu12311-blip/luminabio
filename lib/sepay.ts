import { prisma } from "./prisma";
import { setCache, getCache } from "./redis";

export interface SePayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  amountIn: number;
  amountOut: number;
  accumulated: number;
  code: string | null;
  transactionContent: string;
  referenceNumber: string;
  body: string | null;
}

export interface SePayQrConfig {
  bank: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  code: string;
  template?: "compact" | "qronly" | "print";
}

/**
 * Generates an official VietQR dynamic payment link via SePay's CDN
 * Documentation: https://my.sepay.vn/docs/sepay-qr
 */
export function generateSepayQrUrl(config: SePayQrConfig): string {
  const {
    bank,
    accountNumber,
    accountName,
    amount,
    code,
    template = "compact",
  } = config;

  const url = new URL("https://qr.sepay.vn/img");
  url.searchParams.set("acc", accountNumber);
  url.searchParams.set("bank", bank);
  url.searchParams.set("amount", Math.round(amount).toString());
  url.searchParams.set("des", code);
  url.searchParams.set("template", template);

  return url.toString();
}

/**
 * Validates the SePay Webhook Authorization Header.
 * SePay sends: "Authorization: Apikey <YOUR_SEPAY_API_KEY>"
 */
export function verifySepayApiKey(authHeader: string | null): boolean {
  const expectedKey = process.env.SEPAY_API_KEY;
  if (
    !expectedKey ||
    expectedKey.startsWith("your-") ||
    expectedKey.startsWith("Điền_")
  ) {
    console.log(
      "[SePay Webhook] Bypassing auth check: SEPAY_API_KEY is not configured or in test mode."
    );
    return true;
  }

  if (!authHeader) return false;

  // Header format: "Apikey <KEY>"
  const parts = authHeader.trim().split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "apikey") {
    return parts[1] === expectedKey;
  }

  // Fallback if raw key is passed
  return authHeader.trim() === expectedKey;
}

/**
 * Parses SePay transaction content to extract the unique donation code and donor message
 * Example formats:
 * - "LH_A9X4 Chuc anh live vui ve" -> code: "LH_A9X4", message: "Chuc anh live vui ve"
 * - "DONATE shroud_code LH_9123 Hello" -> code: "LH_9123"
 */
export function parseTransactionContent(content: string): {
  code: string | null;
  cleanedMessage: string;
} {
  if (!content) {
    return { code: null, cleanedMessage: "" };
  }

  // Match LH_[A-Za-z0-9]+ or SEPAY_[A-Za-z0-9]+ or order code
  const codeRegex = /\b(LH_[A-Za-z0-9]{4,12})\b/i;
  const match = content.match(codeRegex);

  const code = match ? match[1].toUpperCase() : null;
  let cleanedMessage = content;

  if (code) {
    // Remove the tracking code from the message to leave a clean donor comment
    cleanedMessage = content.replace(new RegExp(code, "ig"), "").trim();
  }

  return {
    code,
    cleanedMessage: cleanedMessage || "Ủng hộ streamer!",
  };
}

/**
 * Broadcasts recent donation to Redis / in-memory cache for real-time OBS alert & donor feedback
 */
export async function broadcastDonationAlert(donation: {
  id: string;
  profileId: string;
  donorName: string;
  amount: number;
  message: string;
  code: string | null;
}) {
  const streamKey = `donations:latest:${donation.profileId}`;
  await setCache(streamKey, donation, 300); // cache for 5 minutes

  if (donation.code) {
    // Allow the specific donor browser tab to check status
    await setCache(`donations:code:${donation.code}`, donation, 600);
  }
}
