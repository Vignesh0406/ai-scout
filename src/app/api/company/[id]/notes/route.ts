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

  const d = getDb();
  d.prepare("insert into notes(company_id, body) values(?, ?)").run(companyId, parsed.data.body);
  d.prepare("update companies set updated_at=datetime('now') where id = ?").run(companyId);

  const notes = d
    .prepare("select id, body, created_at from notes where company_id = ? order by id desc")
    .all(companyId) as any[];

  return NextResponse.json({ ok: true, notes });
}
