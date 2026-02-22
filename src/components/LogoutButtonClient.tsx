"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButtonClient() {
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
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="btn-secondary text-sm"
    >
      {busy ? "Signing out..." : "Logout"}
    </button>
  );
}
