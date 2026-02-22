import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { listLists, listCompaniesInList } from "@/lib/repo";

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function GET() {
  const lists = await listLists();
  
  const listsWithItems = await Promise.all(
    lists.map(async (list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      items: await listCompaniesInList(list.id)
    }))
  );

  return NextResponse.json({ lists: listsWithItems });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sql = getDb();
  const result = await sql`INSERT INTO company_lists(name, description) VALUES(${parsed.data.name}, ${parsed.data.description ?? null}) RETURNING id`;

  return NextResponse.json({ ok: true, id: result[0]?.id });
}
