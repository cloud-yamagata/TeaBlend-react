/**
 * 転売先マスタ一覧の構築・絞り込み
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import { matchesContains } from "../lib/searchNormalize";
import {
  defaultResaleCorrectSearchFilters,
  trResaleToRow,
  type ResaleCorrectRow,
  type ResaleCorrectSearchFilters
} from "./types";

export const resaleCorrectListAtom = atom((get): ResaleCorrectRow[] => {
  const rows: ResaleCorrectRow[] = [];
  for (const entity of get(masterEntityCacheAtom).tr_resale) {
    const row = trResaleToRow(entity);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.resale.localeCompare(b.resale, "ja"));
  return rows;
});

export const resaleCorrectSearchDraftAtom = atom<ResaleCorrectSearchFilters>(
  defaultResaleCorrectSearchFilters()
);
export const resaleCorrectSearchAppliedFiltersAtom = atom<ResaleCorrectSearchFilters | null>(null);
export const resaleCorrectSearchExecutedAtom = atom(false);

export const isResaleCorrectSearchEnabled = (): boolean => true;

const matchesFilters = (row: ResaleCorrectRow, filters: ResaleCorrectSearchFilters): boolean => {
  if (filters.resaleName.trim() && !matchesContains(row.resale, filters.resaleName)) {
    return false;
  }
  return true;
};

export const filteredResaleCorrectListAtom = atom((get): ResaleCorrectRow[] => {
  if (!get(resaleCorrectSearchExecutedAtom)) return [];
  const filters = get(resaleCorrectSearchAppliedFiltersAtom);
  const source = get(resaleCorrectListAtom);
  if (!filters) return source;
  return source.filter((row) => matchesFilters(row, filters));
});
