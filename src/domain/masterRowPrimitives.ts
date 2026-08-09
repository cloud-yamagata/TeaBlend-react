/**
 * 【処理概要】
 *   FastAPI の `list[dict]` 応答セルを、フロントで扱いやすい string / number / boolean に正規化。
 *
 * 【パラメータ仕様】
 *   各 `asXxx` は `unknown` を受け、型不整合時は空文字・0・null 等に落とす（画面は欠損扱い）。
 *
 * 【メンテナンス】
 *   新列を `domain/masterTableEntityModels.ts` に足したら、対応する `as*` をここに追加するか既存で足りるか判断する。
 */

export function asStr(v: unknown): string {
  if (v == null) {
    return "";
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
}

export function asStrOrNull(v: unknown): string | null {
  if (v == null) {
    return null;
  }
  const s = asStr(v);
  return s === "" ? null : s;
}

export function asInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.trunc(v);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return Math.trunc(n);
    }
  }
  return 0;
}

export function asIntOrNull(v: unknown): number | null {
  if (v == null || v === "") {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.trunc(v);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return Math.trunc(n);
    }
  }
  return null;
}

/** numeric / Decimal（JSON では number） */
export function asFiniteNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
}

export function asFiniteNumberOrNull(v: unknown): number | null {
  if (v == null || v === "") {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

export function asBoolOrNull(v: unknown): boolean | null {
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
}

/** date / datetime を ISO 文字列として保持（日付部分のみ必要なら slice(0,10)） */
export function asIsoDateTimeStrOrNull(v: unknown): string | null {
  if (v == null || v === "") {
    return null;
  }
  if (typeof v === "string") {
    return v;
  }
  return asStrOrNull(v);
}

export function asIsoDateStr(v: unknown): string {
  const s = asIsoDateTimeStrOrNull(v) ?? "";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** JSONB 配列（API が list または JSON 文字列で返す場合） */
export function asJsonArrayOrNull(v: unknown): unknown[] | null {
  if (v == null) {
    return null;
  }
  if (Array.isArray(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}
