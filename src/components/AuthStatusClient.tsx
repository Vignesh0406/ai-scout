"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthStatusClient({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    try {
      setBusy(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-[240px] truncate text-xs text-zinc-500 sm:block dark:text-zinc-400">{email}</div>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="btn-secondary"
      >
        {busy ? "Signing out..." : "Logout"}
      </button>
    </div>
  );
}
