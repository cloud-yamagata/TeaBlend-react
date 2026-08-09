/**
 * 配合製造実績一覧 … 検索条件の判定・絞り込み
 */
import { normalizeDateToYmd } from "../lib/searchNormalize";
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import {
  normalizeLotStatusCode,
  normalizeOrganicClassCode
} from "../Factory2LotManufacture/factory2LotDisplay";
import { organicCodesFromCheck } from "./blendCategorySearchCriteria";
import type {
  BlendCategoryAppliedSearchCriteria,
  BlendCategoryLotStatusRadio,
  BlendCategoryRow
} from "./types";

const statusCodeFromRadio = (radio: BlendCategoryLotStatusRadio): string | null => {
  if (radio === "all") return null;
  if (radio === "active") return "1";
  if (radio === "complete") return "2";
  return "3";
};

const matchesBlendCategoryRow = (
  row: BlendCategoryRow,
  criteria: BlendCategoryAppliedSearchCriteria
): boolean => {
  if (!matchesPurchaseTeaYear(row.makeYear, criteria.year)) return false;

  const statusCode = statusCodeFromRadio(criteria.lotStatusRadio);
  if (statusCode && !normalizeLotStatusCode(row.lotStatusCode).includes(statusCode)) {
    return false;
  }

  const workDate = criteria.workDate?.trim() || null;
  if (workDate) {
    const rowYmd = normalizeDateToYmd(row.workDate);
    if (rowYmd !== workDate) return false;
  }

  const lotNameQ = criteria.lotNameQuery.trim();
  if (lotNameQ && !(row.lotName ?? "").includes(lotNameQ)) return false;

  const organicCodes = organicCodesFromCheck(criteria.organicCheck);
  if (organicCodes && !organicCodes.has(normalizeOrganicClassCode(row.organicClassCode))) {
    return false;
  }

  return true;
};

export const isBlendCategorySearchEnabled = (year: string): boolean => year.trim().length > 0;

export type BlendCategoryFilterResult = {
  rows: BlendCategoryRow[];
  totalCount: number;
};

export function filterBlendCategoryRows(
  allRows: BlendCategoryRow[],
  criteria: BlendCategoryAppliedSearchCriteria
): BlendCategoryFilterResult {
  if (!criteria.year.trim()) {
    return { rows: [], totalCount: 0 };
  }
  const rows = allRows.filter((row) => matchesBlendCategoryRow(row, criteria));
  return { rows, totalCount: rows.length };
}
