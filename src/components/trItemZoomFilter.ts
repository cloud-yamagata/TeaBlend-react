/**
 * 【処理概要】
 *   商品マスタ（`TrItem`）の ZOOM 用フィルタ: 表示フラグ、固定条件（システム区分等）、ソート。
 *
 * 【パラメータ仕様】
 *   - `trItemPassesDisplayActive` / `trItemPassesFixedFilters` / `compareTrItemZoomSort` … `TrItemMasterZoomModal` から利用
 *
 * 【メンテナンス】
 *   レポートの商品 ZOOM は `ReportFilters.tsx` で `systemClass: "2"` 等を渡す。条件変更時は両方確認。
 */
import type { TrItem } from "../MonthlyPlan/types";
import type { TrItemZoomFilterParams } from "./trItemZoomTypes";

function isNonEmptyString(v: string | null | undefined): boolean {
  return v != null && String(v).trim() !== "";
}

/**
 * 表示フラグが「表示」のとき true。
 * DB/API が boolean・文字列のどちらでも判定（True / true / 1 等。False・false・0 で除外）。
 */
export function trItemPassesDisplayActive(row: TrItem): boolean {
  const d = row.display as unknown;
  if (d === true) {
    return true;
  }
  if (d === false) {
    return false;
  }
  const s = String(d ?? "").trim().toLowerCase();
  if (s === "") {
    return false;
  }
  if (s === "false" || s === "0" || s === "no" || s === "f") {
    return false;
  }
  return s === "true" || s === "1" || s === "yes" || s === "t";
}

/** システム区分など、数値としても一致しうるコードの比較（"2" と 2 / "02"） */
function matchesCodeLikeField(rowValue: string | null | undefined, param: string): boolean {
  const a = String(rowValue ?? "").trim();
  const b = param.trim();
  if (a === b) {
    return true;
  }
  const an = Number(a);
  const bn = Number(b);
  return Number.isFinite(an) && Number.isFinite(bn) && an === bn;
}

/** パラメータで指定された固定条件（未指定はスキップ） */
export function trItemPassesFixedFilters(row: TrItem, p: TrItemZoomFilterParams | undefined): boolean {
  if (!p) {
    return true;
  }
  if (isNonEmptyString(p.systemClass)) {
    if (!matchesCodeLikeField(row.systemClass, String(p.systemClass))) {
      return false;
    }
  }
  if (isNonEmptyString(p.organicClass)) {
    if ((row.organicClass ?? "").trim() !== String(p.organicClass).trim()) {
      return false;
    }
  }
  if (p.itemGroupNo != null && Number.isFinite(p.itemGroupNo)) {
    const rv = row.itemGroupNo;
    const want = Number(p.itemGroupNo);
    if (rv == null || Number(rv) !== want) {
      return false;
    }
  }
  return true;
}

/** SORT: display_order 昇順 → item_no 昇順（null は後ろ） */
export function compareTrItemZoomSort(a: TrItem, b: TrItem): number {
  const ao = a.displayOrder;
  const bo = b.displayOrder;
  const av = ao == null ? Number.POSITIVE_INFINITY : ao;
  const bv = bo == null ? Number.POSITIVE_INFINITY : bo;
  if (av !== bv) {
    return av - bv;
  }
  const an = a.itemNo;
  const bn = b.itemNo;
  const ax = an == null ? Number.POSITIVE_INFINITY : an;
  const bx = bn == null ? Number.POSITIVE_INFINITY : bn;
  return ax - bx;
}
