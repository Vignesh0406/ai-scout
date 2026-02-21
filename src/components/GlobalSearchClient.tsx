"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GlobalSearchClient({ hrefBase = "/companies" }: { hrefBase?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState("");

  useEffect(() => {
    const current = sp.get("q") ?? "";
    setQ(current);
  }, [sp]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams(sp.toString());
        if (q.trim()) params.set("q", q.trim());
        else params.delete("q");
        params.delete("page");
        router.push(`${hrefBase}?${params.toString()}`);
      }}
      className="w-full"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="input-field"
        placeholder="Search companies..."
      />
    </form>
  );
}
