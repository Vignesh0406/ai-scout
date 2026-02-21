"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PruneDemoClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn-secondary border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
      disabled={busy}
      onClick={async () => {
        const ok = confirm("Delete all demo (*.demo) companies? This cannot be undone.");
        if (!ok) return;
        try {
          setBusy(true);
          await fetch("/api/company/prune-demo", { method: "POST" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Deleting..." : "Delete demo"}
    </button>
  );
}
