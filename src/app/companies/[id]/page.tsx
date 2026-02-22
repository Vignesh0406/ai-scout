import { notFound } from "next/navigation";
import CompanyProfileClient from "@/components/CompanyProfileClient";
import { getCompany, getLatestEnrichment } from "@/lib/repo";
import { getDb } from "@/lib/db";
import { getActiveThesis } from "@/lib/thesis";

export default async function CompaniesCompanyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) notFound();

  const company = await getCompany(companyId);
  if (!company) notFound();

  const enrichment = await getLatestEnrichment(companyId);
  const sql = getDb();
  const thesis = await getActiveThesis();
  
  const matchRows = await sql`
    SELECT score, confidence, reasons_json, missing_json, created_at 
    FROM thesis_matches 
    WHERE company_id = ${companyId} AND thesis_id = ${thesis.id}
  `;
  const match = matchRows[0] || null;

  const notes = await sql`
    SELECT id, body, created_at 
    FROM company_notes 
    WHERE company_id = ${companyId} 
    ORDER BY id DESC
  `;

  const initial = {
    company,
    enrichment,
    thesis: { id: thesis.id, name: thesis.name, version: thesis.version },
    match,
    notes
  };

  return <CompanyProfileClient companyId={companyId} initial={initial} />;
}
