import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const AddSchema = z.object({
  companyId: z.number()
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parsed = AddSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const d = getDb();
  d.prepare("insert or ignore into list_items(list_id, company_id) values(?, ?)").run(listId, parsed.data.companyId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parsed = AddSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const d = getDb();
  d.prepare("delete from list_items where list_id = ? and company_id = ?").run(listId, parsed.data.companyId);
  return NextResponse.json({ ok: true });
}
