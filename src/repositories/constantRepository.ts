/**
 * 【処理概要】
 *   `tr_constant` API 呼び出しと、各種キー表記ゆれを `TrConstant` 型に正規化。
 *
 * 【パラメータ仕様】
 *   - `fetchAllTrConstants()` … GET `/tr_constant/`
 *   - `fetchTrConstants(constField)` … クエリ `const_field` 付き
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchJsonArray } from "../lib/apiFetch";
import type { TrConstant } from "../MaterialList/types";

const asString = (v: unknown): string | null => {
  if (v == null) {
    return null;
  }
  if (typeof v === "string") {
    return v;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v);
  }
  if (typeof v === "boolean") {
    return v ? "true" : "false";
  }
  return String(v);
};

const asNumberOrNull = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
};

const asBooleanOrNull = (v: unknown): boolean | null => {
  if (typeof v === "boolean") {
    return v;
  }
  if (v == null) {
    return null;
  }
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1") {
    return true;
  }
  if (s === "false" || s === "0") {
    return false;
  }
  return null;
};

function normalizeTrConstant(row: Record<string, unknown>): TrConstant {
  const constVal = asString(
    row.const ?? row.constValue ?? row.ConstValue ?? row.const_value ?? row.value
  );
  return {
    constField: asString(row.constField ?? row.const_field ?? row.ConstField ?? row.field) ?? "",
    constValue: constVal ?? "",
    constName: asString(row.constName ?? row.const_name ?? row.ConstName ?? row.name) ?? "",
    displayOrder: asNumberOrNull(row.displayOrder ?? row.display_order ?? row.DisplayOrder),
    display: asBooleanOrNull(row.display ?? row.Display)
  };
}

/** システム定数を全件取得（const_field 未指定） */
export async function fetchAllTrConstants(): Promise<TrConstant[]> {
  const url = `${getMaterialApiBaseUrl()}/tr_constant/`;
  const raw = await fetchJsonArray(url);
  return raw.map((r) => normalizeTrConstant((r ?? {}) as Record<string, unknown>));
}

/** const_field を指定してシステム定数を取得（単体用途・フォールバック） */
export async function fetchTrConstants(constField: string): Promise<TrConstant[]> {
  const q = encodeURIComponent(constField);
  const url = `${getMaterialApiBaseUrl()}/tr_constant/?const_field=${q}`;
  const raw = await fetchJsonArray(url);
  return raw.map((r) => normalizeTrConstant((r ?? {}) as Record<string, unknown>));
}
