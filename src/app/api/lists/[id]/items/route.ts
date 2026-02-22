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

  const sql = getDb();
  try {
    await sql`INSERT INTO company_list_items(list_id, company_id) VALUES(${listId}, ${parsed.data.companyId})`;
  } catch {
    // Ignore duplicate errors
  }
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

  const sql = getDb();
  await sql`DELETE FROM company_list_items WHERE list_id = ${listId} AND company_id = ${parsed.data.companyId}`;
  return NextResponse.json({ ok: true });
}
