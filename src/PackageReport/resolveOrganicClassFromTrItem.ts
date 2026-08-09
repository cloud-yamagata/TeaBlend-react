/**
 * 商品マスタ（tr_item）から茶区分（organic_class）を解決する。
 */
import type { TrItem } from "../MonthlyPlan/types";
import type { PackageLotEditFormData, PackageLotOrganicClassCode } from "./packageLotEditTypes";

export function toPackageLotOrganicClassCode(
  code: string | null | undefined
): PackageLotOrganicClassCode {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "A" || c === "B" || c === "C") return c;
  return "";
}

export function findTrItemByItemNo(trItems: TrItem[], itemNo: string): TrItem | undefined {
  const trimmed = itemNo.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return trItems.find((row) => row.itemNo === n);
}

/** 商品Noに対応する tr_item.organic_class を A/B/C に正規化 */
export function resolveOrganicClassFromTrItem(
  trItems: TrItem[],
  itemNo: string
): PackageLotOrganicClassCode {
  const item = findTrItemByItemNo(trItems, itemNo);
  return toPackageLotOrganicClassCode(item?.organicClass);
}

export function organicClassFieldsFromTrItem(
  trItems: TrItem[],
  itemNo: string
): Pick<PackageLotEditFormData, "organicClass" | "organicClassPrefix"> {
  const organicClass = resolveOrganicClassFromTrItem(trItems, itemNo);
  return { organicClass, organicClassPrefix: organicClass };
}
