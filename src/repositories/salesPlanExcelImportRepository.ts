/**
 * 販売計画 Excel 取込 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { formatFetchFailureMessage } from "../lib/apiFetch";

const base = () => `${getMaterialApiBaseUrl()}/te_monthly_product_plan`;

export type SalesPlanImportSalesRow = {
  sales_item_name: string;
  item_no: number | null;
  item_name: string;
  sales_size: number;
  status: string;
  message: string;
};

export type SalesPlanImportProductRow = {
  sales_item_name: string;
  column: string;
  qty: number;
  item_no: number | null;
  bulk_no: number | null;
  item_name: string;
  package_size: number;
  need_size: number;
  status: string;
  message: string;
};

export type SalesPlanImportSummary = {
  total_sales_rows: number;
  ok_sales_rows: number;
  total_product_rows: number;
  ok_product_rows: number;
  link_not_found: number;
  bom_not_found: number;
  bom_missing_items: string[];
  merged_sales_rows: number;
  duplicate_item_nos: string[];
  can_register: boolean;
};

export type SalesPlanImportErrorEntry = {
  error_code: string;
  sales_item_name: string;
  item_no: number | null;
  excel_column: string | null;
  qty: number | null;
  target_table: string;
  target_key: string;
  message: string;
};

export type SalesPlanImportPreview = {
  year: number;
  month: number;
  file_name: string;
  sales_rows: SalesPlanImportSalesRow[];
  product_rows: SalesPlanImportProductRow[];
  errors: SalesPlanImportErrorEntry[];
  summary: SalesPlanImportSummary;
};

export type SalesPlanImportRegisterResult = {
  ok: boolean;
  year: number;
  month: number;
  sales_count: number;
  product_count: number;
};

async function readApiError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { detail?: unknown };
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail;
  } catch {
    /* ignore */
  }
  return text || fallback;
}

async function postExcel(path: string, file: File): Promise<Response> {
  const url = `${base()}${path}`;
  const form = new FormData();
  form.append("file", file, file.name);
  try {
    return await fetch(url, { method: "POST", body: form });
  } catch (e) {
    throw new Error(formatFetchFailureMessage(url, e));
  }
}

export async function previewSalesPlanExcelImport(file: File): Promise<SalesPlanImportPreview> {
  const response = await postExcel("/import-excel/preview", file);
  if (!response.ok) {
    throw new Error(await readApiError(response, `プレビューに失敗しました (${response.status})`));
  }
  return (await response.json()) as SalesPlanImportPreview;
}

export async function registerSalesPlanExcelImport(file: File): Promise<SalesPlanImportRegisterResult> {
  const response = await postExcel("/import-excel/register", file);
  if (!response.ok) {
    throw new Error(await readApiError(response, `登録に失敗しました (${response.status})`));
  }
  const data = (await response.json()) as SalesPlanImportRegisterResult;
  if (data.ok !== true) {
    throw new Error("登録 API が失敗を返しました");
  }
  return data;
}
