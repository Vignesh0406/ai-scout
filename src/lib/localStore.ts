export type LocalCompanySnapshot = {
  id: number;
  name: string;
  domain?: string | null;
  website_url?: string | null;
  one_liner?: string | null;
  stage?: string | null;
  geo?: string | null;
};

export type LocalList = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  items: Array<LocalCompanySnapshot>;
};

export type LocalSavedSearch = {
  id: string;
  name: string;
  query: {
    q?: string;
    stage?: string;
    geo?: string;
    hasWebsite?: string;
  };
  created_at: string;
};

const LISTS_KEY = "vc_scout_lists_v1";
const SAVED_KEY = "vc_scout_saved_searches_v1";

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadLists(): LocalList[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<LocalList[]>(window.localStorage.getItem(LISTS_KEY), []);
}

export function saveLists(lists: LocalList[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function loadSavedSearches(): LocalSavedSearch[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<LocalSavedSearch[]>(window.localStorage.getItem(SAVED_KEY), []);
}

export function saveSavedSearches(saved: LocalSavedSearch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Array<Record<string, any>>) {
  const headerSet = rows.reduce<Set<string>>((s, r) => {
    Object.keys(r).forEach((k) => s.add(k));
    return s;
  }, new Set<string>());

  const headers = [...headerSet];

  const escape = (v: any) => {
    const str = v === null || v === undefined ? "" : String(v);
    const needs = /[\n\r,\"]/g.test(str);
    const escaped = str.replace(/\"/g, '""');
    return needs ? `"${escaped}"` : escaped;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as any)[h])).join(","));
  }
  return lines.join("\n");
}
