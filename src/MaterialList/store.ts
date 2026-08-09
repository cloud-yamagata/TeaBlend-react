/**
 * 【処理概要】
 *   原料一覧の Jotai 状態: マスタ参照、検索ドラフト／適用条件、一覧のフィルタ済み derived atom。
 *
 * 【パラメータ仕様】
 *   - `MaterialSearchFilters` … `year`（下2桁年度）, `purchaseDate`（yyyy-mm-dd）, テキスト3種（部分一致）
 *   - `materialSearchExecutedAtom` … false の間 `filteredMaterialListAtom` は空配列（初回は一覧非表示）
 *
 * 【メンテナンス】
 *   条件追加時は `matchesMaterialFilters` と検索 UI（`MaterialListPage`）の両方を更新。
 */
import { atom } from "jotai";
import { matchesContains, normalizeDateToYmd } from "../lib/searchNormalize";
import { masterMaterialsAtom, masterTrConstantsAtom } from "../repository/masterData";
import type { TeMaterial } from "./types";

/** マスタ本体は repository/masterData の原子と同一参照 */
export const materialListAtom = masterMaterialsAtom;
export const trConstantListAtom = masterTrConstantsAtom;

/** 検索に適用済みの条件（「検索」押下時に更新） */
export type MaterialSearchFilters = {
  /** 年（17〜99。下2桁が年度に一致） */
  year: string;
  /** yyyy-mm-dd（type=date） */
  purchaseDate: string;
  purchase: string;
  producer: string;
  materialName: string;
};

export const materialSearchDefaultFilters = (): MaterialSearchFilters => ({
  year: "",
  purchaseDate: "",
  purchase: "",
  producer: "",
  materialName: ""
});

export const materialSearchAppliedFiltersAtom = atom<MaterialSearchFilters>(materialSearchDefaultFilters());
/** 検索フォームの入力中（「検索」前）。一覧はこの atom を購読しない */
export const materialSearchDraftAtom = atom<MaterialSearchFilters>(materialSearchDefaultFilters());
/** true のときのみ一覧に行を出す（初期は false でヘッダーのみ） */
export const materialSearchExecutedAtom = atom(false);

const isMaterialFiltersAllEmpty = (f: MaterialSearchFilters): boolean => {
  return (
    f.year.trim() === "" &&
    f.purchaseDate.trim() === "" &&
    f.purchase.trim() === "" &&
    f.producer.trim() === "" &&
    f.materialName.trim() === ""
  );
};

const matchesMaterialFilters = (row: TeMaterial, f: MaterialSearchFilters): boolean => {
  if (f.year.trim() !== "") {
    const y = Number(f.year.trim());
    if (!Number.isFinite(y) || row.year == null || row.year % 100 !== y) {
      return false;
    }
  }

  if (f.purchaseDate.trim() !== "") {
    const rowYmd = normalizeDateToYmd(row.purchaseDate);
    const want = f.purchaseDate.trim();
    if (rowYmd !== want) {
      return false;
    }
  }

  if (!matchesContains(String(row.purchase ?? ""), f.purchase)) {
    return false;
  }
  if (!matchesContains(String(row.producer ?? ""), f.producer)) {
    return false;
  }
  if (!matchesContains(String(row.materialName ?? ""), f.materialName)) {
    return false;
  }

  return true;
};

export const filteredMaterialListAtom = atom((get) => {
  if (!get(materialSearchExecutedAtom)) {
    return [];
  }

  const source = get(materialListAtom);
  const f = get(materialSearchAppliedFiltersAtom);

  if (isMaterialFiltersAllEmpty(f)) {
    return source;
  }

  return source.filter((row) => matchesMaterialFilters(row, f));
});
