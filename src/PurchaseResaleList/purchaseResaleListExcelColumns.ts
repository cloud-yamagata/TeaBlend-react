import type { PurchaseResaleListRow } from "./types";

/** WPF 雛形（Excelレポート雛形 フォルダ）のファイル名 */
export const PURCHASE_RESALE_LIST_TEMPLATE_FILENAME = "振分一覧_雛形.xlsx";

/** シート名候補（WPF report_name に合わせる。無ければ先頭シート） */
export const PURCHASE_RESALE_LIST_SHEET_NAMES = ["振分一覧", "振分実績一覧"] as const;

export const PURCHASE_RESALE_LIST_EXCEL_OUTPUT_FILENAME = "振分一覧.xlsx";

/**
 * 振分実績一覧 Excel 列マッピング（PurchaseResaleList / tr_report_item report_no=3）
 * field_column 相当の col で雛形レイアウトに合わせて書き込む。
 */

export type PurchaseResaleListExcelColumn = {
  /** PurchaseResaleListRow のキー（識別用） */
  key: string;
  /** 1 始まりの Excel 列番号（tr_report_item.field_column） */
  col: number;
  format: (row: PurchaseResaleListRow) => string | number | null;
};

const toDisplayYear = (year: number): number => (year >= 100 ? year % 100 : year);

const toDateText = (value: string | null | undefined): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

/** WPF StringFormat=N2 相当 */
const toDecimal2 = (value: number | null | undefined): number | "" =>
  value == null || !Number.isFinite(value) ? "" : Math.round(value * 100) / 100;

/** WPF StringFormat=N0 相当 */
const toInt = (value: number | null | undefined): number | "" =>
  value == null || !Number.isFinite(value) ? "" : Math.round(value);

/** Store.purchase_weight_net … 振分重量 × (1 - 粉引%) */
const calcPurchaseWeightNet = (row: PurchaseResaleListRow): number =>
  row.transferWeight * (1 - row.discount / 100);

/** Store.payment … 粉引後重量 × 原価（四捨五入） */
const calcPayment = (row: PurchaseResaleListRow): number =>
  Math.round(calcPurchaseWeightNet(row) * (row.cost ?? 0));

/** Store.tax … 金額 × 10%（四捨五入） */
const calcTax = (row: PurchaseResaleListRow): number => Math.round(calcPayment(row) * 0.1);

export const PURCHASE_RESALE_LIST_EXCEL_COLUMNS: PurchaseResaleListExcelColumn[] = [
  { key: "year", col: 1, format: (r) => toDisplayYear(r.year) },
  { key: "purchase", col: 2, format: (r) => r.purchase },
  { key: "bidNo", col: 3, format: (r) => r.bidNo },
  { key: "transfer", col: 4, format: (r) => r.transfer },
  { key: "transferDate", col: 5, format: (r) => toDateText(r.transferDate) },
  { key: "unitWeight", col: 6, format: (r) => toDecimal2(r.unitWeight) },
  { key: "unitNumber", col: 7, format: (r) => toInt(r.unitNumber) },
  { key: "fractionWeight", col: 8, format: (r) => toDecimal2(r.fractionWeight) },
  { key: "fractionNumber", col: 9, format: (r) => toInt(r.fractionNumber) },
  { key: "transferWeight", col: 10, format: (r) => toDecimal2(r.transferWeight) },
  { key: "transferNumber", col: 11, format: (r) => toInt(r.transferNumber) },
  { key: "unitPrice", col: 12, format: (r) => toInt(r.unitPrice) },
  { key: "purchaseDate", col: 13, format: (r) => toDateText(r.purchaseDate) },
  { key: "variety", col: 14, format: (r) => r.variety },
  { key: "teaLife", col: 15, format: (r) => r.teaLife },
  { key: "grade", col: 16, format: (r) => r.grade },
  { key: "teaType", col: 17, format: (r) => r.teaType },
  { key: "teaRank", col: 18, format: (r) => r.teaRank },
  { key: "fieldNo", col: 19, format: (r) => r.fieldNo },
  { key: "producer", col: 20, format: (r) => r.producer },
  { key: "purchaseNumber", col: 21, format: (r) => toInt(r.purchaseNumber) },
  { key: "purchaseWeight", col: 22, format: (r) => toDecimal2(r.purchaseWeight) },
  { key: "cost", col: 23, format: (r) => toInt(r.cost) },
  { key: "discount", col: 24, format: (r) => toInt(r.discount) },
  { key: "purchaseWeightNet", col: 25, format: (r) => toDecimal2(calcPurchaseWeightNet(r)) },
  { key: "tax", col: 26, format: (r) => toInt(calcTax(r)) },
  { key: "payment", col: 27, format: (r) => toInt(calcPayment(r)) },
  { key: "target", col: 28, format: (r) => r.target },
  { key: "targetPlan", col: 29, format: (r) => r.targetPlan },
  { key: "lotNo", col: 30, format: (r) => r.lotNo },
  { key: "remarks", col: 31, format: (r) => r.remarks }
];
