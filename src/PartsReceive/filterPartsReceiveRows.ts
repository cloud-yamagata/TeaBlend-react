/**
 * 仕上品受入一覧の構築・フィルタ
 * ロット別仕上茶在庫一覧（filterLotBulkTeaStockListRows）相当のクライアント側抽出
 */
import { matchesMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { filterRowsByCheckGroup } from "../reports/applyReportCheckGroupFilter";
import type { ReportFilterValues } from "../reports/components/ReportFilters";
import type { ReportFilterDef } from "../reports/registry";
import { reportMakeYearEnabledKey } from "../reports/registry";
import type { PartsReceiveStockDto } from "../repositories/partsReceiveRepository";
import type { PartsReceiveRow } from "./types";

export function mapPartsReceiveStockDto(dto: PartsReceiveStockDto): PartsReceiveRow {
  return {
    id: `${dto.item_no}-${dto.product_no}`,
    productDate: dto.product_date,
    itemNo: dto.item_no,
    productNo: dto.product_no,
    itemName: (dto.product_name ?? "").trim(),
    makeYear: dto.make_year == null ? "" : String(dto.make_year),
    count: dto.count == null ? "" : String(dto.count),
    productQuantity: Number(dto.product_quantity) || 0,
    factory2Stock: Number(dto.factory2_stock) || 0,
    factory3Stock: Number(dto.factory3_stock) || 0
  };
}

/** 製造日（product_date）の年と 2桁年度フィルタを照合 */
const matchesProductDateYear = (productDate: string | null, filterYearText: string): boolean => {
  if (!productDate) return false;
  const m = productDate.match(/^(\d{4})/);
  if (!m) return false;
  return matchesMakeYear(Number(m[1]), filterYearText);
};

const sameCalendarDate = (value: string | null, yyyyMmDd: string): boolean => {
  if (!value || !yyyyMmDd) return false;
  const norm = (s: string) => {
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return s;
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  };
  return norm(value) === norm(yyyyMmDd);
};

const toFilterRecord = (row: PartsReceiveRow): Record<string, unknown> => ({
  item_no: row.itemNo,
  product_name: row.itemName,
  product_date: row.productDate,
  product_quantity: row.productQuantity,
  factory2_stock: row.factory2Stock,
  factory3_stock: row.factory3Stock
});

export function filterPartsReceiveRows(
  allRows: PartsReceiveRow[],
  values: ReportFilterValues,
  filterDefs: ReportFilterDef[]
): PartsReceiveRow[] {
  const makeYearEnabled = values[reportMakeYearEnabledKey("make_year")] === "1";
  const yearText = makeYearEnabled ? normalizeMakeYearFromForm(String(values.make_year ?? "")) : null;
  const productDate = String(values.product_date ?? "").trim();
  const itemNo = String(values.item_no ?? "").trim();
  const itemName = String(values.item_name ?? "").trim();

  let rows = allRows.filter((r) => r.factory2Stock > 0 || r.factory3Stock > 0);

  if (yearText) {
    rows = rows.filter((row) => matchesProductDateYear(row.productDate, yearText));
  }

  if (productDate) {
    rows = rows.filter((row) => sameCalendarDate(row.productDate, productDate));
  }

  if (itemNo !== "") {
    rows = rows.filter((row) => String(row.itemNo).trim() === itemNo);
  } else if (itemName !== "") {
    rows = rows.filter((row) => row.itemName === itemName);
  }

  let paired = rows.map((row) => ({ row, rec: toFilterRecord(row) }));
  for (const f of filterDefs) {
    if (f.type !== "checkGroup") continue;
    const recs = paired.map((p) => p.rec);
    const filtered = filterRowsByCheckGroup(recs, f, values);
    const kept = new Set(filtered);
    paired = paired.filter((p) => kept.has(p.rec));
  }

  return paired
    .map((p) => p.row)
    .slice()
    .sort((a, b) => {
      if (a.itemNo !== b.itemNo) return a.itemNo - b.itemNo;
      const da = a.productDate ?? "";
      const db = b.productDate ?? "";
      if (da !== db) return da < db ? -1 : da > db ? 1 : 0;
      return a.productNo - b.productNo;
    });
}
