import { z } from "zod";
import { NextResponse } from "next/server";
import { getUserByEmail, normalizeEmail, verifyPassword, createSession } from "@/lib/auth";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "No account found. Please register." }, { status: 400 });
  if (!user.verified_at) return NextResponse.json({ error: "Please verify your email with OTP first." }, { status: 400 });
  if (!user.password_hash) return NextResponse.json({ error: "Account missing password. Please register again." }, { status: 400 });

  const ok = await verifyPassword(parsed.data.password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });

  const sessionUser = await createSession(email);
  return NextResponse.json({ ok: true, user: sessionUser });
}
