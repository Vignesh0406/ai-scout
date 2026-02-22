import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getCompany, computeAndUpsertMatch } from "@/lib/repo";
import { fetchAndExtract } from "@/lib/enrich";

const BodySchema = z.object({
  url: z.string().min(1).optional()
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const company = await getCompany(companyId);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bodyJson = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const url = parsed.data.url ?? company.website_url ?? company.domain ?? "";
  if (!url) return NextResponse.json({ error: "No website to enrich" }, { status: 400 });

  try {
    const enriched = await fetchAndExtract({ url });
    const sql = getDb();

    await sql`
      INSERT INTO company_enrichment(company_id, source_url, pages_json, extracted_json, combined_text) 
      VALUES(${companyId}, ${enriched.sourceUrl}, ${JSON.stringify(enriched.pages)}, ${JSON.stringify(enriched.extracted)}, ${enriched.combinedText})
    `;

    await sql`UPDATE companies SET updated_at = NOW() WHERE id = ${companyId}`;

    const match = await computeAndUpsertMatch(companyId, enriched.combinedText);

    return NextResponse.json({ ok: true, enrichment: enriched, match });
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to enrich company";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
