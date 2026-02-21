import nodemailer from "nodemailer";

export async function sendOtpEmail(params: { to: string; code: string }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.log(`DEV_OTP for ${params.to}: ${params.code}`);
    return { ok: true, dev: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to: params.to,
      subject: "Your login code",
      text: `Your verification code is ${params.code}. It expires in 10 minutes.`,
      html: `<div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
        <h2 style="margin: 0 0 12px 0">Verification code</h2>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 2px">${params.code}</div>
        <div style="margin-top: 12px; color: #52525b">This code expires in 10 minutes.</div>
      </div>`
    });

    return { ok: true, dev: false };
  } catch (err: any) {
    console.error("SMTP_SEND_FAILED", {
      host,
      port,
      user,
      to: params.to,
      message: err?.message,
      code: err?.code,
      response: err?.response
    });
    return { ok: false, dev: false, error: err?.message ?? "SMTP send failed" };
  }
}
