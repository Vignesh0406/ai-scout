import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export async function POST() {
  const token = (await cookies()).get("scout_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  const result = await sql`DELETE FROM companies WHERE domain LIKE '%.demo'`;
  return NextResponse.json({ ok: true, deleted: result.count });
}
