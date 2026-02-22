import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const BodySchema = z.object({
  name: z.string().min(2).max(120),
  website_url: z.string().url().nullable().optional(),
  one_liner: z.string().max(280).nullable().optional(),
  stage: z.string().max(60).nullable().optional(),
  geo: z.string().max(60).nullable().optional()
});

function domainFromUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sql = getDb();
  const websiteUrl = parsed.data.website_url ?? null;
  const domain = websiteUrl ? domainFromUrl(websiteUrl) : null;

  try {
    const result = await sql`
      INSERT INTO companies(name, domain, website_url, one_liner, stage, geo, updated_at) 
      VALUES(${parsed.data.name}, ${domain}, ${websiteUrl}, ${parsed.data.one_liner ?? null}, ${parsed.data.stage ?? null}, ${parsed.data.geo ?? null}, NOW())
      RETURNING id
    `;

    const id = result[0]?.id;
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    const msg = e?.message ?? "Failed to add company";
    if (/unique/i.test(msg) && domain) {
      const existing = await sql`SELECT id FROM companies WHERE domain = ${domain}`;
      if (existing.length > 0) {
        return NextResponse.json({ ok: true, id: existing[0].id, existed: true });
      }
      return NextResponse.json({ error: "A company with this domain already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add company" }, { status: 500 });
  }
}
