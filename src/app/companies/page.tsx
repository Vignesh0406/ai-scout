import Link from "next/link";
import { searchCompaniesPaged } from "@/lib/repo";
import SaveSearchClient from "@/components/SaveSearchClient";
import AddCompanyClient from "@/components/AddCompanyClient";
import LogoutButtonClient from "@/components/LogoutButtonClient";

function qs(base: URLSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  return next.toString();
}

export default async function CompaniesPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    geo?: string;
    hasWebsite?: string;
    sort?: "updated" | "score" | "name";
    dir?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const stage = sp.stage ?? "";
  const geo = sp.geo ?? "";
  const hasWebsite = sp.hasWebsite ?? "";
  const sort = sp.sort ?? "updated";
  const dir = sp.dir ?? "desc";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const { total, rows } = await searchCompaniesPaged({ q, stage, geo, hasWebsite, sort, dir, limit: pageSize, offset });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const base = new URLSearchParams();
  if (q) base.set("q", q);
  if (stage) base.set("stage", stage);
  if (geo) base.set("geo", geo);
  if (hasWebsite) base.set("hasWebsite", hasWebsite);
  if (sort) base.set("sort", sort);
  if (dir) base.set("dir", dir);

  const headerLink = (col: "updated" | "score" | "name") => {
    const nextDir = sort === col && dir === "desc" ? "asc" : "desc";
    return `/companies?${qs(base, { sort: col, dir: nextDir, page: "1" })}`;
  };

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Companies</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Discover, enrich, score, and take action.</div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto md:items-end">
            <div className="flex gap-3 w-full md:w-auto">
              <LogoutButtonClient />
              <AddCompanyClient />
            </div>
            <div className="w-full md:w-[520px]">
              <SaveSearchClient />
            </div>
          </div>
        </div>
      </div>

      <form className="card grid grid-cols-1 gap-6 p-6 md:grid-cols-12" action="/companies">
        <div className="md:col-span-12 form-group">
          <label className="label">Search</label>
          <input name="q" defaultValue={q} className="input-field" placeholder="e.g. compliance automation, AI safety" />
        </div>
        <div className="md:col-span-4 form-group">
          <label className="label">Stage</label>
          <input name="stage" defaultValue={stage} className="input-field" placeholder="Seed, Series A" />
        </div>
        <div className="md:col-span-4 form-group">
          <label className="label">Geo</label>
          <input name="geo" defaultValue={geo} className="input-field" placeholder="US, EU, IN" />
        </div>
        <div className="md:col-span-4 form-group">
          <label className="label">Website</label>
          <select name="hasWebsite" defaultValue={hasWebsite} className="input-field cursor-pointer">
            <option value="">Any</option>
            <option value="1">Has website</option>
            <option value="0">No website</option>
          </select>
        </div>
        <div className="md:col-span-12 flex items-center justify-end gap-3">
          <Link className="btn-secondary" href="/companies">
            Clear
          </Link>
          <button className="btn-primary" type="submit">
            Apply
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 py-4">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Results</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {total} total · page {page} / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50/60 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-300">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">
                  <Link className="hover:underline" href={headerLink("name")}>
                    Company
                  </Link>
                </th>
                <th className="px-6 py-3 text-left font-semibold">Stage</th>
                <th className="px-6 py-3 text-left font-semibold">Geo</th>
                <th className="px-6 py-3 text-left font-semibold">
                  <Link className="hover:underline" href={headerLink("score")}>
                    Thesis score
                  </Link>
                </th>
                <th className="px-6 py-3 text-left font-semibold">
                  <Link className="hover:underline" href={headerLink("updated")}>
                    Updated
                  </Link>
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-950 dark:text-zinc-100 truncate max-w-[320px]">{c.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[320px]">{c.domain ?? c.website_url ?? ""}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{c.stage ?? "—"}</td>
                  <td className="px-6 py-4 text-zinc-700 dark:text-zinc-200">{c.geo ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-200">
                      {typeof c.match_score === "number" ? `${c.match_score}%` : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">{new Date(c.updated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link className="btn-secondary" href={`/companies/${c.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-zinc-600 dark:text-zinc-300" colSpan={6}>
                    No companies found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/80 px-6 py-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Showing {rows.length} of {total}</div>
          <div className="flex items-center gap-2">
            <Link
              className="btn-secondary"
              href={`/companies?${qs(base, { page: String(Math.max(1, page - 1)) })}`}
              aria-disabled={page <= 1}
            >
              Prev
            </Link>
            <Link
              className="btn-secondary"
              href={`/companies?${qs(base, { page: String(Math.min(totalPages, page + 1)) })}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
