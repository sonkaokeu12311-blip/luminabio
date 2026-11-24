/**
 * LIVEHUB EMAIL SERVICE
 * Hỗ trợ gửi mã xác thực OTP & thông báo nhận tiền Donate qua Email
 * Sử dụng Resend API (miễn phí 3,000 email/tháng, tương thích 100% với Cloudflare Pages & Next.js)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "LiveHub <onboarding@resend.dev>";

  // Nếu chưa cấu hình API Key, in mã ra console để kiểm tra khi dev
  if (!apiKey) {
    console.log("-------------------------------------------------------");
    console.log(`[EMAIL SIMULATOR] Gửi tới: ${to}`);
    console.log(`[EMAIL SIMULATOR] Tiêu đề: ${subject}`);
    console.log(`[EMAIL SIMULATOR] Bạn cần thêm RESEND_API_KEY vào .env để gửi email thực tế.`);
    console.log("-------------------------------------------------------");
    return { success: true, messageId: "simulated_local" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Email Error]:", data);
      return { success: false, error: data.message || "Gửi email thất bại" };
    }

    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error("[Email Send Exception]:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Gửi mã OTP xác thực đăng ký tài khoản
 */
export async function sendVerificationOtpEmail(toEmail: string, username: string, otpCode: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0b0b10; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #818cf8; font-size: 24px; margin: 0; font-weight: 900;">LIVEHUB</h1>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Nền tảng Bio-Link & Live Hub cho Creator</p>
      </div>
      
      <p style="font-size: 14px; color: #e4e4e7;">Xin chào <strong>@${username}</strong>,</p>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
        Mã xác thực tài khoản của bạn trên LiveHub là:
      </p>
      
      <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)); border: 1px solid rgba(129, 140, 248, 0.4); border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff;">${otpCode}</span>
      </div>
      
      <p style="font-size: 12px; color: #71717a;">Mã này có hiệu lực trong vòng 10 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[LiveHub] Mã xác thực tài khoản của bạn: ${otpCode}`,
    html,
  });
}

/**
 * Gửi email thông báo có người vừa Donate qua SePay VietQR
 */
export async function sendDonationAlertEmail({
  creatorEmail,
  creatorName,
  donorName,
  amount,
  message,
}: {
  creatorEmail: string;
  creatorName: string;
  donorName: string;
  amount: number;
  message?: string;
}) {
  const formattedAmount = amount.toLocaleString("vi-VN") + " đ";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0b0b10; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.4);">
          🎉 BẠN VỪA NHẬN ĐƯỢC DONATE!
        </span>
      </div>
      
      <p style="font-size: 14px; color: #e4e4e7;">Xin chào <strong>${creatorName}</strong>,</p>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
        Một người xem vừa chuyển khoản ủng hộ bạn qua SePay VietQR:
      </p>
      
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 28px; font-weight: bold; color: #34d399; margin-bottom: 8px;">+ ${formattedAmount}</div>
        <div style="font-size: 13px; color: #e4e4e7;"><strong>Người gửi:</strong> ${donorName || "Người hâm mộ ẩn danh"}</div>
        ${message ? `<div style="font-size: 13px; color: #a1a1aa; margin-top: 8px; font-style: italic;">"${message}"</div>` : ""}
      </div>
      
      <p style="font-size: 12px; color: #71717a; text-align: center;">Tiền đã được chuyển thẳng vào tài khoản ngân hàng của bạn qua SePay.</p>
    </div>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `🎉 [LiveHub] Bạn vừa nhận được ${formattedAmount} từ ${donorName || "người hâm mộ"}!`,
    html,
  });
}
