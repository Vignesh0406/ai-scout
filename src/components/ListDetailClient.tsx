"use client";

import Link from "next/link";
import { type ChangeEvent, useState } from "react";

type Props = {
  listId: number;
  initial: {
    list: { id: number; name: string; description: string | null };
    companies: Array<{ id: number; name: string; domain: string | null; one_liner: string | null; stage: string | null; geo: string | null }>;
  };
};

export default function ListDetailClient({ listId, initial }: Props) {
  const [data, setData] = useState<Props["initial"]>(initial);
  const [companyId, setCompanyId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch(`/api/lists/${listId}`, { cache: "no-store" });
    const j = await r.json();
    setData(j);
  }

  async function add() {
    setError(null);
    const id = Number(companyId);
    if (!Number.isFinite(id)) {
      setError("Enter a valid company id");
      return;
    }

    try {
      setBusy("add");
      const r = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId: id })
      });
      if (!r.ok) throw new Error(await r.text());
      setCompanyId("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to add");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    try {
      setBusy(`rm:${id}`);
      const r = await fetch(`/api/lists/${listId}/items`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId: id })
      });
      if (!r.ok) throw new Error(await r.text());
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.list.name}</h1>
          <div className="mt-1 text-sm text-zinc-600">{data.list.description ?? ""}</div>
        </div>
        <Link
          href="/lists"
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          Back to lists
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <div className="text-sm font-semibold text-zinc-950">Add company</div>
        <div className="text-xs text-zinc-600">Paste a company id (from the profile URL like /company/1).</div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={companyId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyId(e.target.value)}
            className="w-full rounded-xl border bg-zinc-50/50 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:bg-white focus:ring-2"
            placeholder="e.g. 1"
          />
          <button
            onClick={add}
            disabled={busy !== null}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {busy === "add" ? "Adding..." : "Add"}
          </button>
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="text-sm font-medium">Companies</div>
          <div className="text-xs text-zinc-600">{data.companies.length} in this list</div>
        </div>
        <div className="divide-y">
          {data.companies.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/company/${c.id}`} className="truncate text-sm font-semibold text-zinc-950 hover:underline">
                    {c.name}
                  </Link>
                  {c.stage ? (
                    <span className="rounded-full border bg-white px-2 py-0.5 text-[11px] text-zinc-700">{c.stage}</span>
                  ) : null}
                  {c.geo ? <span className="rounded-full border bg-white px-2 py-0.5 text-[11px] text-zinc-700">{c.geo}</span> : null}
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-600">{c.domain ?? ""}</div>
                <div className="mt-1 line-clamp-2 text-sm text-zinc-700">{c.one_liner ?? ""}</div>
              </div>
              <button
                onClick={() => remove(c.id)}
                disabled={busy !== null}
                className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {busy === `rm:${c.id}` ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
          {data.companies.length === 0 ? <div className="px-5 py-10 text-sm text-zinc-600">No companies in this list.</div> : null}
        </div>
      </div>
    </div>
  );
}
