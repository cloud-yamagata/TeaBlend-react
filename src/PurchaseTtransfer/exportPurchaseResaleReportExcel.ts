/**
 * 転売リスト / 有機紐付リスト Excel
 */
import ExcelJS from "exceljs";
import { downloadBlob } from "../lib/downloadBlob";

export type PurchaseResaleReportKind = "resale" | "organic";

export type PurchaseResaleReportRow = {
  year: number;
  transfer: string;
  purchase: string;
  bidNo: string;
  date: string;
  variety: string;
  teaLife: string;
  grade: string;
  teaType: string;
  teaRank: string;
  fieldNo: string;
  producer: string;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  cost: number | null;
  discount: number;
  unitPrice: number | null;
  targetPlan: string;
  lotNo: string;
};

const RESALE_HEADERS = [
  "年度",
  "転売先",
  "仕入先",
  "入札NO",
  "振分日",
  "梱包重量",
  "梱包数",
  "端数重量",
  "端数数",
  "単価",
  "お届け価格",
  "粉引",
  "生産者",
  "品種",
  "予定用途",
  "圃場",
  "ロットNO"
] as const;

const ORGANIC_HEADERS = [
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
  "梱包数",
  "端数重量",
  "端数数",
  "粉引",
  "転売先",
  "予定用途",
  "ロットNO",
  "お届け価格"
] as const;

const toDateText = (value: string): string => {
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const resaleValues = (row: PurchaseResaleReportRow): (string | number | null)[] => [
  row.year,
  row.transfer,
  row.purchase,
  row.bidNo,
  toDateText(row.date),
  row.unitWeight,
  row.unitNumber,
  row.fractionWeight,
  row.fractionNumber,
  row.cost,
  row.unitPrice,
  row.discount,
  row.producer,
  row.variety,
  row.targetPlan,
  row.fieldNo,
  row.lotNo
];

const organicValues = (row: PurchaseResaleReportRow): (string | number | null)[] => [
  row.year,
  row.purchase,
  row.bidNo,
  toDateText(row.date),
  row.variety,
  row.teaLife,
  row.grade,
  row.teaType,
  row.teaRank,
  row.fieldNo,
  row.producer,
  row.cost,
  row.unitWeight,
  row.unitNumber,
  row.fractionWeight,
  row.fractionNumber,
  row.discount,
  row.transfer,
  row.targetPlan,
  row.lotNo,
  row.unitPrice
];

export async function exportPurchaseResaleReportExcel(
  kind: PurchaseResaleReportKind,
  rows: readonly PurchaseResaleReportRow[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const isResale = kind === "resale";
  const sheet = workbook.addWorksheet(isResale ? "転売リスト" : "紐付リスト");
  const headers = isResale ? RESALE_HEADERS : ORGANIC_HEADERS;
  sheet.addRow([...headers]);
  for (const row of rows) {
    sheet.addRow(isResale ? resaleValues(row) : organicValues(row));
  }
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    isResale ? "転売リスト.xlsx" : "有機紐付リスト.xlsx"
  );
}
