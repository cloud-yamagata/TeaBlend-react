/**
 * 仕上品受入（PartsReceive）型定義
 */
export type PartsReceiveRow = {
  id: string;
  productDate: string | null;
  itemNo: number;
  productNo: number;
  itemName: string;
  makeYear: string;
  count: string;
  productQuantity: number;
  factory2Stock: number;
  factory3Stock: number;
};

/** 受入編集フォーム（EditWindow 相当） */
export type PartsReceiveEditForm = {
  productDate: string;
  itemNo: number;
  productNo: number;
  itemName: string;
  makeYear: string;
  count: string;
  productQuantity: string;
  factory2Stock: string;
  factory3Stock: string;
  /** 移動先: 2=第2工場 / 3=第3工場 / null=未選択 */
  storeNo: 2 | 3 | null;
  transferDate: string;
  transferQuantity: string;
};

export function partsReceiveRowToEditForm(row: PartsReceiveRow): PartsReceiveEditForm {
  const fmt = (n: number) => (Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "");
  return {
    productDate: row.productDate ?? "",
    itemNo: row.itemNo,
    productNo: row.productNo,
    itemName: row.itemName,
    makeYear: row.makeYear,
    count: row.count,
    productQuantity: fmt(row.productQuantity),
    factory2Stock: fmt(row.factory2Stock),
    factory3Stock: fmt(row.factory3Stock),
    storeNo: null,
    transferDate: "",
    transferQuantity: ""
  };
}
