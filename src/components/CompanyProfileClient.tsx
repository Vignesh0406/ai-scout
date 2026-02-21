"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SaveToListClient from "@/components/SaveToListClient";

type Props = {
  companyId: number;
  initial: any;
};

export default function CompanyProfileClient({ companyId, initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState<any>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noteBody, setNoteBody] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function readErrorMessage(r: Response, fallback: string) {
    try {
      const j = await r.json().catch(() => null);
      const msg = (j as any)?.error;
      if (typeof msg === "string" && msg.trim()) return msg;
    } catch {}
    try {
      const t = await r.text();
      if (t && t.trim()) return t;
    } catch {}
    return fallback;
  }

  const match = data?.match;
  const reasons = useMemo(() => {
    if (!match?.reasons_json) return [];
    try {
      return JSON.parse(match.reasons_json);
    } catch {
      return [];
    }
  }, [match?.reasons_json]);

  const missing = useMemo(() => {
    if (!match?.missing_json) return [];
    try {
      return JSON.parse(match.missing_json);
    } catch {
      return [];
    }
  }, [match?.missing_json]);

  async function refresh() {
    try {
      setRefreshing(true);
      setError(null);
      const timestamp = Date.now();
      const r = await fetch(`/api/company/${companyId}?t=${timestamp}`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refresh company data");
      }
      const j = await r.json();
      setData(j);
      setSuccess("✓ Data refreshed");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(`⚠ ${err.message || "Failed to load company data"}`);
    } finally {
      setRefreshing(false);
    }
  }

  async function enrich() {
    try {
      setError(null);
      setSuccess(null);
      setBusy("enrich");
      
      const r = await fetch(`/api/company/${companyId}/enrich`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      
      if (!r.ok) {
        throw new Error(await readErrorMessage(r, "Enrichment failed"));
      }
      
      await refresh();
      setSuccess("✓ Enrichment completed successfully");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(`⚠ ${err.message || "Enrichment failed"}`);
    } finally {
      setBusy(null);
    }
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    try {
      setError(null);
      setSuccess(null);
      setBusy("note");
      
      const r = await fetch(`/api/company/${companyId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: noteBody })
      });
      
      if (!r.ok) {
        throw new Error(await readErrorMessage(r, "Failed to add note"));
      }
      
      setNoteBody("");
      await refresh();
      setSuccess("✓ Note added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`⚠ ${err.message || "Failed to add note"}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="animate-fade-in rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          <div className="flex items-start justify-between gap-3">
            <div>{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="animate-fade-in rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3">
          <div>{success}</div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="animate-fade-in-down rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-6 shadow-elevation-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-3xl font-bold text-zinc-950 dark:text-zinc-100">{data.company.name}</h1>
              {data.company.stage ? (
                <span className="rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">{data.company.stage}</span>
              ) : null}
              {data.company.geo ? (
                <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{data.company.geo}</span>
              ) : null}
            </div>
            <div className="mt-2 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">{data.company.domain ?? data.company.website_url ?? ""}</div>
            <div className="mt-3 text-base text-zinc-700 dark:text-zinc-300">{data.company.one_liner ?? ""}</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <button
              onClick={enrich}
              disabled={busy !== null}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {busy === "enrich" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  ✨ Enrich
                </>
              )}
            </button>
            <button
              onClick={refresh}
              disabled={busy !== null || refreshing}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              {refreshing ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-700 dark:border-t-zinc-300 rounded-full animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  ↻ Refresh
                </>
              )}
            </button>

            <SaveToListClient
              company={{
                id: data.company.id,
                name: data.company.name,
                domain: data.company.domain ?? null,
                website_url: data.company.website_url ?? null,
                one_liner: data.company.one_liner ?? null,
                stage: data.company.stage ?? null,
                geo: data.company.geo ?? null
              }}
            />

            {!data?.enrichment && typeof data?.company?.domain === "string" && data.company.domain.endsWith(".demo") ? (
              <button
                onClick={async () => {
                  const ok = confirm("Delete this demo company? This cannot be undone.");
                  if (!ok) return;
                  try {
                    setBusy("delete");
                    const r = await fetch(`/api/company/${companyId}`, { method: "DELETE" });
                    if (!r.ok) throw new Error(await readErrorMessage(r, "Failed to delete company"));
                    router.replace("/");
                    router.refresh();
                  } catch (err: any) {
                    setError(`⚠ ${err?.message ?? "Failed to delete company"}`);
                  } finally {
                    setBusy(null);
                  }
                }}
                disabled={busy !== null}
                className="btn-secondary border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-6 shadow-elevation-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-zinc-950 dark:text-zinc-100">Thesis Match</div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data.thesis?.name} v{data.thesis?.version}</div>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Explainable AI</div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
              <div className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Score</div>
              <div className="mt-3 text-5xl font-bold text-blue-600 dark:text-blue-400">{match?.score ?? "—"}</div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">out of 100</div>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Confidence</div>
              <div className="mt-3 text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                {match ? `${Math.round((match.confidence ?? 0) * 100)}%` : "—"}
              </div>
              <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">certainty level</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Why it matches</div>
            <div className="mt-3 space-y-3">
              {reasons.map((r: any) => (
                <div key={r.key} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.label}</div>
                    <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      +{Math.round((r.weight ?? 0) * 100)}%
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Evidence: {(r.evidence ?? []).join(", ")}</div>
                </div>
              ))}
              {reasons.length === 0 ? <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">No match computed yet. Click Enrich to analyze this company.</div> : null}
            </div>
          </div>

          {missing.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Missing signals</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {missing.slice(0, 12).map((m: any) => (
                  <span key={m.key} className="rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-5 shadow-sm">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Enrichment</div>
          {busy === "enrich" ? (
            <div className="mt-4 space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
              <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16"></div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20"></div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24"></div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">🔄 Fetching website content...</div>
            </div>
          ) : data.enrichment ? (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-zinc-600">
                <span className="font-medium">Fetched:</span> {new Date(data.enrichment.fetched_at).toLocaleDateString()}
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 mb-1">Summary</div>
                <div className="text-xs text-zinc-600 leading-relaxed">
                  {data.enrichment.summary || "Summary not available"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 mb-2">What they do</div>
                <ul className="text-xs text-zinc-600 space-y-1">
                  {(data.enrichment.whatTheyDo || []).map((item: string, idx: number) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 mb-2">Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {(data.enrichment.keywords || []).map((kw: string, idx: number) => (
                    <span key={idx} className="inline-block rounded-full bg-blue-100 px-2 py-1 text-[11px] text-blue-700">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 mb-2">Signals</div>
                <div className="space-y-1">
                  {(data.enrichment.signals || []).map((sig: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={sig.present ? "text-emerald-600" : "text-zinc-400"}>
                        {sig.present ? "✓" : "○"}
                      </span>
                      <span className={sig.present ? "text-zinc-700" : "text-zinc-500"}>
                        {sig.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-zinc-700 mb-1">Source URLs</div>
                <div className="text-xs space-y-0.5">
                  {(data.enrichment.pages || []).map((page: any, idx: number) => (
                    <div key={idx} className="text-blue-600 hover:underline break-all">
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-[11px]">
                        {page.title || page.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="text-xs font-medium text-amber-900">Not enriched yet</div>
              <div className="text-xs text-amber-800 mt-1">Click "Enrich" to fetch website content and extract insights.</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-6 shadow-elevation-2 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-zinc-950 dark:text-zinc-100">Diligence Notes</div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Meeting breadcrumbs and quick takeaways.</div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            {(data.notes ?? []).length} {(data.notes ?? []).length === 1 ? "note" : "notes"}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={noteBody}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteBody(e.target.value)}
            className="input-field flex-1"
            placeholder="Add a quick note..."
          />
          <button
            onClick={addNote}
            disabled={busy !== null || !noteBody.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {busy === "note" ? "Adding..." : "Add note"}
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {(data.notes ?? []).map((n: any) => (
            <div key={n.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString()}</div>
              <div className="mt-2 text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">{n.body}</div>
            </div>
          ))}
          {(data.notes ?? []).length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">No notes yet. Add your first observation!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
