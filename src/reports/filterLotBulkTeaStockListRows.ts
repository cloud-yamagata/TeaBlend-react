/**
 * ロット別仕上茶在庫一覧 … 初回取得データに対するクライアント側検索
 */
import { matchesMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { filterRowsByCheckGroup } from "./applyReportCheckGroupFilter";
import type { ReportFilterValues } from "./components/ReportFilters";
import type { ReportFilterDef } from "./registry";
import { reportMakeYearEnabledKey } from "./registry";

/** 製造日（product_date）の年と 2桁年度フィルタを照合 */
const matchesProductDateYear = (productDate: unknown, filterYearText: string): boolean => {
  if (productDate == null) return false;
  const m = String(productDate).match(/^(\d{4})/);
  if (!m) return false;
  return matchesMakeYear(Number(m[1]), filterYearText);
};

export function filterLotBulkTeaStockListRows(
  allRows: Record<string, unknown>[],
  values: ReportFilterValues,
  filterDefs: ReportFilterDef[]
): Record<string, unknown>[] {
  const makeYearEnabled = values[reportMakeYearEnabledKey("make_year")] === "1";
  const yearText = makeYearEnabled ? normalizeMakeYearFromForm(String(values.make_year ?? "")) : null;
  const itemNo = String(values.item_no ?? "").trim();
  const itemName = String(values.item_name ?? "").trim();

  let rows = allRows;

  if (yearText) {
    rows = rows.filter((row) => matchesProductDateYear(row.product_date, yearText));
  }

  if (itemNo !== "") {
    rows = rows.filter((row) => String(row.item_no ?? "").trim() === itemNo);
  } else if (itemName !== "") {
    rows = rows.filter((row) => String(row.product_name ?? "") === itemName);
  }

  for (const f of filterDefs) {
    if (f.type === "checkGroup") {
      rows = filterRowsByCheckGroup(rows, f, values);
    }
  }

  return rows;
}
