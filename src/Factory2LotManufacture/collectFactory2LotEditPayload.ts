/**
 * 変更モーダルから te_lot_* キャッシュ更新用ペイロードを収集する
 */
import type { Factory2LotEditFormData, Factory2LotEditPartRow } from "./factory2LotEditTypes";

export type Factory2LotCategoryFields = {
  temperature: string | null;
  humidity: string | null;
  work_start_hh: string | null;
  work_start_mm: string | null;
  work_end_hh: string | null;
  work_end_mm: string | null;
  work_before_cleaning_start_hh: string | null;
  work_before_cleaning_start_mm: string | null;
  work_before_cleaning_end_hh: string | null;
  work_before_cleaning_end_mm: string | null;
  work_end_cleaning_start_hh: string | null;
  work_end_cleaning_start_mm: string | null;
  work_end_cleaning_end_hh: string | null;
  work_end_cleaning_end_mm: string | null;
  work_before_cleaning_chk: boolean;
  work_after_cleaning_chk: boolean;
  device_chk: boolean;
  operation_chk: boolean;
  rest_chk: boolean;
  magnet_cleaning_chk: boolean;
  use_device_unit1_chk: boolean;
  use_device_unit2_chk: boolean;
  use_device_unit3_chk: boolean;
  packing_case1_chk: boolean;
  packing_case2_chk: boolean;
};

export type Factory2LotCreatePayload = {
  process_type: string;
  organic_class: string;
  baseFields: Factory2LotUpdatePayload["baseFields"];
  categoryFields: Factory2LotCategoryFields;
  partRows: Factory2LotEditPartRow[];
};

export type Factory2LotUpdatePayload = {
  parentLotNo: number;
  organic_class: string;
  baseFields: {
    lot_name: string;
    work_date: string;
    unit_weight: number;
    unit_number: number;
    fraction_weight: number | null;
    fraction_number: number | null;
    remarks: string | null;
    make_year: string;
    count: string;
    use_name: string;
  };
  categoryFields: Factory2LotCategoryFields;
  partRows: Factory2LotEditPartRow[];
};

const readInput = (root: HTMLElement, ariaLabel: string): string => {
  const el = root.querySelector<HTMLInputElement>(`input[aria-label="${ariaLabel}"]`);
  return el?.value.trim() ?? "";
};

const readCheckbox = (root: HTMLElement, ariaLabel: string): boolean => {
  const el = root.querySelector<HTMLInputElement>(`input[type="checkbox"][aria-label="${ariaLabel}"]`);
  return el?.checked === true;
};

