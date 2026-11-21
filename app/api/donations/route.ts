import { NextRequest, NextResponse } from "next/server";
import { generateSepayQrUrl } from "@/lib/sepay";
import { setCache, getCache } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/donations?code=LH_XXXX
 * Checks if a specific donation session has been paid via SePay Webhook
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing donation code" }, { status: 400 });
  }

  const normalizedCode = code.toUpperCase().trim();

  // 1. Check Redis fast cache
  const cachedDonation = await getCache<{
    id: string;
    amount: number;
    donorName: string;
    message: string;
  }>(`donations:code:${normalizedCode}`);

  if (cachedDonation) {
    return NextResponse.json({
      paid: true,
      donation: cachedDonation,
    });
  }

  // 2. Fallback to PostgreSQL
  const dbDonation = await prisma.donationTransaction.findFirst({
    where: {
      code: normalizedCode,
      status: "SUCCESS",
    },
  });

  if (dbDonation) {
    return NextResponse.json({
      paid: true,
      donation: {
        id: dbDonation.id,
        amount: dbDonation.amount,
        donorName: dbDonation.donorName,
        message: dbDonation.donorMessage,
      },
    });
  }

  return NextResponse.json({ paid: false, code: normalizedCode });
}

/**
 * POST /api/donations
 * Initializes a new donation session: generates unique transfer remark code and VietQR image URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileId, donorName, amount, message } = body;

    if (!profileId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid parameters: profileId and positive amount required" },
        { status: 400 }
      );
    }

    // Fetch creator's banking info
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const bank = profile.sepayBank || process.env.SEPAY_DEFAULT_BANK || "MBBank";
    const accountNumber =
      profile.sepayAccountNumber ||
      process.env.SEPAY_DEFAULT_ACC ||
      "03810002009";

    // Generate unique code: LH_ + 5 random alphanumeric chars (e.g. "LH_K93XP")
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `LH_${randomSuffix}`;

    // Cache the pending donation intent for 15 minutes
    await setCache(
      `pending:donation:${code}`,
      {
        profileId,
        donorName: donorName?.trim() || "Một bạn ẩn danh",
        amount,
        message: message?.trim() || "",
      },
      900 // 15 mins
    );

    // Generate dynamic SePay VietQR link
    const qrUrl = generateSepayQrUrl({
      bank,
      accountNumber,
      accountName: profile.sepayAccountName || undefined,
      amount,
      code,
      template: "compact",
    });

    return NextResponse.json({
      success: true,
      code,
      qrUrl,
      bank,
      accountNumber,
      amount,
      des: code,
    });
  } catch (error: any) {
    console.error("[Donation Init Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize donation" },
      { status: 500 }
    );
  }
}
