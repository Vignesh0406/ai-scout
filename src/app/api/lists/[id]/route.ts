import { NextResponse } from "next/server";
import { getList, listCompaniesInList } from "@/lib/repo";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const list = await getList(listId);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const companies = await listCompaniesInList(listId);
  return NextResponse.json({ list, companies });
}
