import {
  blendLotOrganicCodesFromCheck,
  blendLotStatusCodesFromCheck
} from "./blendLotSearchCriteria";
import type { BlendLotAppliedSearchCriteria, BlendLotListRow } from "./types";

const normalizeOrganicCode = (code: string): string => code.trim().toUpperCase();

const sameCalendarDate = (workDate: string | null, yyyyMmDd: string): boolean => {
  if (!workDate || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(workDate) === norm(yyyyMmDd);
};

export function filterBlendLotRows(
  allRows: BlendLotListRow[],
  criteria: BlendLotAppliedSearchCriteria
): BlendLotListRow[] {
  const statusCodes = blendLotStatusCodesFromCheck(criteria.lotStatusCheck);
  const organicCodes = blendLotOrganicCodesFromCheck(criteria.organicCheck);
  const workDate = criteria.workDate?.trim() || null;
  const itemNo = criteria.itemNo;
  const nameQ = criteria.itemNameQuery.trim().toLowerCase();

  return allRows.filter((row) => {
    if (statusCodes && !statusCodes.has(row.lotStatusCode.trim())) {
      return false;
    }

    if (organicCodes && !organicCodes.has(normalizeOrganicCode(row.organicClassCode))) {
      return false;
    }

    if (workDate && !sameCalendarDate(row.workDate, workDate)) {
      return false;
    }

    if (itemNo != null && row.itemNo !== itemNo) {
      return false;
    }

    if (!itemNo && nameQ && !(row.itemName ?? "").toLowerCase().includes(nameQ)) {
      return false;
    }

    return true;
  });
}
