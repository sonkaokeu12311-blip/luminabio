import crypto from "crypto";
import { cookies } from "next/headers";
import { encryptToken, decryptToken } from "./crypto";
import { prisma, isDatabaseOnline, withDbTimeout } from "./prisma";
import { findLocalUserById } from "./local-db";

export const SESSION_COOKIE_NAME = "lh_session_token";

export interface SessionData {
  userId: string;
  createdAt: number;
}

/**
 * Băm mật khẩu an toàn chuẩn PBKDF2 với Salt ngẫu nhiên
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Kiểm tra mật khẩu khớp với hash đã lưu
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(":");
    if (!salt || !storedHash) return false;

    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Tạo token phiên đăng nhập mã hóa AES-256-GCM
 */
export function createSessionToken(userId: string): string {
  const payload: SessionData = {
    userId,
    createdAt: Date.now(),
  };
  return encryptToken(JSON.stringify(payload));
}

/**
 * Giải mã và xác thực token phiên đăng nhập
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const decrypted = decryptToken(token);
    const data: SessionData = JSON.parse(decrypted);

    // Phiên làm việc có hạn 30 ngày
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.createdAt > maxAge) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Lấy thông tin người dùng đang đăng nhập từ Cookie trên Server Component / Route Handler
 */
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session || !session.userId) return null;

    const isOnline = await isDatabaseOnline();
    if (isOnline) {
      const user = await withDbTimeout(
        prisma.user.findUnique({
          where: { id: session.userId },
          include: {
            profile: {
              include: {
                widgets: {
                  where: { isEnabled: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        }),
        800
      );
      if (user) return user;
    }

    // Fallback sang Local DB nếu chưa bật Postgres
    const localUser = findLocalUserById(session.userId);
    return localUser;
  } catch (err) {
    console.warn("[Auth] Failed to get current user:", err);
    return null;
  }
}
