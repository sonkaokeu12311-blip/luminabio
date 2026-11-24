import crypto from "crypto";
import { encryptToken, decryptToken } from "./crypto";

const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // Tránh nhầm lẫn 0/O, 1/I/l

export interface CaptchaPayload {
  code: string;
  createdAt: number;
}

/**
 * Tạo một mã Captcha ngẫu nhiên kèm hình ảnh SVG và token mã hóa an toàn.
 */
export function generateCaptcha(): {
  svg: string;
  captchaToken: string;
} {
  // 1. Tạo chuỗi ký tự ngẫu nhiên (4 ký tự)
  let code = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, CHARS.length);
    code += CHARS[randomIndex];
  }

  // 2. Tạo hình ảnh SVG chống bot
  const width = 140;
  const height = 46;

  // Tạo các đường kẻ nhiễu (noise lines)
  const line1 = `<line x1="${crypto.randomInt(0, 20)}" y1="${crypto.randomInt(
    5,
    height - 5
  )}" x2="${crypto.randomInt(width - 30, width)}" y2="${crypto.randomInt(
    5,
    height - 5
  )}" stroke="rgba(129, 140, 248, 0.45)" stroke-width="2" />`;
  const line2 = `<line x1="${crypto.randomInt(0, 30)}" y1="${crypto.randomInt(
    10,
    height - 10
  )}" x2="${crypto.randomInt(width - 40, width)}" y2="${crypto.randomInt(
    10,
    height - 10
  )}" stroke="rgba(236, 72, 153, 0.4)" stroke-width="2" />`;

  // Tạo các chấm nhiễu
  let dots = "";
  for (let i = 0; i < 16; i++) {
    dots += `<circle cx="${crypto.randomInt(5, width - 5)}" cy="${crypto.randomInt(
      5,
      height - 5
    )}" r="${crypto.randomInt(1, 2)}" fill="rgba(255,255,255,0.25)" />`;
  }

  // Vẽ các chữ cái với độ nghiêng ngẫu nhiên
  const colors = ["#818cf8", "#a78bfa", "#f472b6", "#38bdf8", "#34d399"];
  let textElements = "";
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = 20 + i * 28;
    const y = 31 + crypto.randomInt(-3, 4);
    const rot = crypto.randomInt(-18, 19);
    const color = colors[crypto.randomInt(0, colors.length)];
    textElements += `<text x="${x}" y="${y}" font-family="monospace, sans-serif" font-weight="900" font-size="24" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #0e0e14; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.12);">
    ${dots}
    ${line1}
    ${line2}
    ${textElements}
  </svg>`;

  // 3. Mã hóa mã code + thời gian tạo bằng AES-256-GCM
  const payload: CaptchaPayload = {
    code: code.toUpperCase(),
    createdAt: Date.now(),
  };
  const captchaToken = encryptToken(JSON.stringify(payload));

  return {
    svg,
    captchaToken,
  };
}

/**
 * Xác thực mã Captcha người dùng nhập với Token mã hóa
 */
export function verifyCaptcha(
  userInput: string,
  captchaToken: string
): { isValid: boolean; message?: string } {
  if (!userInput || !captchaToken) {
    return { isValid: false, message: "Vui lòng nhập mã bảo vệ Captcha" };
  }

  try {
    const decrypted = decryptToken(captchaToken);
    const payload: CaptchaPayload = JSON.parse(decrypted);

    // Kiểm tra thời hạn 5 phút (300,000 ms)
    const isExpired = Date.now() - payload.createdAt > 5 * 60 * 1000;
    if (isExpired) {
      return { isValid: false, message: "Mã Captcha đã hết hạn, vui lòng làm mới" };
    }

    // So sánh không phân biệt hoa thường
    const isMatch =
      userInput.trim().toUpperCase() === payload.code.toUpperCase();
    if (!isMatch) {
      return { isValid: false, message: "Mã Captcha không chính xác, vui lòng thử lại" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, message: "Mã Captcha không hợp lệ" };
  }
}
