/**
 * 一覧選択行 + bootstrap キャッシュから登録モーダル表示データを組み立てる。
 *
 * te_lot_categorys_common は DB 上 lot_no キー。仕様書の「製造No」は当該明細の lot_no に相当。
 * te_lot_part.part_no を子ロット lot_no として te_lot_base / te_lot_use_item を引く。
 */
import type { MasterEntityCache, TeLotBaseData } from "../domain/masterTableEntityModels";
import type { TeLotCategorysCommonData } from "../domain/wideLotCategoryEntities";
import { formatFactory2ProcessType, normalizeProcessTypeCode } from "./factory2LotDisplay";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "./factory2MakeYear";
import type { Factory2LotEditFormData, Factory2LotEditPartRow } from "./factory2LotEditTypes";
import type { Factory2LotRow, Factory2ProcessFilter } from "./types";

const numberFormatter = new Intl.NumberFormat("ja-JP");

const str = (v: string | number | null | undefined): string =>
  v == null ? "" : String(v).trim();

const bool = (v: boolean | null | undefined): boolean => v === true;

const formatNum = (n: number | null | undefined, fractionDigits?: number): string => {
  if (n == null || !Number.isFinite(n)) return "";
  if (fractionDigits != null) return n.toFixed(fractionDigits);
  return numberFormatter.format(n);
};

