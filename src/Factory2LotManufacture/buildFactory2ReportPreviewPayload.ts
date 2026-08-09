import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { normalizeProcessTypeCode } from "./factory2LotDisplay";
import type { Factory2LotEditFormData, Factory2LotEditPartRow } from "./factory2LotEditTypes";
import type { Factory2BlendReportRowPayload, Factory2ReportPreviewPayload } from "./factory2ReportHelperTypes";

const readInput = (root: HTMLElement | null, ariaLabel: string, fallback: string): string => {
  if (!root) return fallback;
  const el = root.querySelector<HTMLInputElement>(`input[aria-label="${ariaLabel}"]`);
  return el?.value.trim() ?? fallback;
};

const readCheckbox = (root: HTMLElement | null, ariaLabel: string, fallback: boolean): boolean => {
  if (!root) return fallback;
  const el = root.querySelector<HTMLInputElement>(`input[type="checkbox"][aria-label="${ariaLabel}"]`);
  return el?.checked ?? fallback;
};

const parseNumber = (text: string): number => {
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const splitTime = (value: string): { hh: string; mm: string } => {
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { hh: "", mm: "" };
  return { hh: m[1], mm: m[2] };
};

const str = (value: string | number | null | undefined): string =>
  value == null ? "" : String(value).trim();

const padLotNo = (lotNo: string | number): string => {
  const n = Number(lotNo);
  if (!Number.isFinite(n)) return str(lotNo);
  return String(n).padStart(4, "0");
};

const indexByLotNo = <T extends { data: { lot_no: number } }>(list: T[]): Map<number, T> => {
  const map = new Map<number, T>();
  for (const item of list) {
    map.set(item.data.lot_no, item);
  }
  return map;
};

const mergeBlendFields = (
  target: Factory2BlendReportRowPayload,
  source: Record<string, string | number | boolean | null | undefined>
): void => {
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    if (typeof value === "boolean" || typeof value === "number") {
      target[key] = value;
    } else {
      target[key] = str(value);
    }
  }
};

const buildBaseRow = (
  panel: HTMLElement | null,
  form: Factory2LotEditFormData,
  organicClassCode: string,
  makeYear: string
): Factory2BlendReportRowPayload => {
  const workStart = splitTime(readInput(panel, "製造開始時間", `${form.workStart.hh}:${form.workStart.mm}`));
  const workEnd = splitTime(readInput(panel, "製造終了時間", `${form.workEnd.hh}:${form.workEnd.mm}`));
  const cleanBeforeStart = splitTime(
    readInput(
      panel,
      "作業前清掃 開始",
      `${form.cleaningBefore.startHh}:${form.cleaningBefore.startMm}`
    )
  );
  const cleanBeforeEnd = splitTime(
    readInput(panel, "作業前清掃 終了", `${form.cleaningBefore.endHh}:${form.cleaningBefore.endMm}`)
  );
  const cleanAfterStart = splitTime(
    readInput(panel, "作業後清掃 開始", `${form.cleaningAfter.startHh}:${form.cleaningAfter.startMm}`)
  );
  const cleanAfterEnd = splitTime(
    readInput(panel, "作業後清掃 終了", `${form.cleaningAfter.endHh}:${form.cleaningAfter.endMm}`)
  );

  const unitWeight = parseNumber(readInput(panel, "梱包重量", form.unitWeight));
  const unitNumber = parseNumber(readInput(panel, "梱包数", form.unitNumber));
  const fractionWeight = parseNumber(readInput(panel, "端数重量", form.fractionWeight));
  const fractionNumber = parseNumber(readInput(panel, "端数数", form.fractionNumber));

  return {
    work_date: readInput(panel, "生産日", form.workDate),
    process_type: normalizeProcessTypeCode(String(form.processTypeCode)),
    product_no: form.productNo ?? 0,
    lot_name: readInput(panel, "部品名", form.lotName),
    make_year: makeYear,
    blend_name_base: readInput(panel, "通称名", form.itemName),
    count: readInput(panel, "回数", form.count),
    organic_class_base: organicClassCode,
    unit_weight: unitWeight,
    unit_number: unitNumber,
    fraction_weight: fractionWeight,
    fraction_number: fractionNumber,
    complete_quantity: unitWeight * unitNumber + fractionWeight * fractionNumber,
    correct_weight: 0,
    remarks_base: readInput(panel, "適用", form.summaryRemarks),
    temperature: readInput(panel, "室内温度", form.temperature),
    humidity: readInput(panel, "室内湿度", form.humidity),
    work_start_hh: workStart.hh,
    work_start_mm: workStart.mm,
    work_end_hh: workEnd.hh,
    work_end_mm: workEnd.mm,
    work_before_cleaning_start_hh: cleanBeforeStart.hh,
    work_before_cleaning_start_mm: cleanBeforeStart.mm,
    work_before_cleaning_end_hh: cleanBeforeEnd.hh,
    work_before_cleaning_end_mm: cleanBeforeEnd.mm,
    work_end_cleaning_start_hh: cleanAfterStart.hh,
    work_end_cleaning_start_mm: cleanAfterStart.mm,
    work_end_cleaning_end_hh: cleanAfterEnd.hh,
    work_end_cleaning_end_mm: cleanAfterEnd.mm,
    work_before_cleaning_chk: readCheckbox(panel, "作業前清掃", form.checks.workBeforeCleaning),
    work_after_cleaning_chk: readCheckbox(panel, "作業後清掃", form.checks.workAfterCleaning),
    device_chk: readCheckbox(panel, "装置設定", form.checks.device),
    operation_chk: readCheckbox(panel, "空動作", form.checks.operation),
    rest_chk: readCheckbox(panel, "残留物", form.checks.rest),
    magnet_cleaning_chk: readCheckbox(panel, "磁石清掃", form.checks.magnetCleaning),
    use_device_unit1_chk: readCheckbox(panel, "1号機", form.checks.useDeviceUnit1),
    use_device_unit2_chk: readCheckbox(panel, "2号機", form.checks.useDeviceUnit2),
    use_device_unit3_chk: readCheckbox(panel, "3号機", form.checks.useDeviceUnit3),
    packing_case1_chk: readCheckbox(panel, "平袋(小)", form.checks.packingCase1),
    packing_case2_chk: readCheckbox(panel, "大海袋", form.checks.packingCase2)
  };
};

