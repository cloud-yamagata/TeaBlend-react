/**
 * 仕上品仕入の対象商品解決（WPF StockRepository.Init / ItemList 相当）
 * tr_item: system_class='2', item_group_no=4, display=true
 */
import { trItemPassesDisplayActive } from "../components/trItemZoomFilter";
import type { TrItem } from "../MonthlyPlan/types";

export function isMaterialPurchaseTargetItem(item: TrItem): boolean {
  if (!trItemPassesDisplayActive(item)) return false;
  const systemClass = String(item.systemClass ?? "").trim();
  if (systemClass !== "2" && Number(systemClass) !== 2) return false;
  return Number(item.itemGroupNo) === 4;
}

export function resolveMaterialPurchaseItem(
  items: TrItem[],
  itemNo: number | null,
  itemName: string
): { itemNo: number; itemName: string } | null {
  const name = itemName.trim();
  const candidates = items.filter(isMaterialPurchaseTargetItem);

  if (itemNo != null && itemNo > 0) {
    const byNo = candidates.find((item) => Number(item.itemNo) === itemNo);
    if (byNo?.itemNo != null && byNo.itemName?.trim()) {
      return { itemNo: byNo.itemNo, itemName: byNo.itemName.trim() };
    }
  }

  if (!name) return null;

  const exact = candidates.find((item) => (item.itemName ?? "").trim() === name);
  if (exact?.itemNo != null && exact.itemName?.trim()) {
    return { itemNo: exact.itemNo, itemName: exact.itemName.trim() };
  }

  return null;
}
