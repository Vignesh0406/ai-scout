"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { loadSavedSearches, saveSavedSearches, uid, type LocalSavedSearch } from "@/lib/localStore";

export default function SaveSearchClient() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [name, setName] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const query = useMemo(() => {
    return {
      q: sp.get("q") ?? "",
      stage: sp.get("stage") ?? "",
      geo: sp.get("geo") ?? "",
      hasWebsite: sp.get("hasWebsite") ?? ""
    };
  }, [sp]);

  const hasAny = !!(query.q || query.stage || query.geo || query.hasWebsite);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        {hasAny ? "Save this search for quick reruns." : "Add filters to enable saving a search."}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field sm:w-72"
          placeholder="Saved search name"
          disabled={!hasAny}
        />
        <button
          className="btn-secondary"
          disabled={!hasAny || !name.trim()}
          onClick={() => {
            const item: LocalSavedSearch = {
              id: uid("search"),
              name: name.trim(),
              query,
              created_at: new Date().toISOString()
            };
            const existing = loadSavedSearches();
            saveSavedSearches([item, ...existing]);
            setName("");
            setSavedMsg("Saved");
            window.setTimeout(() => setSavedMsg(null), 1500);
          }}
          type="button"
        >
          Save search
        </button>
        {savedMsg ? <div className="text-xs text-emerald-600 dark:text-emerald-400">{savedMsg}</div> : null}
      </div>

      <div className="hidden">{pathname}</div>
    </div>
  );
}