const applyProcessCategoryFields = (
  row: Factory2BlendReportRowPayload,
  cache: MasterEntityCache,
  lotNo: number,
  processTypeCode: string
): void => {
  const process = normalizeProcessTypeCode(processTypeCode);
  if (process === "02" || process === "05") {
    const blend = cache.te_lot_categorys_blend.find((item) => item.data.lot_no === lotNo)?.data;
    if (blend) {
      mergeBlendFields(row, {
        sensual_test_color: blend.sensual_test_color,
        sensual_test_taste: blend.sensual_test_taste,
        sensual_test_aroma: blend.sensual_test_aroma
      });
    }
    return;
  }
  if (process === "03") {
    const finish = cache.te_lot_categorys_finish.find((item) => item.data.lot_no === lotNo)?.data;
    if (finish) {
      mergeBlendFields(row, finish as unknown as Record<string, string | number | boolean | null>);
    }
    return;
  }
  if (process === "04") {
    const firepan = cache.te_lot_categorys_firepan.find((item) => item.data.lot_no === lotNo)?.data;
    if (firepan) {
      mergeBlendFields(row, firepan as unknown as Record<string, string | number | boolean | null>);
    }
  }
};

const buildPartRow = (
  base: Factory2BlendReportRowPayload,
  part: Factory2LotEditPartRow,
  cache: MasterEntityCache
): Factory2BlendReportRowPayload => {
  const row: Factory2BlendReportRowPayload = { ...base };
  const baseByLot = indexByLotNo(cache.te_lot_base);
  const childLotNo = Number(part.partLotNo || part.lotNo);
  const childBase = Number.isFinite(childLotNo) ? baseByLot.get(childLotNo)?.data : undefined;

  row.part_lot_no = padLotNo(part.partLotNo || part.lotNo);
  row.part_process_type = childBase?.process_type ?? "";
  row.part_product_no = padLotNo(part.productNo);
  row.make_year_part = part.makeYear;
  row.part_lot_name = part.partName;
  row.count_part = part.count;
  row.use_quantity = parseNumber(part.useQuantity);
  row.organic_class_part = childBase?.organic_class ?? "";
  row.remarks = part.remarks;
  return row;
};

export function buildFactory2ReportPreviewPayload(
  panel: HTMLElement | null,
  form: Factory2LotEditFormData,
  partRows: Factory2LotEditPartRow[],
  organicClassCode: string,
  makeYear: string,
  cache: MasterEntityCache
): Factory2ReportPreviewPayload {
  const processTypeCode = normalizeProcessTypeCode(String(form.processTypeCode));
  const base = buildBaseRow(panel, form, organicClassCode, makeYear);
  const lotNo = form.lotNo;

  if (lotNo != null) {
    applyProcessCategoryFields(base, cache, lotNo, processTypeCode);
  }

  const rows =
    partRows.length > 0
      ? partRows.map((part) => buildPartRow(base, part, cache))
      : [
          {
            ...base,
            part_lot_no: "",
            part_process_type: "",
            part_product_no: "",
            make_year_part: "",
            part_lot_name: "",
            count_part: "",
            use_quantity: 0,
            organic_class_part: "",
            remarks: ""
          }
        ];

  return { processTypeCode, rows };
}
