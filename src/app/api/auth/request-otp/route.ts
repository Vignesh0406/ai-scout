import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOtpCode, storeOtp, normalizeEmail, createOrGetUser } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

const BodySchema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  await createOrGetUser(email);

  const code = generateOtpCode();
  await storeOtp({ email, code, ttlMinutes: 10 });

  const sent = await sendOtpEmail({ to: email, code });
  if (!sent.ok) {
    return NextResponse.json(
      { error: `Failed to send OTP email. ${sent.error ?? ""}`.trim() },
      { status: 500 }
    );
  }
  const devCode = sent.dev === true && process.env.NODE_ENV !== "production" ? code : undefined;
  return NextResponse.json({ ok: true, dev: sent.dev === true, code: devCode });
}
