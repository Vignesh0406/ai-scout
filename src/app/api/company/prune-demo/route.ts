import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export async function POST() {
  const token = (await cookies()).get("scout_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const d = getDb();
  const info = d.prepare("delete from companies where domain like '%.demo'").run();
  return NextResponse.json({ ok: true, deleted: info.changes });
}
