import { getDb } from "@/lib/db";
import type { Company } from "@/lib/types";
import { getActiveThesis, scoreTextAgainstThesis } from "@/lib/thesis";

export async function searchCompanies(params: {
  q?: string;
  stage?: string;
  geo?: string;
  hasWebsite?: string;
}): Promise<Array<Company & { match_score: number | null; match_reasons_json: string | null; match_missing_json: string | null }>> {
  const sql = getDb();
  const thesis = await getActiveThesis();
  const q = (params.q ?? "").trim();
  const stage = (params.stage ?? "").trim();
  const geo = (params.geo ?? "").trim();
  const hasWebsite = (params.hasWebsite ?? "").trim();

  const conditions: string[] = [];
  if (q) conditions.push(`(c.name ILIKE $1 OR c.domain ILIKE $1 OR c.one_liner ILIKE $1)`);
  if (stage) conditions.push(`c.stage ILIKE $2`);
  if (geo) conditions.push(`c.geo ILIKE $3`);
  if (hasWebsite === "1") conditions.push("(c.website_url IS NOT NULL AND c.website_url != '')");
  if (hasWebsite === "0") conditions.push("(c.website_url IS NULL OR c.website_url = '')");

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const queryStr = `
    SELECT
      c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at,
      tm.score as match_score,
      tm.reasons_json as match_reasons_json,
      tm.missing_json as match_missing_json
    FROM companies c
    LEFT JOIN thesis_matches tm ON tm.company_id = c.id AND tm.thesis_id = $4
    ${whereClause}
    ORDER BY c.updated_at DESC
    LIMIT 200
  `;

  const rows = await sql.unsafe(queryStr, [
    `%${q}%`,
    `%${stage}%`,
    `%${geo}%`,
    thesis.id
  ]);

  return rows as any;
}

export async function searchCompaniesPaged(params: {
  q?: string;
  stage?: string;
  geo?: string;
  hasWebsite?: string;
  sort?: "updated" | "score" | "name";
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<{ total: number; rows: Array<Company & { match_score: number | null }> }> {
  const sql = getDb();
  const thesis = await getActiveThesis();
  const q = (params.q ?? "").trim();
  const stage = (params.stage ?? "").trim();
  const geo = (params.geo ?? "").trim();
  const hasWebsite = (params.hasWebsite ?? "").trim();

  const limit = Math.max(1, Math.min(200, params.limit ?? 25));
  const offset = Math.max(0, params.offset ?? 0);

  const conditions: string[] = [];
  if (q) conditions.push(`(c.name ILIKE $1 OR c.domain ILIKE $1 OR c.one_liner ILIKE $1)`);
  if (stage) conditions.push(`c.stage ILIKE $2`);
  if (geo) conditions.push(`c.geo ILIKE $3`);
  if (hasWebsite === "1") conditions.push("(c.website_url IS NOT NULL AND c.website_url != '')");
  if (hasWebsite === "0") conditions.push("(c.website_url IS NULL OR c.website_url = '')");

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const sort = params.sort ?? "updated";
  const dir = params.dir === "asc" ? "ASC" : "DESC";

  const orderBy =
    sort === "name"
      ? `c.name ${dir}`
      : sort === "score"
        ? `COALESCE(tm.score, -1) ${dir}, c.updated_at DESC`
        : `c.updated_at ${dir}`;

  const countQueryStr = `
    SELECT COUNT(*) as n
    FROM companies c
    ${whereClause}
  `;

  const totalResults = await sql.unsafe(countQueryStr, [
    `%${q}%`,
    `%${stage}%`,
    `%${geo}%`
  ]);

  const total = Number(totalResults[0]?.n ?? 0);

  const rowsQueryStr = `
    SELECT
      c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at,
      tm.score as match_score
    FROM companies c
    LEFT JOIN thesis_matches tm ON tm.company_id = c.id AND tm.thesis_id = $4
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $5
    OFFSET $6
  `;

  const rows = await sql.unsafe(rowsQueryStr, [
    `%${q}%`,
    `%${stage}%`,
    `%${geo}%`,
    thesis.id,
    limit,
    offset
  ]);

  return { total, rows: rows as any };
}

export async function getCompany(id: number): Promise<Company | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, domain, website_url, one_liner, stage, geo, created_at, updated_at 
    FROM companies 
    WHERE id = ${id}
  `;
  return (rows[0] as any) || null;
}

export async function getLatestEnrichment(companyId: number): Promise<null | {
  fetched_at: string;
  source_url: string;
  pages_json: string;
  extracted_json: string;
  combined_text: string;
}> {
  const sql = getDb();
  const rows = await sql`
    SELECT fetched_at, source_url, pages_json, extracted_json, combined_text 
    FROM company_enrichment 
    WHERE company_id = ${companyId} 
    ORDER BY id DESC 
    LIMIT 1
  `;
  return (rows[0] as any) || null;
}

export async function computeAndUpsertMatch(companyId: number, text: string) {
  const sql = getDb();
  const thesis = await getActiveThesis();
  const scored = scoreTextAgainstThesis({ text, thesis: thesis.definition });

  await sql`
    INSERT INTO thesis_matches(company_id, thesis_id, score, confidence, reasons_json, missing_json)
    VALUES(${companyId}, ${thesis.id}, ${scored.score}, ${scored.confidence}, ${JSON.stringify(scored.reasons)}, ${JSON.stringify(scored.missing)})
    ON CONFLICT(company_id, thesis_id) 
    DO UPDATE SET
      score = EXCLUDED.score,
      confidence = EXCLUDED.confidence,
      reasons_json = EXCLUDED.reasons_json,
      missing_json = EXCLUDED.missing_json,
      created_at = NOW()
  `;

  const matches = await sql`
    SELECT company_id, thesis_id, score, confidence, reasons_json, missing_json, created_at 
    FROM thesis_matches 
    WHERE company_id = ${companyId} AND thesis_id = ${thesis.id}
  `;

  const match = matches[0];
  return { thesis: { id: thesis.id, name: thesis.name, version: thesis.version }, match };
}

export async function listLists(): Promise<Array<{ id: number; name: string; description: string | null }>> {
  const sql = getDb();
  return await sql`
    SELECT id, name, description 
    FROM company_lists 
    ORDER BY created_at DESC
  `;
}

export async function getList(listId: number): Promise<{ id: number; name: string; description: string | null } | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, description 
    FROM company_lists 
    WHERE id = ${listId}
  `;
  return (rows[0] as any) || null;
}

export async function listCompaniesInList(listId: number): Promise<Company[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at
    FROM company_list_items li
    JOIN companies c ON c.id = li.company_id
    WHERE li.list_id = ${listId}
    ORDER BY li.added_at DESC
  `;
  return rows as any;
}

export async function listSavedSearches(): Promise<Array<{ id: number; name: string; query_json: string }>> {
  const sql = getDb();
  return await sql`
    SELECT id, name, query_json 
    FROM saved_searches 
    ORDER BY created_at DESC
  ` as any;
}
