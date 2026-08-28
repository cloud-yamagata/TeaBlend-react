/**
 * レポート実行結果に対する一覧抽出（API 再通信なし）。
 */
import { matchesContains } from "../lib/searchNormalize";
import type { ReportExtractDef } from "./registry";
import { reportWeatherKey } from "./reportWeather";

export type ReportExtractValues = Record<string, string>;

export function buildDefaultExtractValues(extract: ReportExtractDef[]): ReportExtractValues {
  const out: ReportExtractValues = {};
  for (const e of extract) {
    out[e.key] = e.default ?? "";
  }
  return out;
}

export function isExtractActive(extract: ReportExtractDef[], values: ReportExtractValues): boolean {
  return extract.some((e) => (values[e.key] ?? "").trim() !== "");
}

const toYearMonthNumber = (year: unknown, month: unknown): number | null => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return y * 100 + m;
};

const parseYearMonthInput = (raw: string): number | null => {
  const t = raw.trim();
  if (!t) return null;
  const m = t.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return toYearMonthNumber(m[1], m[2]);
};

const matchesExtract = (
  row: Record<string, unknown>,
  def: ReportExtractDef,
  value: string
): boolean => {
  const q = value.trim();
  if (!q) return true;

  if (def.type === "text") {
    const field = def.field ?? def.key;
    return matchesContains(String(row[field] ?? ""), q);
  }

  if (def.type === "yearMonth") {
    const fromYm = parseYearMonthInput(q);
    if (fromYm == null) return true;
    const rowYm = toYearMonthNumber(row[def.yearField ?? "year"], row[def.monthField ?? "month"]);
    if (rowYm == null) return false;
    return rowYm >= fromYm;
  }

  if (def.type === "weather") {
    const field = def.field ?? def.key;
    return reportWeatherKey(row[field]) === q;
  }

  return true;
};

export function applyReportExtract(
  rows: Record<string, unknown>[],
  extract: ReportExtractDef[],
  values: ReportExtractValues
): Record<string, unknown>[] {
  if (extract.length === 0) return rows;
  if (!isExtractActive(extract, values)) return rows;
  return rows.filter((row) => extract.every((e) => matchesExtract(row, e, values[e.key] ?? "")));
}
