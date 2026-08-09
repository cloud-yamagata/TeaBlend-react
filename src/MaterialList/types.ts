/**
 * 【処理概要】
 *   原料一覧画面とシステム定数 ZOOM が共有する型。API 正規化後の形（camelCase）。
 *
 * 【パラメータ仕様】
 *   - `TrConstant` … `constantRepository` が snake / Pascal 混在キーから正規化
 *   - `TeMaterial` … `te_material` 一覧1行。列追加時は `recordNormalize.normalizeMaterial` も更新
 */

/** システム定数 tr_constant */
export type TrConstant = {
  constField: string;
  /** DB 列 const（定数値） */
  constValue: string;
  constName: string;
  displayOrder: number | null;
  display: boolean | null;
};

export type TeMaterial = {
  materialNo: number | null;
  year: number | null;
  purchase: string | null;
  purchaseNo: string | null;
  purchaseDate: string | null;
  variety: string | null;
  teaLife: string | null;
  organicClass: string | null;
  teaType: string | null;
  teaRank: string | null;
  fieldNo: string | null;
  producer: string | null;
  cost: number | null;
  materialName: string | null;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  remarks: string | null;
  updateTime: string | null;
};
