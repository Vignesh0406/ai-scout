import { NextResponse } from "next/server";
import { getCompany, getLatestEnrichment } from "@/lib/repo";
import { getDb } from "@/lib/db";
import { getActiveThesis } from "@/lib/thesis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const company = await getCompany(companyId);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enrich = await getLatestEnrichment(companyId);
  const d = getDb();
  const thesis = getActiveThesis();
  const match = d
    .prepare(
      "select score, confidence, reasons_json, missing_json, computed_at from thesis_matches where company_id = ? and thesis_id = ?"
    )
    .get(companyId, thesis.id) as any;

  const notes = d
    .prepare("select id, body, created_at from notes where company_id = ? order by id desc")
    .all(companyId) as any[];

  return NextResponse.json({ company, enrichment: enrich, thesis: { id: thesis.id, name: thesis.name, version: thesis.version }, match, notes });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const d = getDb();
  const existing = d.prepare("select id from companies where id = ?").get(companyId) as any;
  if (!existing?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  d.prepare("delete from companies where id = ?").run(companyId);
  return NextResponse.json({ ok: true });
}
