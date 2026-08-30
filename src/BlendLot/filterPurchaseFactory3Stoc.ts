/**
 * ブレンドロット部品用: vi_factory3_stoc（商品分類別）
 */
import type { ViFactory3Stoc } from "../domain/masterTableEntityModels";
import type { BlendLotPartInputForm } from "./blendLotDisplayUtils";

/** 仕上品の商品分類NO */
export const BLEND_LOT_FINISHED_ITEM_GROUP_NO = 3;
/** 仕入品の商品分類NO */
export const BLEND_LOT_PURCHASE_ITEM_GROUP_NO = 4;

export type BlendLotStocZoomKind = "purchase" | "finished";

export type BlendLotPurchaseStocRow = {
  id: string;
  itemNo: number;
  organicClass: string;
  itemGroupNo: number;
  itemName: string;
  productNo: number;
  stocQuantity: number | null;
  source: ViFactory3Stoc;
};

export function filterFactory3StocByItemGroup(
  stocks: ViFactory3Stoc[],
  itemGroupNo: number,
  excludeProductNos: number[] = []
): BlendLotPurchaseStocRow[] {
  const excluded = new Set(excludeProductNos);
  const out: BlendLotPurchaseStocRow[] = [];

  for (const stoc of stocks) {
    const d = stoc.data;
    if (excluded.has(d.product_no)) continue;
    if ((d.stoc_quantity ?? 0) <= 0) continue;
    if (d.item_group_no !== itemGroupNo) continue;

    out.push({
      id: `${d.item_no}-${d.product_no}`,
      itemNo: d.item_no,
      organicClass: (d.organic_class ?? "").trim(),
      itemGroupNo: d.item_group_no,
      itemName: (d.item_name ?? "").trim(),
      productNo: d.product_no,
      stocQuantity: d.stoc_quantity,
      source: stoc
    });
  }

  return out.sort((a, b) => {
    if (a.itemNo !== b.itemNo) return a.itemNo - b.itemNo;
    return a.productNo - b.productNo;
  });
}

/** 仕入品（item_group_no=4） */
export function filterPurchaseFactory3Stoc(
  stocks: ViFactory3Stoc[],
  excludeProductNos: number[] = []
): BlendLotPurchaseStocRow[] {
  return filterFactory3StocByItemGroup(stocks, BLEND_LOT_PURCHASE_ITEM_GROUP_NO, excludeProductNos);
}

/** 仕上品（item_group_no=3） */
export function filterFinishedFactory3Stoc(
  stocks: ViFactory3Stoc[],
  excludeProductNos: number[] = []
): BlendLotPurchaseStocRow[] {
  return filterFactory3StocByItemGroup(stocks, BLEND_LOT_FINISHED_ITEM_GROUP_NO, excludeProductNos);
}

export function purchaseStocToPartInput(row: BlendLotPurchaseStocRow): BlendLotPartInputForm {
  return {
    itemNo: String(row.itemNo),
    organicClass: row.organicClass,
    itemGroupNo: String(row.itemGroupNo),
    itemName: row.itemName,
    productNo: String(row.productNo),
    stocQuantity: row.stocQuantity == null ? "" : String(row.stocQuantity),
    useQuantity: ""
  };
}

export function collectSelectedProductNos(partProductNos: Array<number | null | undefined>): number[] {
  const out: number[] = [];
  for (const n of partProductNos) {
    if (n != null && Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function blendLotStocZoomTitle(kind: BlendLotStocZoomKind): string {
  return kind === "purchase" ? "仕入品在庫" : "仕上品在庫";
}

export function blendLotStocZoomHint(kind: BlendLotStocZoomKind): string {
  const groupNo = kind === "purchase" ? BLEND_LOT_PURCHASE_ITEM_GROUP_NO : BLEND_LOT_FINISHED_ITEM_GROUP_NO;
  const label = kind === "purchase" ? "仕入品" : "仕上品";
  return `商品分類=${groupNo}（${label}）· 在庫数量 > 0 · 列ヘッダーでソート`;
}
