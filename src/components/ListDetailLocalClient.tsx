"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { downloadText, loadLists, saveLists, toCsv, type LocalList } from "@/lib/localStore";

export default function ListDetailLocalClient({ listId }: { listId: string }) {
  const [lists, setLists] = useState<LocalList[]>([]);
  const list = useMemo(() => lists.find((l) => l.id === listId) ?? null, [lists, listId]);

  useEffect(() => {
    setLists(loadLists());
  }, [listId]);

  function persist(updated: LocalList[]) {
    setLists(updated);
    saveLists(updated);
  }

  function removeCompany(companyId: number) {
    if (!list) return;
    const updated = lists.map((l) =>
      l.id === listId ? { ...l, items: l.items.filter((it) => it.id !== companyId) } : l
    );
    persist(updated);
  }

  function exportJson() {
    if (!list) return;
    downloadText(`list_${list.name}_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(list, null, 2), "application/json");
  }

  function exportCsv() {
    if (!list) return;
    const rows = (list.items ?? []).map((c) => ({
      company_id: c.id,
      company_name: c.name,
      domain: c.domain ?? "",
      website_url: c.website_url ?? "",
      one_liner: c.one_liner ?? "",
      stage: c.stage ?? "",
      geo: c.geo ?? ""
    }));
    downloadText(`list_${list.name}_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), "text/csv");
  }

  if (!list) {
    return (
      <div className="space-y-6">
        <div className="card p-8">
          <div className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">List not found</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">This list may have been deleted.</div>
          <div className="mt-4">
            <Link className="btn-secondary" href="/lists">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{list.name}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{list.description ?? ""}</div>
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{(list.items ?? []).length} companies</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" type="button" onClick={exportJson}>
              Export JSON
            </button>
            <button className="btn-secondary" type="button" onClick={exportCsv}>
              Export CSV
            </button>
            <Link className="btn-secondary" href="/lists">
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {(list.items ?? []).map((c) => (
            <div key={c.id} className="px-6 py-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link className="font-semibold text-zinc-950 dark:text-zinc-100 hover:underline" href={`/companies/${c.id}`}>
                  {c.name}
                </Link>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[520px]">{c.domain ?? c.website_url ?? ""}</div>
                <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200 line-clamp-2">{c.one_liner ?? ""}</div>
              </div>
              <button className="btn-secondary" type="button" onClick={() => removeCompany(c.id)}>
                Remove
              </button>
            </div>
          ))}

          {(list.items ?? []).length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-600 dark:text-zinc-300">
              No companies in this list. Add some from a company profile.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
