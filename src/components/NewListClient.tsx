"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";

export default function NewListClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setBusy(true);
      const r = await fetch("/api/lists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined })
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      router.push(`/lists/${j.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create list");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New list</h1>
        <div className="mt-1 text-sm text-zinc-600">Create a shortlist to track companies over time.</div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-700">Name</label>
          <input
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-zinc-50/50 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:bg-white focus:ring-2"
            placeholder="e.g. Infra thesis"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700">Description</label>
          <input
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-zinc-50/50 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:bg-white focus:ring-2"
            placeholder="optional"
          />
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button
          onClick={create}
          disabled={busy}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
