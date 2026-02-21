import { getDb } from "@/lib/db";
import type { Company } from "@/lib/types";
import { getActiveThesis, scoreTextAgainstThesis } from "@/lib/thesis";

export async function searchCompanies(params: {
  q?: string;
  stage?: string;
  geo?: string;
  hasWebsite?: string;
}): Promise<Array<Company & { match_score: number | null; match_reasons_json: string | null; match_missing_json: string | null }>> {
  const d = getDb();
  const thesis = getActiveThesis();
  const q = (params.q ?? "").trim();
  const stage = (params.stage ?? "").trim();
  const geo = (params.geo ?? "").trim();
  const hasWebsite = (params.hasWebsite ?? "").trim();

  const wheres: string[] = [];
  const bind: Record<string, unknown> = {};

  if (q) {
    wheres.push("(name like @q or domain like @q or one_liner like @q)");
    bind.q = `%${q}%`;
  }
  if (stage) {
    wheres.push("(stage like @stage)");
    bind.stage = `%${stage}%`;
  }
  if (geo) {
    wheres.push("(geo like @geo)");
    bind.geo = `%${geo}%`;
  }
  if (hasWebsite === "1") wheres.push("(website_url is not null and website_url != '')");
  if (hasWebsite === "0") wheres.push("(website_url is null or website_url = '')");

  const where = wheres.length ? `where ${wheres.join(" and ")}` : "";
  const rows = d
    .prepare(
      `
      select
        c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at,
        tm.score as match_score,
        tm.reasons_json as match_reasons_json,
        tm.missing_json as match_missing_json
      from companies c
      left join thesis_matches tm
        on tm.company_id = c.id and tm.thesis_id = @thesis_id
      ${where}
      order by c.updated_at desc
      limit 200
      `
    )
    .all({ ...bind, thesis_id: thesis.id }) as any;

  return rows;
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
  const d = getDb();
  const thesis = getActiveThesis();
  const q = (params.q ?? "").trim();
  const stage = (params.stage ?? "").trim();
  const geo = (params.geo ?? "").trim();
  const hasWebsite = (params.hasWebsite ?? "").trim();

  const limit = Math.max(1, Math.min(200, params.limit ?? 25));
  const offset = Math.max(0, params.offset ?? 0);

  const wheres: string[] = [];
  const bind: Record<string, unknown> = {};

  if (q) {
    wheres.push("(c.name like @q or c.domain like @q or c.one_liner like @q)");
    bind.q = `%${q}%`;
  }
  if (stage) {
    wheres.push("(c.stage like @stage)");
    bind.stage = `%${stage}%`;
  }
  if (geo) {
    wheres.push("(c.geo like @geo)");
    bind.geo = `%${geo}%`;
  }
  if (hasWebsite === "1") wheres.push("(c.website_url is not null and c.website_url != '')");
  if (hasWebsite === "0") wheres.push("(c.website_url is null or c.website_url = '')");

  const where = wheres.length ? `where ${wheres.join(" and ")}` : "";

  const sort = params.sort ?? "updated";
  const dir = params.dir === "asc" ? "asc" : "desc";

  const orderBy =
    sort === "name"
      ? `c.name ${dir}`
      : sort === "score"
        ? `coalesce(tm.score, -1) ${dir}, c.updated_at desc`
        : `c.updated_at ${dir}`;

  const totalRow = d
    .prepare(
      `
      select count(1) as n
      from companies c
      ${where}
      `
    )
    .get(bind as any) as any;

  const total = Number(totalRow?.n ?? 0);

  const rows = d
    .prepare(
      `
      select
        c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at,
        tm.score as match_score
      from companies c
      left join thesis_matches tm
        on tm.company_id = c.id and tm.thesis_id = @thesis_id
      ${where}
      order by ${orderBy}
      limit @limit offset @offset
      `
    )
    .all({ ...bind, thesis_id: thesis.id, limit, offset }) as any;

  return { total, rows };
}

export async function getCompany(id: number): Promise<Company | null> {
  const d = getDb();
  const row = d
    .prepare(
      "select id, name, domain, website_url, one_liner, stage, geo, created_at, updated_at from companies where id = ?"
    )
    .get(id) as Company | undefined;
  return row ?? null;
}

export async function getLatestEnrichment(companyId: number): Promise<null | {
  fetched_at: string;
  source_url: string;
  pages_json: string;
  extracted_json: string;
  combined_text: string;
}> {
  const d = getDb();
  const row = d
    .prepare(
      "select fetched_at, source_url, pages_json, extracted_json, combined_text from company_enrichment where company_id = ? order by id desc limit 1"
    )
    .get(companyId) as any;
  return row ?? null;
}

export async function computeAndUpsertMatch(companyId: number, text: string) {
  const d = getDb();
  const thesis = getActiveThesis();
  const scored = scoreTextAgainstThesis({ text, thesis: thesis.definition });

  d.prepare(
    `insert into thesis_matches(company_id, thesis_id, score, confidence, reasons_json, missing_json)
     values(@company_id, @thesis_id, @score, @confidence, @reasons_json, @missing_json)
     on conflict(company_id, thesis_id) do update set
       score=excluded.score,
       confidence=excluded.confidence,
       reasons_json=excluded.reasons_json,
       missing_json=excluded.missing_json,
       computed_at=datetime('now')
    `
  ).run({
    company_id: companyId,
    thesis_id: thesis.id,
    score: scored.score,
    confidence: scored.confidence,
    reasons_json: JSON.stringify(scored.reasons),
    missing_json: JSON.stringify(scored.missing)
  });

  const match = d
    .prepare(
      "select company_id, thesis_id, score, confidence, reasons_json, missing_json, computed_at from thesis_matches where company_id = ? and thesis_id = ?"
    )
    .get(companyId, thesis.id) as any;

  return { thesis: { id: thesis.id, name: thesis.name, version: thesis.version }, match };
}

export async function listLists(): Promise<Array<{ id: number; name: string; description: string | null }>> {
  const d = getDb();
  return d
    .prepare("select id, name, description from lists order by created_at desc")
    .all() as any;
}

export async function getList(listId: number): Promise<{ id: number; name: string; description: string | null } | null> {
  const d = getDb();
  const row = d
    .prepare("select id, name, description from lists where id = ?")
    .get(listId) as any;
  return row ?? null;
}

export async function listCompaniesInList(listId: number): Promise<Company[]> {
  const d = getDb();
  const rows = d
    .prepare(
      `
      select c.id, c.name, c.domain, c.website_url, c.one_liner, c.stage, c.geo, c.created_at, c.updated_at
      from list_items li
      join companies c on c.id = li.company_id
      where li.list_id = ?
      order by li.added_at desc
      `
    )
    .all(listId) as Company[];
  return rows;
}

export async function listSavedSearches(): Promise<Array<{ id: number; name: string; query_json: string }>> {
  const d = getDb();
  return d
    .prepare("select id, name, query_json from saved_searches order by created_at desc")
    .all() as any;
}
