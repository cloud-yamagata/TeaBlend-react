/**
 * 販売計画商品マスタ一覧の構築・絞り込み
 */
import { atom } from "jotai";
import { masterEntityCacheAtom, masterTrItemsAtom } from "../repository/masterData";
import { matchesContains } from "../lib/searchNormalize";
import {
  defaultSalesPlanItemCorrectSearchFilters,
  trSalesPlanItemToRow,
  type SalesPlanItemCorrectRow,
  type SalesPlanItemCorrectSearchFilters
} from "./types";

export const salesPlanItemCorrectListAtom = atom((get): SalesPlanItemCorrectRow[] => {
  const items = get(masterTrItemsAtom);
  const groups = get(masterEntityCacheAtom).tr_item_group;
  const rows: SalesPlanItemCorrectRow[] = [];
  for (const entity of get(masterEntityCacheAtom).tr_sales_plan_item) {
    const row = trSalesPlanItemToRow(entity, items, groups);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.displayOrder - b.displayOrder || a.itemNo - b.itemNo);
  return rows;
});

export const salesPlanItemCorrectSearchDraftAtom = atom<SalesPlanItemCorrectSearchFilters>(
  defaultSalesPlanItemCorrectSearchFilters()
);
export const salesPlanItemCorrectSearchAppliedFiltersAtom = atom<SalesPlanItemCorrectSearchFilters | null>(
  null
);
export const salesPlanItemCorrectSearchExecutedAtom = atom(false);

export const isSalesPlanItemCorrectSearchEnabled = (): boolean => true;

const matchesFilters = (
  row: SalesPlanItemCorrectRow,
  filters: SalesPlanItemCorrectSearchFilters
): boolean => {
  if (filters.itemName.trim() && !matchesContains(row.itemName, filters.itemName)) {
    return false;
  }
  return true;
};

export const filteredSalesPlanItemCorrectListAtom = atom((get): SalesPlanItemCorrectRow[] => {
  if (!get(salesPlanItemCorrectSearchExecutedAtom)) return [];
  const filters = get(salesPlanItemCorrectSearchAppliedFiltersAtom);
  const source = get(salesPlanItemCorrectListAtom);
  if (!filters) return source;
  return source.filter((row) => matchesFilters(row, filters));
});
