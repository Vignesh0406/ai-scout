import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const BodySchema = z.object({
  body: z.string().min(1)
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sql = getDb();
  await sql`INSERT INTO company_notes(company_id, body) VALUES(${companyId}, ${parsed.data.body})`;
  await sql`UPDATE companies SET updated_at = NOW() WHERE id = ${companyId}`;

  const notes = await sql`
    SELECT id, body, created_at 
    FROM company_notes 
    WHERE company_id = ${companyId} 
    ORDER BY id DESC
  `;

  return NextResponse.json({ ok: true, notes });
}
