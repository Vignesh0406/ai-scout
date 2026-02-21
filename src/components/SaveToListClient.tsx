"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadLists,
  saveLists,
  uid,
  type LocalCompanySnapshot,
  type LocalList
} from "@/lib/localStore";

export default function SaveToListClient({ company }: { company: LocalCompanySnapshot }) {
  const [lists, setLists] = useState<LocalList[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const l = loadLists();
    setLists(l);
    setSelected(l[0]?.id ?? "");
  }, []);

  const canAdd = useMemo(() => {
    if (!selected) return false;
    const list = lists.find((l) => l.id === selected);
    if (!list) return false;
    return !list.items.some((it) => it.id === company.id);
  }, [lists, selected, company.id]);

  function persist(updated: LocalList[]) {
    setLists(updated);
    saveLists(updated);
  }

  function createList() {
    const name = prompt("New list name");
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
    persist(updated);
    setSelected(next.id);
    setMsg("List created");
    window.setTimeout(() => setMsg(null), 1500);
  }

  function add() {
    const list = lists.find((l) => l.id === selected);
    if (!list) return;

    if (list.items.some((it) => it.id === company.id)) {
      setMsg("Already in list");
      window.setTimeout(() => setMsg(null), 1500);
      return;
    }

    const updated = lists.map((l) =>
      l.id === selected
        ? {
            ...l,
            items: [
              {
                id: company.id,
                name: company.name,
                domain: company.domain ?? null,
                website_url: company.website_url ?? null,
                one_liner: company.one_liner ?? null,
                stage: company.stage ?? null,
                geo: company.geo ?? null
              },
              ...l.items
            ]
          }
        : l
    );

    persist(updated);
    setMsg("Saved to list");
    window.setTimeout(() => setMsg(null), 1500);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        className="input-field sm:w-56 cursor-pointer"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Select list</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <button className="btn-secondary" type="button" onClick={createList}>
        New list
      </button>

      <button className="btn-primary" type="button" disabled={!selected || !canAdd} onClick={add}>
        Save
      </button>

      {msg ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{msg}</div> : null}

      <div className="hidden">{uid("noop")}</div>
    </div>
  );
}
