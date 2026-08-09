/**
 * 月次計画一覧・部品表の表示用ユーティリティ
 */
import type { TeMonthlyPlan } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

export type MonthlyPlanListRow = TeMonthlyPlan & {
  finishedTeaName: string;
};

/** lot_part_info 配列の1要素（9項目） */
export type MonthlyPlanPartItem = {
  id: string;
  lotNo: number | null;
  processType: string | null;
  partLotNo: number | null;
  productNo: number | null;
  lotName: string | null;
  makeYear: number | null;
  count: number | null;
  useUnitWeight: number | null;
  remarks: string | null;
};

/** 在庫照合に使うロットNo（部品ロット優先） */
export const partInventoryLotNo = (item: MonthlyPlanPartItem): number | null =>
  item.partLotNo ?? item.lotNo;

/** 登録モーダル … 使用部品1行分の入力 */
export type MonthlyPlanPartInputForm = {
  lotNo: string;
  processType: string;
  partLotNo: string;
  productNo: string;
  lotName: string;
  makeYear: string;
  count: string;
  useUnitWeight: string;
  remarks: string;
};

export const emptyMonthlyPlanPartInput = (): MonthlyPlanPartInputForm => ({
  lotNo: "",
  processType: "",
  partLotNo: "",
  productNo: "",
  lotName: "",
  makeYear: "",
  count: "",
  useUnitWeight: "",
  remarks: ""
});

const trimToNull = (value: string): string | null => {
  const t = value.trim();
  return t.length > 0 ? t : null;
};

/** 空白可。不正な数値のとき NaN を返す */
export const parsePartInputNumber = (value: string): number | null => {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
};

export function partItemToApiRecord(item: MonthlyPlanPartItem): Record<string, string | number> {
  const rec: Record<string, string | number> = {};
  if (item.lotNo != null) rec.lot_no = item.lotNo;
  if (item.processType?.trim()) rec.process_type = item.processType.trim();
  if (item.partLotNo != null) rec.part_lot_no = item.partLotNo;
  if (item.productNo != null) rec.product_no = item.productNo;
  if (item.lotName?.trim()) rec.lot_name = item.lotName.trim();
  if (item.makeYear != null) rec.make_year = item.makeYear;
  if (item.count != null) rec.count = item.count;
  if (item.useUnitWeight != null) rec.use_unit_weight = item.useUnitWeight;
  if (item.remarks?.trim()) rec.remarks = item.remarks.trim();
  return rec;
}

export function buildPartItemFromInput(
  input: MonthlyPlanPartInputForm,
  id: string
): MonthlyPlanPartItem | "invalid_number" | "missing_weight" {
  const useUnitWeight = parsePartInputNumber(input.useUnitWeight);
  if (useUnitWeight === null) return "missing_weight";
  if (Number.isNaN(useUnitWeight)) return "invalid_number";

  const item: MonthlyPlanPartItem = {
    id,
    lotNo: null,
    processType: trimToNull(input.processType),
    partLotNo: null,
    productNo: null,
    lotName: trimToNull(input.lotName),
    makeYear: null,
    count: null,
    useUnitWeight,
    remarks: trimToNull(input.remarks)
  };

  const lotNo = parsePartInputNumber(input.lotNo);
  if (Number.isNaN(lotNo as number)) return "invalid_number";
  if (lotNo != null) item.lotNo = lotNo;

  const partLotNo = parsePartInputNumber(input.partLotNo);
  if (Number.isNaN(partLotNo as number)) return "invalid_number";
  if (partLotNo != null) item.partLotNo = partLotNo;

  const productNo = parsePartInputNumber(input.productNo);
  if (Number.isNaN(productNo as number)) return "invalid_number";
  if (productNo != null) item.productNo = productNo;

  const makeYear = parsePartInputNumber(input.makeYear);
  if (Number.isNaN(makeYear as number)) return "invalid_number";
  if (makeYear != null) item.makeYear = makeYear;

  const count = parsePartInputNumber(input.count);
  if (Number.isNaN(count as number)) return "invalid_number";
  if (count != null) item.count = count;

  return item;
}

export const toDateText = (value: string | null): string => {
  if (!value) return "";
  const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = String(Number(ymdMatch[2])).padStart(2, "0");
    const dd = String(Number(ymdMatch[3])).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

export const toTimeText = (value: string | null): string => {
  if (!value) return "";
  const hhmmssMatch = value.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (hhmmssMatch) {
    const hh = String(Number(hhmmssMatch[1])).padStart(2, "0");
    const mm = String(Number(hhmmssMatch[2])).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return value;
};

export const toNumberText = (value: number | null): string => (value == null ? "" : numberFormatter.format(value));

export const toProcessTypeText = (value: string | null): string => {
  switch (value) {
    case "02":
      return "02:荒茶ブ";
    case "03":
      return "03:仕上○";
    case "04":
      return "04:火入●";
    case "05":
      return "05:仕上ブ";
    default:
      return value ?? "";
  }
};

const asNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asStringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : value == null ? null : String(value);

export const parsePartItems = (raw: unknown): MonthlyPlanPartItem[] => {
  if (raw == null) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const lotNo = asNumberOrNull(row.lot_no ?? row.lotNo);
      const partLotNo = asNumberOrNull(row.part_lot_no ?? row.partLotNo);
      return {
        id: `${index}-${lotNo ?? partLotNo ?? "part"}`,
        lotNo,
        processType: asStringOrNull(row.process_type ?? row.processType),
        partLotNo,
        productNo: asNumberOrNull(row.product_no ?? row.productNo),
        lotName: asStringOrNull(row.lot_name ?? row.lotName),
        makeYear: asNumberOrNull(row.make_year ?? row.makeYear),
        count: asNumberOrNull(row.count),
        useUnitWeight: asNumberOrNull(row.use_unit_weight ?? row.useUnitWeight),
        remarks: asStringOrNull(row.remarks)
      };
    });
  } catch {
    return [];
  }
};

export const monthlyPlanRowId = (row: TeMonthlyPlan): string =>
  `${row.planNo ?? "plan"}-${row.year ?? ""}-${row.month ?? ""}-${row.itemNo ?? ""}`;
