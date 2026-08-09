/**
 * 商品原料対照表一覧の構築
 * WPF: tr_item(system_class=1) LEFT JOIN tr_item_bom LEFT JOIN tr_item(原料)
 */
import { atom } from "jotai";
import { masterEntityCacheAtom, masterTrItemsAtom } from "../repository/masterData";
import type { ItemBomCorrectRow } from "./types";

export const itemBomCorrectListAtom = atom((get): ItemBomCorrectRow[] => {
  const items = get(masterTrItemsAtom);
  const bomByParent = new Map(
    get(masterEntityCacheAtom).tr_item_bom.map((b) => [b.data.parent_item_no, b.data.child_item_no] as const)
  );
  const itemByNo = new Map(
    items.filter((i) => i.itemNo != null).map((i) => [i.itemNo as number, i] as const)
  );

  const rows: ItemBomCorrectRow[] = [];
  for (const item of items) {
    if (item.itemNo == null) continue;
    if ((item.systemClass ?? "").trim() !== "1") continue;

    const childNo = bomByParent.get(item.itemNo) ?? null;
    const child = childNo != null ? itemByNo.get(childNo) : undefined;

    rows.push({
      id: String(item.itemNo),
      itemNo: item.itemNo,
      organicClass: item.organicClass ?? "",
      itemName: item.itemName ?? "",
      childItemNo: childNo,
      useOrganicClass: child?.organicClass ?? "",
      useItemName: child?.itemName ?? ""
    });
  }
  rows.sort((a, b) => a.itemNo - b.itemNo);
  return rows;
});
