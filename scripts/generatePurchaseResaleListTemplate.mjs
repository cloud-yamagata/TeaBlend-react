/**
 * 振分実績一覧 Excel 雛形（試験用）を public/excel-templates/ に生成する。
 *
 * 用法: npm install 後
 *   node scripts/generatePurchaseResaleListTemplate.mjs
 *
 * 本番では WPF の「{レポート名}_雛形.xlsx」をコピーし、
 * データ開始セルに __DATA__ マーカーを置く（既存レポート雛形と同方式）。
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/excel-templates");
const outFile = path.join(outDir, "振分一覧_雛形.xlsx");

const headers = [
  "年度",
  "仕入先",
  "入札NO",
  "振分先",
  "振分日",
  "梱包重量",
  "梱包数",
  "端数重量",
  "端数",
  "振分重量",
  "振分本数",
  "単価",
  "仕入日",
  "品種",
  "茶期",
  "格付",
  "茶種",
  "品柄",
  "圃場",
  "生産者",
  "仕入本数",
  "仕入数量",
  "原価",
  "粉引",
  "粉引後数量",
  "消費税",
  "金額",
  "用途",
  "予定用途",
  "ロットNO",
  "備考"
];

fs.mkdirSync(outDir, { recursive: true });

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("振分一覧");

sheet.mergeCells("A1:AE1");
sheet.getCell("A1").value = "振分一覧";
sheet.getCell("A1").font = { bold: true, size: 14 };

headers.forEach((label, index) => {
  sheet.getCell(2, index + 1).value = label;
  sheet.getCell(2, index + 1).font = { bold: true };
});

sheet.getCell("A3").value = "__DATA__";

await workbook.xlsx.writeFile(outFile);
console.log(`Generated: ${outFile}`);
