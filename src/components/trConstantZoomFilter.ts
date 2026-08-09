/**
 * 【処理概要】
 *   `TrConstant` 行が ZOOM 一覧に載るか（display フラグ）と、ソート順（constValue → display_order）。
 *
 * 【パラメータ仕様】
 *   - `trConstantPassesDisplayActive(row)` … true の行だけ UI に出す
 *   - `compareTrConstantZoomSort(a,b)` … `Array.prototype.sort` 用 comparator
 */
import type { TrConstant } from "../MaterialList/types";

/** 表示フラグ（論理・文字列） */
export function trConstantPassesDisplayActive(row: TrConstant): boolean {
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

/** 定数値（const）昇順 → display_order 昇順 */
export function compareTrConstantZoomSort(a: TrConstant, b: TrConstant): number {
  const cmp = String(a.constValue ?? "").localeCompare(String(b.constValue ?? ""), "ja");
  if (cmp !== 0) {
    return cmp;
  }
  const ao = a.displayOrder;
  const bo = b.displayOrder;
  const av = ao == null ? Number.POSITIVE_INFINITY : ao;
  const bv = bo == null ? Number.POSITIVE_INFINITY : bo;
  return av - bv;
}
