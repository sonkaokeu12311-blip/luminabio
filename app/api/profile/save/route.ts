import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseOnline, withDbTimeout } from "@/lib/prisma";
import { updateLocalProfile } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Bạn cần đăng nhập để lưu trang Bio" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { profile: profData, widgets: widgetsData } = body;
    const isOnline = await isDatabaseOnline();

    if (isOnline && user.profile) {
      // 1. Cập nhật thông tin Profile trên Prisma
      await withDbTimeout(
        prisma.profile.update({
          where: { userId: user.id },
          data: {
            displayName: profData.displayName || user.username.toUpperCase(),
            bio: profData.bio,
            avatarUrl: profData.avatarUrl || null,
            accentColor: profData.accentColor || "#6366f1",
            backgroundType: profData.backgroundType || "GRADIENT",
            backgroundUrl: profData.backgroundUrl || null,
            audioUrl: profData.audioUrl || null,
            audioTitle: profData.audioTitle || null,
            sepayBank: profData.sepayBank || "MBBank",
            sepayAccountNumber: profData.sepayAccountNumber || null,
            sepayAccountName: profData.sepayAccountName || null,
          },
        }),
        1000
      );

      // 2. Đồng bộ danh sách Bento Widgets
      if (Array.isArray(widgetsData) && user.profile) {
        await withDbTimeout(
          prisma.bentoWidget.deleteMany({
            where: { profileId: user.profile.id },
          }),
          1000
        );

        if (widgetsData.length > 0) {
          await withDbTimeout(
            prisma.bentoWidget.createMany({
              data: widgetsData.map((w: any, idx: number) => ({
                profileId: user.profile!.id,
                type: w.type,
                title: w.title,
                url: w.url || null,
                gridSpanX: w.gridSpanX || 1,
                gridSpanY: w.gridSpanY || 1,
                sortOrder: idx,
                isEnabled: w.isEnabled !== false,
                configJson: w.configJson || {},
              })),
            }),
            1000
          );
        }
      }
    } else {
      // Lưu vào Local DB
      updateLocalProfile(user.id, profData, widgetsData);
    }

    return NextResponse.json({
      success: true,
      message: "Đã xuất bản & lưu trang Bio vĩnh viễn thành công!",
    });
  } catch (error: any) {
    console.error("[Profile Save Error]:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi lưu Profile: " + error.message },
      { status: 500 }
    );
  }
}
