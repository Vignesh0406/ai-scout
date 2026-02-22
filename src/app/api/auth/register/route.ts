import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { generateOtpCode, hashPassword, normalizeEmail, storeOtp, getUserByEmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

const PasswordSchema = z
  .string()
  .min(8)
  .max(200)
  .refine((v) => /[a-z]/.test(v), "Password must include a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Password must include an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must include a number")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Password must include a special character");

const BodySchema = z.object({
  username: z.string().min(2).max(40),
  email: z.string().email(),
  password: PasswordSchema
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sql = getDb();
  const email = normalizeEmail(parsed.data.email);

  const existing = await getUserByEmail(email);
  if (existing?.verified_at) {
    return NextResponse.json({ error: "Account already exists. Please sign in." }, { status: 400 });
  }

  const password_hash = await hashPassword(parsed.data.password);

  try {
    if (existing?.id) {
      await sql`UPDATE users SET username = ${parsed.data.username}, password_hash = ${password_hash} WHERE id = ${existing.id}`;
    } else {
      await sql`INSERT INTO users(email, username, password_hash) VALUES(${email}, ${parsed.data.username}, ${password_hash})`;
    }
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json({ error: "This email is already registered. Please sign in or use a different email." }, { status: 400 });
    }
    throw err;
  }

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
