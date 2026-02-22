"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function AddCompanyClient() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          setError(null);
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState("");
  const [geo, setGeo] = useState("");

  function reset() {
    setName("");
    setWebsiteUrl("");
    setOneLiner("");
    setStage("");
    setGeo("");
    setError(null);
  }

  async function create() {
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("Enter a company name");
      return;
    }

    try {
      setBusy(true);
      const r = await fetch("/api/company", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: websiteUrl.trim() || null,
          one_liner: oneLiner.trim() || null,
          stage: stage.trim() || null,
          geo: geo.trim() || null
        })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Failed to add company");

      setSuccess("✓ Company added successfully");
      reset();
      
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        if (typeof j?.id === "number") {
          router.push(`/companies/${j.id}`);
        } else {
          router.refresh();
        }
      }, 1500);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add company");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button 
        type="button" 
        className="btn-primary flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <span>✨</span>
        <span>Add Company</span>
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 md:pt-20 animate-fade-in">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-md transition-all duration-200"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                aria-label="Close"
              />

              <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-scale-in">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 p-6 bg-white dark:bg-zinc-950">
                  <div>
                    <div className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
                      Add a Company
                    </div>
                    <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      Add new companies to discover and enrich with real web data.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    onClick={() => {
                      setOpen(false);
                      setError(null);
                    }}
                    title="Close (Esc)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div ref={scrollRef} className="max-h-[calc(85vh-96px)] overflow-y-auto p-6 space-y-6">
              <div className="form-group">
                <label className="label font-semibold text-zinc-700 dark:text-zinc-300">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Acme Security"
                  disabled={busy}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="label font-semibold text-zinc-700 dark:text-zinc-300">Website URL</label>
                <input
                  value={websiteUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setWebsiteUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://company.com"
                  disabled={busy}
                />
                <p className="mt-1 text-xs text-zinc-500">This helps us enrich your company data</p>
              </div>

              <div className="form-group">
                <label className="label font-semibold text-zinc-700 dark:text-zinc-300">One-liner</label>
                <input
                  value={oneLiner}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOneLiner(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Security posture for enterprises"
                  disabled={busy}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="form-group">
                  <label className="label font-semibold text-zinc-700 dark:text-zinc-300">Funding Stage</label>
                  <input
                    value={stage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStage(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Seed, Series A"
                    disabled={busy}
                  />
                </div>
                <div className="form-group">
                  <label className="label font-semibold text-zinc-700 dark:text-zinc-300">Geography</label>
                  <input
                    value={geo}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setGeo(e.target.value)}
                    className="input-field"
                    placeholder="e.g. US, EU, IN"
                    disabled={busy}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400 font-medium flex items-start gap-3 animate-fade-in">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>{error}</span>
                </div>
              ) : null}

              {success ? (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-3 animate-fade-in">
                  <span className="text-lg leading-none">{success.charAt(0)}</span>
                  <span>{success}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-zinc-200/80 dark:border-zinc-800/80 pt-6">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={reset} 
                  disabled={busy}
                >
                  Reset
                </button>
                <button 
                  type="button" 
                  className="btn-primary flex items-center justify-center gap-2 min-w-[140px]"
                  onClick={create} 
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Add Company</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
