/**
 * 商品マスタ一覧の構築・絞り込み
 * チェックグループはロット製造実績一覧と同じ（全OFF/全ON = 絞り込みなし）
 */
import { atom } from "jotai";
import { masterTrItemsAtom } from "../repository/masterData";
import { matchesContains } from "../lib/searchNormalize";
import {
  defaultItemCorrectSearchFilters,
  trItemToRow,
  type ItemCorrectItemGroupCheck,
  type ItemCorrectOrganicClassCheck,
  type ItemCorrectRow,
  type ItemCorrectSearchFilters,
  type ItemCorrectSystemClassCheck
} from "./types";

export const itemCorrectListAtom = atom((get): ItemCorrectRow[] => {
  const rows: ItemCorrectRow[] = [];
  for (const item of get(masterTrItemsAtom)) {
    const row = trItemToRow(item);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.itemNo - b.itemNo);
  return rows;
});

export const itemCorrectSearchDraftAtom = atom<ItemCorrectSearchFilters>(defaultItemCorrectSearchFilters());
export const itemCorrectSearchAppliedFiltersAtom = atom<ItemCorrectSearchFilters | null>(null);
export const itemCorrectSearchExecutedAtom = atom(false);

export const isItemCorrectSearchEnabled = (): boolean => true;

/** グループ内のチェックから絞込用コード集合（条件なしは null） */
function selectedCodesOrNull<const T extends string>(
  items: readonly { code: T; checked: boolean }[]
): Set<T> | null {
  const checked = items.filter((i) => i.checked);
  if (checked.length === 0 || checked.length === items.length) {
    return null;
  }
  return new Set(checked.map((i) => i.code));
}

export function systemClassCodesFromCheck(checks: ItemCorrectSystemClassCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "1", checked: checks.product },
    { code: "2", checked: checks.finish }
  ]);
}

export function organicClassCodesFromCheck(checks: ItemCorrectOrganicClassCheck): Set<string> | null {
  return selectedCodesOrNull([
    { code: "A", checked: checks.organic },
    { code: "B", checked: checks.pesticideFree },
    { code: "C", checked: checks.general }
  ]);
}

export function itemGroupCodesFromCheck(checks: ItemCorrectItemGroupCheck): Set<string> | null {
  return selectedCodesOrNull(
    (["1", "3", "4", "5", "6", "7", "9"] as const).map((code) => ({
      code,
      checked: checks[code]
    }))
  );
}

const matchesFilters = (row: ItemCorrectRow, filters: ItemCorrectSearchFilters): boolean => {
  if (filters.itemName.trim() && !matchesContains(row.itemName, filters.itemName)) {
    return false;
  }

  const systemCodes = systemClassCodesFromCheck(filters.systemClassCheck);
  if (systemCodes && !systemCodes.has(row.systemClass.trim())) return false;

  const organicCodes = organicClassCodesFromCheck(filters.organicClassCheck);
  if (organicCodes && !organicCodes.has(row.organicClass.trim().toUpperCase())) return false;

  const groupCodes = itemGroupCodesFromCheck(filters.itemGroupCheck);
  if (groupCodes && !groupCodes.has(String(row.itemGroupNo))) return false;

  return true;
};

export const filteredItemCorrectListAtom = atom((get): ItemCorrectRow[] => {
  if (!get(itemCorrectSearchExecutedAtom)) return [];
  const filters = get(itemCorrectSearchAppliedFiltersAtom);
  const source = get(itemCorrectListAtom);
  if (!filters) return source;
  return source.filter((row) => matchesFilters(row, filters));
});
