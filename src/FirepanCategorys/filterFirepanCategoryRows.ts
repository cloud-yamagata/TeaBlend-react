import { normalizeDateToYmd } from "../lib/searchNormalize";
import { matchesPurchaseTeaYear } from "../PurchaseTtransfer/purchaseTtransferSearchCriteria";
import {
  normalizeLotStatusCode,
  normalizeOrganicClassCode
} from "../Factory2LotManufacture/factory2LotDisplay";
import { organicCodesFromCheck } from "./firepanCategorySearchCriteria";
import type {
  FirepanCategoryAppliedSearchCriteria,
  FirepanCategoryLotStatusRadio,
  FirepanCategoryOrganicCheck,
  FirepanCategoryRow
} from "./types";

const statusCodeFromRadio = (radio: FirepanCategoryLotStatusRadio): string | null => {
  if (radio === "all") return null;
  if (radio === "active") return "1";
  if (radio === "complete") return "2";
  return "3";
};

const matchesFirepanCategoryRow = (
  row: FirepanCategoryRow,
  criteria: FirepanCategoryAppliedSearchCriteria
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

export const isFirepanCategorySearchEnabled = ({
  yearFilterEnabled,
  year,
  lotStatusRadio,
  workDate,
  lotNameQuery,
  organicCheck
}: {
  yearFilterEnabled: boolean;
  year: string;
  lotStatusRadio: FirepanCategoryLotStatusRadio;
  workDate: string;
  lotNameQuery: string;
  organicCheck: FirepanCategoryOrganicCheck;
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

export type FirepanCategoryFilterResult = {
  rows: FirepanCategoryRow[];
  totalCount: number;
};

export function filterFirepanCategoryRows(
  allRows: FirepanCategoryRow[],
  criteria: FirepanCategoryAppliedSearchCriteria
): FirepanCategoryFilterResult {
  const rows = allRows.filter((row) => matchesFirepanCategoryRow(row, criteria));
  return { rows, totalCount: rows.length };
}
