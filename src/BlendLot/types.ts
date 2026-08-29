/**
 * ブレンドロット（te_blend_lot）のフロント型。
 * `lotPartInfo` は API が JSON 文字列／オブジェクト混在しうるため `unknown`。
 */
export type TeBlendLot = {
  productNo: number | null;
  workDate: string | null;
  itemNo: number | null;
  itemName: string | null;
  unitWeight: number | null;
  lotPartInfo: unknown;
  remarks: string | null;
};
