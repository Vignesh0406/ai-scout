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

  const d = getDb();
  const websiteUrl = parsed.data.website_url ?? null;
  const domain = websiteUrl ? domainFromUrl(websiteUrl) : null;

  try {
    const info = d
      .prepare(
        "insert into companies(name, domain, website_url, one_liner, stage, geo, updated_at) values(?, ?, ?, ?, ?, ?, datetime('now'))"
      )
      .run(
        parsed.data.name,
        domain,
        websiteUrl,
        parsed.data.one_liner ?? null,
        parsed.data.stage ?? null,
        parsed.data.geo ?? null
      );

    return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch (e: any) {
    const msg = e?.message ?? "Failed to add company";
    if (/UNIQUE constraint failed: companies\.domain/i.test(msg)) {
      const existing = d.prepare("select id from companies where domain = ?").get(domain) as any;
      if (existing?.id) {
        return NextResponse.json({ ok: true, id: Number(existing.id), existed: true });
      }
      return NextResponse.json({ error: "A company with this domain already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add company" }, { status: 500 });
  }
}
