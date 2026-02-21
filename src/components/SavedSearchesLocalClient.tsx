"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSavedSearches, saveSavedSearches, type LocalSavedSearch } from "@/lib/localStore";

function toCompaniesUrl(q: LocalSavedSearch["query"]) {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.stage) sp.set("stage", q.stage);
  if (q.geo) sp.set("geo", q.geo);
  if (q.hasWebsite) sp.set("hasWebsite", q.hasWebsite);
  return `/companies?${sp.toString()}`;
}

export default function SavedSearchesLocalClient() {
  const router = useRouter();
  const [saved, setSaved] = useState<LocalSavedSearch[]>([]);

  useEffect(() => {
    setSaved(loadSavedSearches());
  }, []);

  const count = useMemo(() => saved.length, [saved]);

  function remove(id: string) {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    saveSavedSearches(updated);
  }

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Saved searches</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Stored in localStorage · {count} saved</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {saved.map((s) => (
            <div key={s.id} className="px-6 py-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-950 dark:text-zinc-100 truncate">{s.name}</div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono break-all bg-zinc-50/60 dark:bg-zinc-900/30 px-3 py-2 rounded-lg">
                  {JSON.stringify(s.query)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    router.push(toCompaniesUrl(s.query));
                  }}
                >
                  Run
                </button>
                <button className="btn-secondary" type="button" onClick={() => remove(s.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {saved.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-600 dark:text-zinc-300">
              No saved searches yet. Save one from the Companies page.
            </div>
          ) : null}
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Storage key: <code className="font-mono">vc_scout_saved_searches_v1</code>
      </div>
    </div>
  );
}