const toDateInputValue = (workDate: string | null): string => {
  if (!workDate) return "";
  const m = workDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const processShortName = (processTypeCode: string): string => {
  const full = formatFactory2ProcessType(processTypeCode);
  const idx = full.indexOf(":");
  return idx >= 0 ? full.slice(idx + 1) : full;
};

const indexByLotNo = <T extends { data: { lot_no: number } }>(list: T[]): Map<number, T> => {
  const map = new Map<number, T>();
  for (const item of list) {
    map.set(item.data.lot_no, item);
  }
  return map;
};

const emptyChecks = (): Factory2LotEditFormData["checks"] => ({
  useDeviceUnit1: false,
  useDeviceUnit2: false,
  useDeviceUnit3: false,
  packingCase1: false,
  packingCase2: false,
  workBeforeCleaning: false,
  workAfterCleaning: false,
  device: false,
  operation: false,
  rest: false,
  magnetCleaning: false
});

const checksFromCategory = (c: TeLotCategorysCommonData | undefined): Factory2LotEditFormData["checks"] => {
  if (!c) return emptyChecks();
  return {
    useDeviceUnit1: bool(c.use_device_unit1_chk),
    useDeviceUnit2: bool(c.use_device_unit2_chk),
    useDeviceUnit3: bool(c.use_device_unit3_chk),
    packingCase1: bool(c.packing_case1_chk),
    packingCase2: bool(c.packing_case2_chk),
    workBeforeCleaning: bool(c.work_before_cleaning_chk),
    workAfterCleaning: bool(c.work_after_cleaning_chk),
    device: bool(c.device_chk),
    operation: bool(c.operation_chk),
    rest: bool(c.rest_chk),
    magnetCleaning: bool(c.magnet_cleaning_chk)
  };
};

const envFromCategory = (
  c: TeLotCategorysCommonData | undefined
): Pick<
  Factory2LotEditFormData,
  "temperature" | "humidity" | "workStart" | "workEnd" | "cleaningBefore" | "cleaningAfter"
> => ({
  temperature: str(c?.temperature),
  humidity: str(c?.humidity),
  workStart: { hh: str(c?.work_start_hh), mm: str(c?.work_start_mm) },
  workEnd: { hh: str(c?.work_end_hh), mm: str(c?.work_end_mm) },
  cleaningBefore: {
    startHh: str(c?.work_before_cleaning_start_hh),
    startMm: str(c?.work_before_cleaning_start_mm),
    endHh: str(c?.work_before_cleaning_end_hh),
    endMm: str(c?.work_before_cleaning_end_mm)
  },
  cleaningAfter: {
    startHh: str(c?.work_end_cleaning_start_hh),
    startMm: str(c?.work_end_cleaning_start_mm),
    endHh: str(c?.work_end_cleaning_end_hh),
    endMm: str(c?.work_end_cleaning_end_mm)
  }
});

const buildPartRows = (
  cache: MasterEntityCache,
  parentLotNo: number,
  baseByLot: Map<number, { data: TeLotBaseData }>
): Factory2LotEditPartRow[] => {
  const useByLot = indexByLotNo(cache.te_lot_use_item);
  const parts = cache.te_lot_part.filter((p) => p.data.lot_no === parentLotNo);

  return parts.map((part, index) => {
    const childLotNo = part.data.part_no;
    const childBase = baseByLot.get(childLotNo)?.data;
    const childUse = useByLot.get(childLotNo)?.data;

    return {
      id: `part-${parentLotNo}-${childLotNo}-${index}`,
      parentLotNo: "",
      partLotNo: String(childLotNo),
      lotNo: String(childLotNo),
      processName: childBase ? processShortName(childBase.process_type) : "",
      partNo: String(part.data.part_no),
      productNo: childBase ? String(childBase.product_no) : "",
      partName: childBase?.lot_name ?? "",
      makeYear: str(childUse?.make_year),
      count: str(childUse?.count),
      useQuantity: formatNum(part.data.use_quantity, 2),
      remarks: str(part.data.remarks)
    };
  });
};

const sumInputQuantity = (rows: Factory2LotEditPartRow[]): string => {
  let total = 0;
  for (const row of rows) {
    const n = Number(row.useQuantity.replace(/,/g, ""));
    if (Number.isFinite(n)) total += n;
  }
  return total > 0 ? formatNum(total, 2) : "";
};

/** 新規登録モーダル用（1段目の工程・通称名のみ事前セット） */
export function buildFactory2LotEditFormForCreate(
  menuProcess: Factory2ProcessFilter,
  itemName: string
): Factory2LotEditFormData {
  return {
    lotNo: null,
    lotStatusCode: "",
    gradeNo: null,
    organicClassCode: "C",
    processTypeCode: menuProcess,
    productNo: null,
    makeYear: getDefaultMakeYear(),
    itemName: itemName.trim(),
    count: "",
    workDate: "",
    lotName: "",
    unitWeight: "",
    unitNumber: "",
    fractionWeight: "",
    fractionNumber: "",
    productQuantity: "",
    inputQuantity: "",
    summaryRemarks: "",
    temperature: "",
    humidity: "",
    workStart: { hh: "", mm: "" },
    workEnd: { hh: "", mm: "" },
    cleaningBefore: { startHh: "", startMm: "", endHh: "", endMm: "" },
    cleaningAfter: { startHh: "", startMm: "", endHh: "", endMm: "" },
    checks: emptyChecks(),
    partRows: []
  };
}

/** 変更：一覧選択行からモーダル表示データを組み立て */
export function buildFactory2LotEditFormFromRow(
  cache: MasterEntityCache,
  row: Factory2LotRow
): Factory2LotEditFormData {
  const baseByLot = indexByLotNo(cache.te_lot_base);
  const categoryByLot = indexByLotNo(cache.te_lot_categorys_common);

  const lotNo = row.lotNo;
  const base = lotNo != null ? baseByLot.get(lotNo)?.data : undefined;
  const category = lotNo != null ? categoryByLot.get(lotNo)?.data : undefined;

  const partRows = lotNo != null ? buildPartRows(cache, lotNo, baseByLot) : [];

  const unitWeight = base?.unit_weight ?? row.unitWeight ?? 0;
  const unitNumber = base?.unit_number ?? row.unitNumber ?? 0;
  const productQty = unitWeight * unitNumber;

  const processCode = normalizeProcessTypeCode(row.processTypeCode) as Factory2ProcessFilter;
  const gradeRow =
    lotNo != null ? cache.te_grade.find((g) => g.data.lot_no === lotNo) : undefined;

  return {
    lotNo,
    lotStatusCode: row.lotStatusCode.trim(),
    gradeNo: gradeRow?.data.grade_no ?? null,
    organicClassCode: (row.organicClassCode || base?.organic_class || "C").trim().toUpperCase(),
    processTypeCode: processCode,
    productNo: row.productNo ?? base?.product_no ?? null,
    makeYear:
      row.makeYear != null ? normalizeMakeYearFromForm(String(row.makeYear)) : "",
    itemName: str(row.itemName),
    count: row.count != null ? String(row.count) : "",
    workDate: toDateInputValue(row.workDate ?? base?.work_date ?? null),
    lotName: str(row.lotName ?? base?.lot_name),
    unitWeight: formatNum(unitWeight),
    unitNumber: formatNum(unitNumber),
    fractionWeight: formatNum(base?.fraction_weight ?? null, 2),
    fractionNumber: base?.fraction_number != null ? String(base.fraction_number) : "",
    productQuantity: productQty > 0 ? formatNum(productQty, 2) : "",
    inputQuantity: sumInputQuantity(partRows),
    summaryRemarks: str(row.remarks ?? base?.remarks),
    ...envFromCategory(category),
    checks: checksFromCategory(category),
    partRows
  };
}
