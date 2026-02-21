import { notFound } from "next/navigation";
import CompanyProfileClient from "@/components/CompanyProfileClient";
import { getCompany, getLatestEnrichment } from "@/lib/repo";
import { getDb } from "@/lib/db";
import { getActiveThesis } from "@/lib/thesis";

export default async function CompanyPage({
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

  const initial = {
    company,
    enrichment,
    thesis: { id: thesis.id, name: thesis.name, version: thesis.version },
    match,
    notes
  };

  return <CompanyProfileClient companyId={companyId} initial={initial} />;
}
