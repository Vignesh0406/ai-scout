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
  const sql = getDb();
  const thesis = await getActiveThesis();
  
  const matches = await sql`
    SELECT score, confidence, reasons_json, missing_json, created_at 
    FROM thesis_matches 
    WHERE company_id = ${companyId} AND thesis_id = ${thesis.id}
  `;
  const match = matches[0] || null;

  const notes = await sql`
    SELECT id, body, created_at 
    FROM company_notes 
    WHERE company_id = ${companyId} 
    ORDER BY id DESC
  `;

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

  const sql = getDb();
  const existing = await sql`SELECT id FROM companies WHERE id = ${companyId}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`DELETE FROM companies WHERE id = ${companyId}`;
  return NextResponse.json({ ok: true });
}
