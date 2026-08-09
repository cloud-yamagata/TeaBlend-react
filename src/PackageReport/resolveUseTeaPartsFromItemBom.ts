/**
 * 商品原料茶対照表（tr_item_bom）と商品マスタ（tr_item）から使用茶品名を解決する。
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { TrItem } from "../MonthlyPlan/types";

export type UseTeaPartEntry = {
  itemNo: string;
  itemName: string;
};

const intStr = (v: number | null | undefined): string =>
  v == null || !Number.isFinite(v) ? "" : String(Math.trunc(v));

const parseParentItemNo = (itemNo: string): number | null => {
  const trimmed = itemNo.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const findTrItemByNo = (trItems: TrItem[], itemNo: number): TrItem | undefined =>
  trItems.find((row) => row.itemNo === itemNo);

/** 親商品Noで BOM を検索し、原料茶の item_no / item_name を1件返す */
export function resolveUseTeaPartsFromItemBom(
  cache: MasterEntityCache,
  trItems: TrItem[],
  parentItemNo: string
): UseTeaPartEntry[] {
  const parentNo = parseParentItemNo(parentItemNo);
  if (parentNo == null) return [];

  const bom = cache.tr_item_bom.find((row) => row.data.parent_item_no === parentNo);
  if (!bom) return [];

  const childNo = bom.data.child_item_no;
  const item = findTrItemByNo(trItems, childNo);
  return [
    {
      itemNo: intStr(childNo),
      itemName: (item?.itemName ?? "").trim()
    }
  ];
}

/** 使用茶品名エリア（1列2行）用のフォーム値へ展開 */
export function useTeaPartsToFormFields(parts: UseTeaPartEntry[]): {
  useTeaItemNo1: string;
  useTeaItemName1: string;
  useTeaItemNo2: string;
  useTeaItemName2: string;
  partName: string;
} {
  const entry = parts[0];
  const itemName = entry?.itemName ?? "";

  return {
    useTeaItemNo1: entry?.itemNo ?? "",
    useTeaItemName1: itemName,
    useTeaItemNo2: "",
    useTeaItemName2: "",
    partName: itemName
  };
}
