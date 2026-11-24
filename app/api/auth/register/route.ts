import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseOnline, withDbTimeout } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { findLocalUserByIdentifier, createLocalUser } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, captchaInput, captchaToken } = body;

    // 1. Xác thực Captcha
    const captchaCheck = verifyCaptcha(captchaInput, captchaToken);
    if (!captchaCheck.isValid) {
      return NextResponse.json(
        { success: false, message: captchaCheck.message },
        { status: 400 }
      );
    }

    // 2. Validate Tên đăng nhập (Username)
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên đăng nhập" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,24}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tên đăng nhập từ 3 - 24 ký tự, chỉ gồm chữ thường (a-z), số (0-9) và dấu gạch dưới (_)",
        },
        { status: 400 }
      );
    }

    // 3. Validate Email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập địa chỉ email" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Định dạng email không hợp lệ" },
        { status: 400 }
      );
    }

    // 4. Validate Mật khẩu
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu phải có tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    const isOnline = await isDatabaseOnline();
    const passwordHash = hashPassword(password);
    let createdUser: { id: string; username: string; email: string; displayName?: string };

    if (isOnline) {
      // 5A. Kiểm tra trùng lặp trên Prisma
      const existingUser = await withDbTimeout(
        prisma.user.findFirst({
          where: {
            OR: [{ username: cleanUsername }, { email: cleanEmail }],
          },
        }),
        800
      );

      if (existingUser) {
        if (existingUser.username === cleanUsername) {
          return NextResponse.json(
            { success: false, message: "Tên đăng nhập này đã có người sử dụng" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, message: "Email này đã được đăng ký tài khoản" },
          { status: 400 }
        );
      }

      // Tạo trên Prisma
      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: "CREATOR",
          profile: {
            create: {
              displayName: cleanUsername.toUpperCase(),
              bio: "Chào mừng bạn đến với trang Bio cá nhân của tôi!",
              accentColor: "#6366f1",
              backgroundType: "GRADIENT",
              sepayBank: process.env.SEPAY_DEFAULT_BANK || "MBBank",
              sepayAccountNumber: process.env.SEPAY_DEFAULT_ACC || "03810002009",
              sepayAccountName: process.env.SEPAY_DEFAULT_NAME || "BUI VAN THU NOOB",
              widgets: {
                create: [
                  {
                    type: "LIVE_STREAM",
                    title: "🔴 LIVE STREAM BROADCAST",
                    gridSpanX: 2,
                    gridSpanY: 2,
                    sortOrder: 0,
                    isEnabled: true,
                  },
                  {
                    type: "TIP_JAR",
                    title: "Ủng Hộ / Donate Streamer",
                    gridSpanX: 2,
                    gridSpanY: 1,
                    sortOrder: 1,
                    isEnabled: true,
                  },
                ],
              },
            },
          },
        },
        include: { profile: true },
      });

      createdUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.profile?.displayName,
      };
    } else {
      // 5B. Fallback sang Local DB
      const existingLocal = findLocalUserByIdentifier(cleanUsername) || findLocalUserByIdentifier(cleanEmail);
      if (existingLocal) {
        if (existingLocal.username === cleanUsername) {
          return NextResponse.json(
            { success: false, message: "Tên đăng nhập này đã có người sử dụng" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, message: "Email này đã được đăng ký tài khoản" },
          { status: 400 }
        );
      }

      const localUser = createLocalUser({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
      });

      createdUser = {
        id: localUser.id,
        username: localUser.username,
        email: localUser.email,
        displayName: localUser.profile.displayName,
      };
    }

    // 6. Tạo phiên đăng nhập (Session Token)
    const sessionToken = createSessionToken(createdUser.id);

    const response = NextResponse.json({
      success: true,
      message: "Tạo tài khoản thành công!",
      user: createdUser,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi tạo tài khoản: " + error.message },
      { status: 500 }
    );
  }
}
