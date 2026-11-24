import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseOnline, withDbTimeout } from "@/lib/prisma";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { findLocalUserByIdentifier } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, captchaInput, captchaToken } = body;

    // 1. Xác thực Captcha
    const captchaCheck = verifyCaptcha(captchaInput, captchaToken);
    if (!captchaCheck.isValid) {
      return NextResponse.json(
        { success: false, message: captchaCheck.message },
        { status: 400 }
      );
    }

    // 2. Validate input cơ bản
    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên đăng nhập hoặc email" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mật khẩu" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isOnline = await isDatabaseOnline();
    let user: any = null;

    if (isOnline) {
      // 3A. Tìm trên Prisma
      user = await withDbTimeout(
        prisma.user.findFirst({
          where: {
            OR: [{ username: cleanIdentifier }, { email: cleanIdentifier }],
          },
          include: {
            profile: true,
          },
        }),
        800
      );
    }

    if (!user) {
      // 3B. Tìm trên Local DB
      user = findLocalUserByIdentifier(cleanIdentifier);
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập/email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // 4. Kiểm tra băm mật khẩu
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập/email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // 5. Tạo Session Token mã hóa
    const sessionToken = createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.profile?.displayName || user.username,
      },
    });

    // Lưu cookie phiên 30 ngày (HTTP-only)
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Login Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng nhập: " + error.message },
      { status: 500 }
    );
  }
}
