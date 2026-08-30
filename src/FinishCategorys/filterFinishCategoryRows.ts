/**
 * 仕上製造実績一覧 … 検索条件の判定・絞り込み
 */
import { normalizeDateToYmd } from "../lib/searchNormalize";
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import {
  normalizeLotStatusCode,
  normalizeOrganicClassCode
} from "../Factory2LotManufacture/factory2LotDisplay";
import { organicCodesFromCheck } from "./finishCategorySearchCriteria";
import type {
  FinishCategoryAppliedSearchCriteria,
  FinishCategoryLotStatusRadio,
  FinishCategoryOrganicCheck,
  FinishCategoryRow
} from "./types";

const statusCodeFromRadio = (radio: FinishCategoryLotStatusRadio): string | null => {
  if (radio === "all") return null;
  if (radio === "active") return "1";
  if (radio === "complete") return "2";
  return "3";
};

const matchesFinishCategoryRow = (
  row: FinishCategoryRow,
  criteria: FinishCategoryAppliedSearchCriteria
): boolean => {
  if (criteria.year != null && !matchesPurchaseTeaYear(row.makeYear, criteria.year)) return false;

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

export const isFinishCategorySearchEnabled = ({
  yearFilterEnabled,
  year,
  lotStatusRadio,
  workDate,
  lotNameQuery,
  organicCheck
}: {
  yearFilterEnabled: boolean;
  year: string;
  lotStatusRadio: FinishCategoryLotStatusRadio;
  workDate: string;
  lotNameQuery: string;
  organicCheck: FinishCategoryOrganicCheck;
}): boolean => {
  if (!yearFilterEnabled) return true;
  if (year.trim().length > 0) return true;
  const anyInGroup = (checks: Record<string, boolean>) => Object.values(checks).some(Boolean);
  return (
    lotStatusRadio !== "all" ||
    workDate.trim() !== "" ||
    lotNameQuery.trim() !== "" ||
    anyInGroup(organicCheck)
  );
};

export type FinishCategoryFilterResult = {
  rows: FinishCategoryRow[];
  totalCount: number;
};

export function filterFinishCategoryRows(
  allRows: FinishCategoryRow[],
  criteria: FinishCategoryAppliedSearchCriteria
): FinishCategoryFilterResult {
  const rows = allRows.filter((row) => matchesFinishCategoryRow(row, criteria));
  return { rows, totalCount: rows.length };
}
