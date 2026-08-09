import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { normalizeProcessTypeCode } from "./factory2LotDisplay";
import type { Factory2LotEditFormData, Factory2LotEditPartRow } from "./factory2LotEditTypes";
import type { Factory2GradeReportPreviewPayload, Factory2GradeReportRowPayload } from "./factory2ReportHelperTypes";

const readInput = (root: HTMLElement | null, ariaLabel: string, fallback: string): string => {
  if (!root) return fallback;
  const el = root.querySelector<HTMLInputElement>(`input[aria-label="${ariaLabel}"]`);
  return el?.value.trim() ?? fallback;
};

const parseNumber = (text: string): number => {
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const zeroProcessFields = (): Record<string, number> => ({
  process03: 0,
  process02_01: 0,
  process02_02: 0,
  process02_03: 0,
  process02_04: 0,
  process02_05: 0,
  process02_06: 0,
  process02_07: 0,
  process02_08: 0,
  process02_09: 0,
  process02_10: 0,
  process04_01: 0,
  process04_02: 0,
  process04_03: 0,
  process04_04: 0,
  process04_05: 0,
  process04_06: 0,
  process04_07: 0,
  process04_08: 0,
  process04_09: 0,
  process04_10: 0
});

const indexByLotNo = <T extends { data: { lot_no: number } }>(list: T[]): Map<number, T> => {
  const map = new Map<number, T>();
  for (const item of list) {
    map.set(item.data.lot_no, item);
  }
  return map;
};

const assignProcessProducts = (
  row: Factory2GradeReportRowPayload,
  partRows: Factory2LotEditPartRow[],
  cache: MasterEntityCache
): void => {
  const baseByLot = indexByLotNo(cache.te_lot_base);
  const byProcess: Record<string, number[]> = { "02": [], "03": [], "04": [] };

  for (const part of partRows) {
    const childLotNo = Number(part.partLotNo || part.lotNo);
    const childBase = Number.isFinite(childLotNo) ? baseByLot.get(childLotNo)?.data : undefined;
    const process = normalizeProcessTypeCode(childBase?.process_type ?? "");
    const productNo = parseNumber(part.productNo) || childBase?.product_no || 0;
    if (!productNo) continue;
    if (byProcess[process]) byProcess[process].push(productNo);
  }

  row.process03 = byProcess["03"][0] ?? 0;
  byProcess["02"].slice(0, 10).forEach((value, index) => {
    row[`process02_${String(index + 1).padStart(2, "0")}`] = value;
  });
  byProcess["04"].slice(0, 10).forEach((value, index) => {
    row[`process04_${String(index + 1).padStart(2, "0")}`] = value;
  });
};

export function buildFactory2GradeReportPreviewPayload(
  panel: HTMLElement | null,
  form: Factory2LotEditFormData,
  partRows: Factory2LotEditPartRow[],
  organicClassCode: string,
  makeYear: string,
  cache: MasterEntityCache
): Factory2GradeReportPreviewPayload {
  const processTypeCode = normalizeProcessTypeCode(String(form.processTypeCode));
  const unitWeight = parseNumber(readInput(panel, "梱包重量", form.unitWeight));
  const unitNumber = parseNumber(readInput(panel, "梱包数", form.unitNumber));
  const fractionWeight = parseNumber(readInput(panel, "端数重量", form.fractionWeight));
  const fractionNumber = parseNumber(readInput(panel, "端数数", form.fractionNumber));
  const productNo = form.productNo ?? 0;
  const lotNo = form.lotNo ?? 0;
  const gradeFromCache =
    lotNo > 0 ? cache.te_grade.find((g) => g.data.lot_no === lotNo)?.data.grade_no : undefined;

  const row: Factory2GradeReportRowPayload = {
    lot_no: lotNo,
    product_no: productNo,
    lot_name: readInput(panel, "部品名", form.lotName),
    make_year: makeYear,
    count: readInput(panel, "回数", form.count),
    work_date: readInput(panel, "生産日", form.workDate),
    organic_class: organicClassCode,
    unit_weight: unitWeight,
    unit_number: unitNumber,
    fraction_weight: fractionWeight,
    fraction_number: fractionNumber,
    complete_quantity: unitWeight * unitNumber + fractionWeight * fractionNumber,
    grade_no: form.gradeNo ?? gradeFromCache ?? 0,
    ...zeroProcessFields()
  };

  if (processTypeCode === "02") {
    row.process02_01 = productNo;
  } else if (processTypeCode === "05") {
    assignProcessProducts(row, partRows, cache);
  }

  return {
    processTypeCode,
    rows: [row]
  };
}
