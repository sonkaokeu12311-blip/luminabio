import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { svg, captchaToken } = generateCaptcha();
    return NextResponse.json({
      success: true,
      svg,
      captchaToken,
    });
  } catch (error: any) {
    console.error("[Captcha] Error generating captcha:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo mã Captcha" },
      { status: 500 }
    );
  }
}
