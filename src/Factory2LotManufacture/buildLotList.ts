/**
 * sql/CroudeTea.sql 相当: te_lot_base INNER JOIN te_lot_use_item ON lot_no
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import {
  formatFactory2LotStatus,
  formatFactory2OrganicClass,
  formatFactory2ProcessType,
  normalizeLotStatusCode,
  normalizeOrganicClassCode,
  normalizeProcessTypeCode
} from "./factory2LotDisplay";
import { matchesMakeYear } from "./factory2MakeYear";
import {
  lotStatusCodesFromCheck,
  organicCodesFromCheck,
  processCodesFromCheck
} from "./factory2SearchCriteria";
import type { Factory2AppliedSearchCriteria, Factory2LotRow } from "./types";

const parseOptionalInt = (raw: string | null | undefined): number | null => {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const fractionWeightTotal = (
  fractionWeight: number | null,
  fractionNumber: number | null
): number => {
  const w = fractionWeight ?? 0;
  const n = fractionNumber ?? 0;
  return w * n;
};

/** bootstrap キャッシュから一覧行を構築（product_no 昇順） */
export function buildFactory2LotList(cache: MasterEntityCache): Factory2LotRow[] {
  const useByLot = new Map(cache.te_lot_use_item.map((e) => [e.data.lot_no, e]));

  const rows: Factory2LotRow[] = [];
  for (const base of cache.te_lot_base) {
    const use = useByLot.get(base.data.lot_no);
    if (!use) continue;

    const b = base.data;
    const u = use.data;
    const processCode = b.process_type.trim();
    const statusCode = b.lot_status.trim();
    const organicCode = b.organic_class.trim();

    rows.push({
      id: String(b.lot_no),
      workDate: b.work_date,
      lotNo: b.lot_no,
      processTypeCode: processCode,
      processTypeName: formatFactory2ProcessType(processCode),
      productNo: b.product_no,
      lotStatusCode: statusCode,
      lotStatusName: formatFactory2LotStatus(statusCode),
      lotName: b.lot_name,
      makeYear: parseOptionalInt(u.make_year),
      itemName: u.use_name,
      count: parseOptionalInt(u.count),
      organicClassCode: organicCode,
      organicClass: formatFactory2OrganicClass(organicCode),
      unitWeight: b.unit_weight,
      unitNumber: b.unit_number,
      fractionWeight: fractionWeightTotal(b.fraction_weight, b.fraction_number),
      remarks: b.remarks
    });
  }

  rows.sort((a, b) => (a.productNo ?? 0) - (b.productNo ?? 0));
  return rows;
}

const sameCalendarDate = (workDate: string | null, yyyyMmDd: string): boolean => {
  if (!workDate || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(workDate) === norm(yyyyMmDd);
};

/** 検索条件（2段目・検索実行後）でクライアント絞り込み */
export function filterFactory2LotRows(
  rows: Factory2LotRow[],
  criteria: Factory2AppliedSearchCriteria
): Factory2LotRow[] {
  const statusCodes = lotStatusCodesFromCheck(criteria.lotStatusCheck);
  const processCodes = processCodesFromCheck(criteria.processCheck);
  const organicCodes = organicCodesFromCheck(criteria.organicCheck);
  const itemNameQ = criteria.itemNameQuery.trim().toLowerCase();
  const workDate = criteria.workDate?.trim() || null;

  return rows.filter((row) => {
    if (!matchesMakeYear(row.makeYear, criteria.year)) {
      return false;
    }

    const rowProcess = normalizeProcessTypeCode(row.processTypeCode);

    if (processCodes && !processCodes.has(rowProcess)) {
      return false;
    }

    if (statusCodes && !statusCodes.has(normalizeLotStatusCode(row.lotStatusCode))) {
      return false;
    }

    if (organicCodes && !organicCodes.has(normalizeOrganicClassCode(row.organicClassCode))) {
      return false;
    }

    if (workDate && !sameCalendarDate(row.workDate, workDate)) {
      return false;
    }

    if (itemNameQ && !(row.itemName ?? "").toLowerCase().includes(itemNameQ)) {
      return false;
    }

    return true;
  });
}
