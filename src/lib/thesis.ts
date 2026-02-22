import { getDb } from "@/lib/db";
import type { Thesis, ThesisDefinition } from "@/lib/types";

export async function getActiveThesis(): Promise<Thesis & { definition: ThesisDefinition }> {
  const sql = getDb();
  const rows = await sql`SELECT id, name, version, definition_json FROM theses ORDER BY id ASC LIMIT 1`;
  const row = rows[0] as any;
  const definition = JSON.parse(row.definition_json) as ThesisDefinition;
  return { ...row, definition };
}

export function scoreTextAgainstThesis(params: {
  text: string;
  thesis: ThesisDefinition;
}): {
  score: number;
  confidence: number;
  reasons: Array<{ key: string; label: string; weight: number; evidence: string[] }>;
  missing: Array<{ key: string; label: string }>; 
} {
  const haystack = params.text.toLowerCase();

  const reasons: Array<{ key: string; label: string; weight: number; evidence: string[] }> = [];
  const missing: Array<{ key: string; label: string }> = [];

  let weightedSum = 0;
  let maxSum = 0;

  for (const s of params.thesis.signals) {
    maxSum += s.weight;
    const hits = s.any.filter((k) => haystack.includes(k.toLowerCase()));
    if (hits.length > 0) {
      weightedSum += s.weight;
      reasons.push({ key: s.key, label: s.label, weight: s.weight, evidence: hits.slice(0, 5) });
    } else {
      missing.push({ key: s.key, label: s.label });
    }
  }

  const raw = maxSum === 0 ? 0 : weightedSum / maxSum;
  const score = Math.round(raw * 100);
  const coverage = params.thesis.signals.length === 0 ? 0 : reasons.length / params.thesis.signals.length;
  const confidence = Math.round(coverage * 100) / 100;

  return { score, confidence, reasons, missing };
}
