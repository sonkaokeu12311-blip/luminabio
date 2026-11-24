import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Bọc các truy vấn Prisma với giới hạn thời gian (Timeout).
 * Tránh tình trạng treo server khi chưa bật hoặc không kết nối được Database.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 800
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("DB_TIMEOUT")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

let isDbAvailable: boolean | null = null;
let lastDbCheckTime = 0;

/**
 * Kiểm tra nhanh kết nối Database.
 * Nếu Database đang tắt, tự động bỏ qua để Web không bao giờ bị đơ/treo.
 */
export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();
  // Nếu vừa kiểm tra thấy Database tắt, cache kết quả 15 giây để không làm chậm request kế tiếp
  if (isDbAvailable === false && now - lastDbCheckTime < 15000) {
    return false;
  }

  try {
    await withDbTimeout(prisma.$queryRaw`SELECT 1`, 500);
    isDbAvailable = true;
    lastDbCheckTime = now;
    return true;
  } catch {
    isDbAvailable = false;
    lastDbCheckTime = now;
    return false;
  }
}

export default prisma;
