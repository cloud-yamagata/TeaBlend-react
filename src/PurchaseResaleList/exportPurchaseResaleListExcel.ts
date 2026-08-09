/**
 * 振分実績一覧 … フロント側 Excel 出力（雛形 + 一覧データマッピング）
 *
 * 雛形: fastapi-igeta/Excelレポート雛形/振分一覧_雛形.xlsx
 * 取得: GET {MATERIAL_API_BASE_URL}/excel-templates/振分一覧_雛形.xlsx
 */
import ExcelJS from "exceljs";
import { getMaterialApiBaseUrl } from "../config/api";
import { downloadBlob } from "../lib/downloadBlob";
import {
  PURCHASE_RESALE_LIST_EXCEL_COLUMNS,
  PURCHASE_RESALE_LIST_EXCEL_OUTPUT_FILENAME,
  PURCHASE_RESALE_LIST_SHEET_NAMES,
  PURCHASE_RESALE_LIST_TEMPLATE_FILENAME,
  type PurchaseResaleListExcelColumn
} from "./purchaseResaleListExcelColumns";
import type { PurchaseResaleListRow } from "./types";

const START_CELL_MARKER = "__DATA__";
const FALLBACK_START_ROW = 2;
const FALLBACK_START_COL = 1;

const encodeTemplatePath = (filename: string): string =>
  `/excel-templates/${encodeURIComponent(filename)}`;

const resolveTemplateCandidates = (): string[] => {
  const fromEnv = import.meta.env.VITE_PURCHASE_RESALE_LIST_EXCEL_TEMPLATE;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return [fromEnv.trim()];
  }

  const backendUrl = `${getMaterialApiBaseUrl()}${encodeTemplatePath(PURCHASE_RESALE_LIST_TEMPLATE_FILENAME)}`;
  const publicUrl = encodeTemplatePath(PURCHASE_RESALE_LIST_TEMPLATE_FILENAME);
  return [backendUrl, publicUrl];
};

const fetchTemplateArrayBuffer = async (): Promise<{ buffer: ArrayBuffer; sourceUrl: string }> => {
  const candidates = resolveTemplateCandidates();
  const errors: string[] = [];

  for (const url of candidates) {
    try {
      // StaticFiles の ETag によりブラウザが古い xlsx を再利用しないよう、毎回再取得する
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (!res.ok) {
        errors.push(`${url} (${res.status})`);
        continue;
      }
      return { buffer: await res.arrayBuffer(), sourceUrl: url };
    } catch (e) {
      errors.push(`${url} (${e instanceof Error ? e.message : String(e)})`);
    }
  }

  throw new Error(
    `Excel雛形「${PURCHASE_RESALE_LIST_TEMPLATE_FILENAME}」の取得に失敗しました。` +
      ` fastapi-igeta/Excelレポート雛形 に配置されているか、API が起動しているか確認してください。\n` +
      `試行: ${errors.join("; ")}`
  );
};

const findMarkerCell = (
  worksheet: ExcelJS.Worksheet,
  marker: string
): { row: number; col: number } | null => {
  let hit: { row: number; col: number } | null = null;
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (cell.value === marker) {
        hit = { row: rowNumber, col: colNumber };
      }
    });
  });
  return hit;
};

const resolveWorksheet = (workbook: ExcelJS.Workbook): ExcelJS.Worksheet => {
  for (const name of PURCHASE_RESALE_LIST_SHEET_NAMES) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) return sheet;
  }
  const first = workbook.worksheets[0];
  if (!first) {
    throw new Error("Excel雛形にシートがありません");
  }
  return first;
};

const writeRowsToWorksheet = (
  worksheet: ExcelJS.Worksheet,
  rows: readonly PurchaseResaleListRow[],
  columns: readonly PurchaseResaleListExcelColumn[],
  startRow: number,
  startCol: number
): void => {
  rows.forEach((row, rowIndex) => {
    let sequentialCol = startCol;
    columns.forEach((column) => {
      const col = column.col ?? sequentialCol;
      if (column.col == null) {
        sequentialCol += 1;
      }
      const value = column.format(row);
      worksheet.getCell(startRow + rowIndex, col).value = value === null ? "" : value;
    });
  });
};

/**
 * 検索結果を雛形 Excel にマッピングしてダウンロードする。
 * 画面の 500 件制限は適用せず、検索条件に合致する全行を出力する。
 */
export async function exportPurchaseResaleListExcel(rows: readonly PurchaseResaleListRow[]): Promise<void> {
  if (rows.length === 0) {
    throw new Error("出力対象データがありません");
  }

  const { buffer: templateBuffer, sourceUrl } = await fetchTemplateArrayBuffer();
  if (import.meta.env.DEV) {
    console.debug("[PurchaseResaleList] Excel template loaded from:", sourceUrl);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const worksheet = resolveWorksheet(workbook);
  const markerHit = findMarkerCell(worksheet, START_CELL_MARKER);

  let startRow = FALLBACK_START_ROW;
  let startCol = FALLBACK_START_COL;
  if (markerHit) {
    startRow = markerHit.row;
    startCol = markerHit.col;
    worksheet.getCell(startRow, startCol).value = null;
  }

  writeRowsToWorksheet(worksheet, rows, PURCHASE_RESALE_LIST_EXCEL_COLUMNS, startRow, startCol);

  const outBuffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([outBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    PURCHASE_RESALE_LIST_EXCEL_OUTPUT_FILENAME
  );
}
