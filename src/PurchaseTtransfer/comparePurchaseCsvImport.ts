/**
 * CSV 取込行と既存 te_purchase_tea の差分判定（insert_purchase_csv.py 相当）
 */
import type { TePurchaseTea } from "../domain/masterTableEntityModels";
import type { PurchaseCsvImportDiff, PurchaseTeaImportRow } from "./purchaseCsvImportTypes";
import { matchesPurchaseTeaYear } from "./purchaseTtransferSearchCriteria";

const round2 = (n: number): number => Math.round(n * 100) / 100;

const normalizeStr = (value: string | null | undefined): string => {
  if (value == null || value === "0") return "";
  return String(value).trim();
};

const normalizeIsoDate = (value: string | null | undefined): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return value.trim();
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const purchaseTeaKey = (year: number, purchase: string, bidNo: string): string => {
  const y = year >= 100 ? year % 100 : year;
  return `${y}|${purchase.trim()}|${bidNo.trim()}`;
};

type CompareField = {
  label: string;
  importValue: (row: PurchaseTeaImportRow) => unknown;
  entityValue: (entity: TePurchaseTea) => unknown;
  equal: (a: unknown, b: unknown) => boolean;
};

const strEqual = (a: unknown, b: unknown): boolean => normalizeStr(String(a ?? "")) === normalizeStr(String(b ?? ""));

const numEqual2 = (a: unknown, b: unknown): boolean => round2(Number(a ?? 0)) === round2(Number(b ?? 0));

const intEqual = (a: unknown, b: unknown): boolean => Number(a ?? 0) === Number(b ?? 0);

/** Python: columns index 3〜19 を比較 */
const COMPARE_FIELDS: CompareField[] = [
  {
    label: "仕入日",
    importValue: (r) => normalizeIsoDate(r.purchaseDate),
    entityValue: (e) => normalizeIsoDate(e.data.purchase_date),
    equal: strEqual
  },
  { label: "品種", importValue: (r) => r.variety, entityValue: (e) => e.data.variety, equal: strEqual },
  { label: "茶期", importValue: (r) => r.teaLife, entityValue: (e) => e.data.tea_life, equal: strEqual },
  { label: "格付", importValue: (r) => r.grade, entityValue: (e) => e.data.grade, equal: strEqual },
  { label: "茶種", importValue: (r) => r.teaType, entityValue: (e) => e.data.tea_type, equal: strEqual },
  { label: "品柄", importValue: (r) => r.teaRank, entityValue: (e) => e.data.tea_rank, equal: strEqual },
  { label: "圃場", importValue: (r) => r.fieldNo, entityValue: (e) => e.data.field_no, equal: strEqual },
  { label: "生産者", importValue: (r) => r.producer, entityValue: (e) => e.data.producer, equal: strEqual },
  {
    label: "単価",
    importValue: (r) => r.cost,
    entityValue: (e) => e.data.cost,
    equal: (a, b) => (a == null && b == null) || Number(a ?? 0) === Number(b ?? 0)
  },
  {
    label: "梱包重量",
    importValue: (r) => r.unitWeight,
    entityValue: (e) => e.data.unit_weight,
    equal: numEqual2
  },
  {
    label: "梱包本数",
    importValue: (r) => r.unitNumber,
    entityValue: (e) => e.data.unit_number,
    equal: intEqual
  },
  {
    label: "端数重量",
    importValue: (r) => r.fractionWeight,
    entityValue: (e) => e.data.fraction_weight,
    equal: numEqual2
  },
  {
    label: "端数本数",
    importValue: (r) => r.fractionNumber,
    entityValue: (e) => e.data.fraction_number,
    equal: intEqual
  },
  {
    label: "粉引",
    importValue: (r) => r.discount,
    entityValue: (e) => e.data.discount,
    equal: numEqual2
  },
  { label: "用途", importValue: (r) => r.target, entityValue: (e) => e.data.target, equal: strEqual },
  { label: "予定用途", importValue: (r) => r.targetPlan, entityValue: (e) => e.data.target_plan, equal: strEqual },
  { label: "ロットNo", importValue: (r) => r.lotNo, entityValue: (e) => e.data.lot_no, equal: strEqual }
];

