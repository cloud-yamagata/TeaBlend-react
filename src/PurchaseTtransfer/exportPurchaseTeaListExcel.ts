/**
 * 仕入リスト Excel（検索結果を出力）
 */
import ExcelJS from "exceljs";
import { downloadBlob } from "../lib/downloadBlob";
import type { PurchaseTtransferRow } from "./types";

const HEADERS = [
  "年度",
  "入札NO",
  "仕入日",
  "仕入先",
  "品種",
  "茶期",
  "格付",
  "茶種",
  "品柄",
  "圃場",
  "生産者",
  "梱包重量",
  "梱包数",
  "端数重量",
  "端数数",
  "仕入重量",
  "単価",
  "粉引",
  "残量状況",
  "振分重量",
  "用途",
  "予定用途",
  "ロットNO"
] as const;

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const rowValues = (row: PurchaseTtransferRow): (string | number | null)[] => [
  row.year,
  row.bidNo,
  toDateText(row.purchaseDate),
  row.purchase,
  row.variety,
  row.teaLife,
  row.grade,
  row.teaType,
  row.teaRank,
  row.fieldNo,
  row.producer,
  row.unitWeight,
  row.unitNumber,
  row.fractionWeight,
  row.fractionNumber,
  row.purchaseWeight,
  row.cost,
  row.discount,
  row.status,
  row.transferQuantity,
  row.target,
  row.targetPlan,
  row.lotNo
];

export async function exportPurchaseTeaListExcel(rows: readonly PurchaseTtransferRow[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("仕入リスト");
  sheet.addRow([...HEADERS]);
  for (const row of rows) {
    sheet.addRow(rowValues(row));
  }
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    "仕入リスト.xlsx"
  );
}