const parseFiniteNumber = (text: string): number => {
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const parseOptionalNumber = (text: string): number | null => {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const splitTimeValue = (value: string): { hh: string; mm: string } => {
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { hh: "", mm: "" };
  return { hh: m[1], mm: m[2] };
};

const nullableStr = (text: string): string | null => (text.trim() ? text.trim() : null);

const collectCategoryFields = (panelEl: HTMLElement): Factory2LotCategoryFields => {
  const workStart = splitTimeValue(readInput(panelEl, "製造開始時間"));
  const workEnd = splitTimeValue(readInput(panelEl, "製造終了時間"));
  const cleanBeforeStart = splitTimeValue(readInput(panelEl, "作業前清掃 開始"));
  const cleanBeforeEnd = splitTimeValue(readInput(panelEl, "作業前清掃 終了"));
  const cleanAfterStart = splitTimeValue(readInput(panelEl, "作業後清掃 開始"));
  const cleanAfterEnd = splitTimeValue(readInput(panelEl, "作業後清掃 終了"));

  return {
    temperature: nullableStr(readInput(panelEl, "室内温度")),
    humidity: nullableStr(readInput(panelEl, "室内湿度")),
    work_start_hh: nullableStr(workStart.hh),
    work_start_mm: nullableStr(workStart.mm),
    work_end_hh: nullableStr(workEnd.hh),
    work_end_mm: nullableStr(workEnd.mm),
    work_before_cleaning_start_hh: nullableStr(cleanBeforeStart.hh),
    work_before_cleaning_start_mm: nullableStr(cleanBeforeStart.mm),
    work_before_cleaning_end_hh: nullableStr(cleanBeforeEnd.hh),
    work_before_cleaning_end_mm: nullableStr(cleanBeforeEnd.mm),
    work_end_cleaning_start_hh: nullableStr(cleanAfterStart.hh),
    work_end_cleaning_start_mm: nullableStr(cleanAfterStart.mm),
    work_end_cleaning_end_hh: nullableStr(cleanAfterEnd.hh),
    work_end_cleaning_end_mm: nullableStr(cleanAfterEnd.mm),
    use_device_unit1_chk: readCheckbox(panelEl, "1号機"),
    use_device_unit2_chk: readCheckbox(panelEl, "2号機"),
    use_device_unit3_chk: readCheckbox(panelEl, "3号機"),
    packing_case1_chk: readCheckbox(panelEl, "平袋(小)"),
    packing_case2_chk: readCheckbox(panelEl, "大海袋"),
    work_before_cleaning_chk: readCheckbox(panelEl, "作業前清掃"),
    work_after_cleaning_chk: readCheckbox(panelEl, "作業後清掃"),
    device_chk: readCheckbox(panelEl, "装置設定"),
    operation_chk: readCheckbox(panelEl, "空動作"),
    rest_chk: readCheckbox(panelEl, "残留物"),
    magnet_cleaning_chk: readCheckbox(panelEl, "磁石清掃")
  };
};

const collectBaseFields = (
  panelEl: HTMLElement,
  form: Factory2LotEditFormData,
  makeYear?: string
): Factory2LotUpdatePayload["baseFields"] => ({
  lot_name: readInput(panelEl, "部品名"),
  work_date: readInput(panelEl, "生産日"),
  unit_weight: parseFiniteNumber(readInput(panelEl, "梱包重量")),
  unit_number: parseFiniteNumber(readInput(panelEl, "梱包数")),
  fraction_weight: parseOptionalNumber(readInput(panelEl, "端数重量")),
  fraction_number: parseOptionalNumber(readInput(panelEl, "端数数")),
  remarks: readInput(panelEl, "適用") || null,
  make_year: (makeYear ?? form.makeYear).trim(),
  count: readInput(panelEl, "回数"),
  use_name: form.itemName.trim()
});

/** 登録モーダル DOM からペイロードを組み立てる */
export function collectFactory2LotCreatePayload(
  panelEl: HTMLElement,
  form: Factory2LotEditFormData,
  partRows: Factory2LotEditPartRow[],
  organicClassCode?: string,
  makeYear?: string
): Factory2LotCreatePayload {
  const organic = (organicClassCode ?? form.organicClassCode).trim().toUpperCase();
  return {
    process_type: String(form.processTypeCode).trim(),
    organic_class: organic === "A" || organic === "B" || organic === "C" ? organic : "C",
    baseFields: collectBaseFields(panelEl, form, makeYear),
    categoryFields: collectCategoryFields(panelEl),
    partRows
  };
}

/** モーダル DOM から編集可能項目を読み取りペイロードを組み立てる */
const normalizeOrganicClass = (code: string): "A" | "B" | "C" => {
  const c = code.trim().toUpperCase();
  if (c === "A" || c === "B" || c === "C") return c;
  return "C";
};

export function collectFactory2LotUpdatePayload(
  panelEl: HTMLElement,
  form: Factory2LotEditFormData,
  partRows: Factory2LotEditPartRow[],
  organicClassCode?: string,
  makeYear?: string
): Factory2LotUpdatePayload | null {
  const parentLotNo = form.lotNo;
  if (parentLotNo == null || !Number.isFinite(parentLotNo)) {
    return null;
  }

  const organic = normalizeOrganicClass(organicClassCode ?? form.organicClassCode);

  return {
    parentLotNo,
    organic_class: organic,
    baseFields: collectBaseFields(panelEl, form, makeYear),
    categoryFields: collectCategoryFields(panelEl),
    partRows
  };
}
