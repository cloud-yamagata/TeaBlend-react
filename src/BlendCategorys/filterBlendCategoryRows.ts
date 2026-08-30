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
  BlendCategoryOrganicCheck,
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

export const isBlendCategorySearchEnabled = ({
  yearFilterEnabled,
  year,
  lotStatusRadio,
  workDate,
  lotNameQuery,
  organicCheck
}: {
  yearFilterEnabled: boolean;
  year: string;
  lotStatusRadio: BlendCategoryLotStatusRadio;
  workDate: string;
  lotNameQuery: string;
  organicCheck: BlendCategoryOrganicCheck;
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

export type BlendCategoryFilterResult = {
  rows: BlendCategoryRow[];
  totalCount: number;
};

export function filterBlendCategoryRows(
  allRows: BlendCategoryRow[],
  criteria: BlendCategoryAppliedSearchCriteria
): BlendCategoryFilterResult {
  const rows = allRows.filter((row) => matchesBlendCategoryRow(row, criteria));
  return { rows, totalCount: rows.length };
}
