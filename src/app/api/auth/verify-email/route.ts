import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail, verifyOtp, markUserVerified } from "@/lib/auth";

const BodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  const result = verifyOtp({ email, code: parsed.data.code });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  markUserVerified(email);
  return NextResponse.json({ ok: true });
}