export function diffPurchaseCsvImport(
  importRows: PurchaseTeaImportRow[],
  existing: TePurchaseTea[],
  filterYearText: string
): PurchaseCsvImportDiff[] {
  const filtered = importRows.filter((row) => matchesPurchaseTeaYear(row.year, filterYearText));
  const existingMap = new Map<string, TePurchaseTea>();
  for (const entity of existing) {
    const d = entity.data;
    existingMap.set(purchaseTeaKey(d.year, d.purchase, d.bid_no), entity);
  }

  const diffs: PurchaseCsvImportDiff[] = [];
  for (const row of filtered) {
    const key = purchaseTeaKey(row.year, row.purchase, row.bidNo);
    const rec = existingMap.get(key);
    if (!rec) {
      diffs.push({ kind: "new", row });
      continue;
    }
    const changedFields = COMPARE_FIELDS.filter(
      (field) => !field.equal(field.importValue(row), field.entityValue(rec))
    ).map((field) => field.label);
    if (changedFields.length > 0) {
      diffs.push({ kind: "changed", row, changedFields });
    }
  }
  return diffs;
}

export function importRowToCheckCsvCells(row: PurchaseTeaImportRow): string[] {
  return [
    String(row.year),
    row.purchase,
    row.bidNo,
    row.purchaseDate,
    row.variety,
    row.teaLife,
    row.grade,
    row.teaType,
    row.teaRank,
    row.fieldNo,
    row.producer,
    row.cost == null ? "" : String(row.cost),
    String(row.unitWeight),
    String(row.unitNumber),
    String(row.fractionWeight),
    String(row.fractionNumber),
    String(row.discount),
    row.target,
    row.targetPlan,
    row.lotNo
  ];
}

const CHECK_CSV_HEADERS = [
  "年度",
  "仕入先",
  "入札NO",
  "仕入日",
  "品種",
  "茶期",
  "格付",
  "茶種",
  "品柄",
  "圃場",
  "生産者",
  "単価",
  "梱包重量",
  "梱包本数",
  "端数重量",
  "端数本数",
  "粉引",
  "用途",
  "予定用途",
  "ロットNo"
];

const escapeCsvCell = (value: string): string => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export function buildPurchaseCheckCsvText(diffs: PurchaseCsvImportDiff[]): string {
  const lines = [CHECK_CSV_HEADERS.join(",")];
  for (const diff of diffs) {
    lines.push(importRowToCheckCsvCells(diff.row).map(escapeCsvCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadPurchaseCheckCsv(diffs: PurchaseCsvImportDiff[], fileName?: string): void {
  const text = buildPurchaseCheckCsvText(diffs);
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  anchor.href = url;
  anchor.download = fileName ?? `仕入実績_${ymd}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toPurchaseTeaUpsertBody(row: PurchaseTeaImportRow): Record<string, unknown> {
  return {
    year: row.year,
    purchase: row.purchase,
    bid_no: row.bidNo,
    purchase_date: row.purchaseDate,
    variety: row.variety || null,
    tea_life: row.teaLife || null,
    grade: row.grade || null,
    tea_type: row.teaType || null,
    tea_rank: row.teaRank || null,
    field_no: row.fieldNo || null,
    producer: row.producer || null,
    cost: row.cost,
    unit_weight: row.unitWeight,
    unit_number: row.unitNumber,
    fraction_weight: row.fractionWeight,
    fraction_number: row.fractionNumber,
    discount: Math.round(row.discount),
    target: row.target || null,
    target_plan: row.targetPlan || null,
    lot_no: row.lotNo || null,
    remarks: row.remarks || null
  };
}
