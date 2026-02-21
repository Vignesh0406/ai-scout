"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { downloadText, loadLists, saveLists, toCsv, uid, type LocalList } from "@/lib/localStore";

export default function ListsLocalClient() {
  const [lists, setLists] = useState<LocalList[]>([]);

  useEffect(() => {
    setLists(loadLists());
  }, []);

  const totalItems = useMemo(() => lists.reduce((n, l) => n + (l.items?.length ?? 0), 0), [lists]);

  function createList() {
    const name = prompt("List name");
    if (!name || !name.trim()) return;
    const description = prompt("Description (optional)") ?? "";

    const next: LocalList = {
      id: uid("list"),
      name: name.trim(),
      description: description.trim() || undefined,
      created_at: new Date().toISOString(),
      items: []
    };

    const updated = [next, ...lists];
    setLists(updated);
    saveLists(updated);
  }

  function removeList(listId: string) {
    const ok = confirm("Delete this list? This cannot be undone.");
    if (!ok) return;
    const updated = lists.filter((l) => l.id !== listId);
    setLists(updated);
    saveLists(updated);
  }

  function exportAllJson() {
    downloadText(`lists_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(lists, null, 2), "application/json");
  }

  function exportAllCsv() {
    const rows = lists.flatMap((l) =>
      (l.items ?? []).map((c) => ({
        list_id: l.id,
        list_name: l.name,
        company_id: c.id,
        company_name: c.name,
        domain: c.domain ?? "",
        website_url: c.website_url ?? "",
        stage: c.stage ?? "",
        geo: c.geo ?? ""
      }))
    );
    downloadText(`lists_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), "text/csv");
  }

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Lists</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Shortlists stored in localStorage. {lists.length} lists · {totalItems} items
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" type="button" onClick={exportAllJson}>
              Export JSON
            </button>
            <button className="btn-secondary" type="button" onClick={exportAllCsv}>
              Export CSV
            </button>
            <button className="btn-primary" type="button" onClick={createList}>
              New list
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {lists.map((l) => (
            <div key={l.id} className="px-6 py-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/lists/${encodeURIComponent(l.id)}`} className="font-semibold text-zinc-950 dark:text-zinc-100 hover:underline truncate">
                    {l.name}
                  </Link>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">({(l.items ?? []).length})</span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{l.description ?? ""}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link className="btn-secondary" href={`/lists/${encodeURIComponent(l.id)}`}>
                  Open
                </Link>
                <button className="btn-secondary" type="button" onClick={() => removeList(l.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {lists.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-600 dark:text-zinc-300">No lists yet.</div>
          ) : null}
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Storage key: <code className="font-mono">vc_scout_lists_v1</code>
      </div>
    </div>
  );
}
