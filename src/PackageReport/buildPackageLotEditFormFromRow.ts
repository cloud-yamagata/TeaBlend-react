/**
 * 一覧選択行 + マスタキャッシュから製造報告書モーダル表示データを組み立てる。
 *
 * ① te_package_base_new（一覧行の product_no で特定）
 * ② te_package_categorys_new（製造No = product_no で取得）
 * ③ ①②を PackageLotEditFormData にマッピング
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type {
  TePackageBaseNew,
  TePackageCategorysNew,
  TePackageCategorysNewData,
  TePackageLotPartInfo
} from "../domain/packageReportEntities";
import { createEmptyPackageLotEditForm } from "./createEmptyPackageLotEditForm";
import type {
  PackageLotEditBeforeAfter,
  PackageLotEditFormData,
  PackageLotEditTimeHm,
  PackageLotEditTimeRange
} from "./packageLotEditTypes";
import type { TrItem } from "../MonthlyPlan/types";
import {
  resolveUseTeaPartsFromItemBom,
  useTeaPartsToFormFields
} from "./resolveUseTeaPartsFromItemBom";
import {
  organicClassFieldsFromTrItem,
  toPackageLotOrganicClassCode
} from "./resolveOrganicClassFromTrItem";
import type { PackageLotRegistRow } from "./types";

const str = (v: string | number | null | undefined): string =>
  v == null ? "" : String(v).trim();

const intStr = (v: number | null | undefined): string =>
  v == null || !Number.isFinite(v) ? "" : String(Math.trunc(v));

/** Kg 数量表示（小数2桁まで・浮動小数点誤差を丸め） */
const qtyStr = (v: number | null | undefined): string => {
  if (v == null || !Number.isFinite(v)) return "";
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const bool = (v: boolean | null | undefined): boolean => v === true;

const toOrganicClassCode = toPackageLotOrganicClassCode;

const toDateInputValue = (workDate: string | null): string => {
  if (!workDate) return "";
  const m = workDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
};

const timeHm = (hh: string | null | undefined, mm: string | null | undefined): PackageLotEditTimeHm => ({
  hh: str(hh),
  mm: str(mm)
});

const timeRange = (
  startHh: string | null | undefined,
  startMm: string | null | undefined,
  endHh: string | null | undefined,
  endMm: string | null | undefined
): PackageLotEditTimeRange => ({
  start: timeHm(startHh, startMm),
  end: timeHm(endHh, endMm)
});

const beforeAfter = (
  before: boolean | null | undefined,
  after: boolean | null | undefined
): PackageLotEditBeforeAfter => ({
  before: bool(before),
  after: bool(after)
});

/** ① te_package_base_new を製造Noで取得 */
export function findPackageBaseByProductNo(
  cache: MasterEntityCache,
  productNo: number
): TePackageBaseNew | undefined {
  return cache.te_package_base_new.find((p) => p.data.product_no === productNo);
}

/** ② te_package_categorys_new を製造Noで取得 */
export function findPackageCategorysByProductNo(
  cache: MasterEntityCache,
  productNo: number
): TePackageCategorysNew | undefined {
  return cache.te_package_categorys_new.find((c) => c.data.product_no === productNo);
}

/** 使用数量（出庫 − 使用残。JSON に use_quantity があれば優先） */
const partUseQuantity = (part: TePackageLotPartInfo | undefined): string => {
  if (!part) return "";
  if (part.use_quantity != null && Number.isFinite(part.use_quantity)) {
    return qtyStr(part.use_quantity);
  }
  const out = part.out_quantity;
  if (out == null || !Number.isFinite(out)) return "";
  const rem = part.rem_quantity;
  const use = out - (rem != null && Number.isFinite(rem) ? rem : 0);
  return qtyStr(use);
};

type LotPartFormSlice = {
  partLotNo: string;
  outQuantity: string;
  useQuantity: string;
  remQuantity: string;
};

const mapLotPartRow = (part: TePackageLotPartInfo | undefined): LotPartFormSlice => ({
  partLotNo: intStr(part?.part_lot_no),
  outQuantity: qtyStr(part?.out_quantity),
  useQuantity: partUseQuantity(part),
  remQuantity: qtyStr(part?.rem_quantity)
});

const mapCategorys = (
  base: PackageLotEditFormData,
  category: TePackageCategorysNewData | undefined,
  baseRemarks: string | null | undefined
): PackageLotEditFormData => {
  if (!category) {
    return {
      ...base,
      categorysRemarks: str(baseRemarks)
    };
  }
  return {
    ...base,
    temperature: str(category.temperature),
    humidity: str(category.humidity),
    packingStart: timeHm(category.packing_start_hh, category.packing_start_mm),
    packingEnd: timeHm(category.packing_end_hh, category.packing_end_mm),
    cleaningBefore: timeRange(
      category.work_before_cleaning_start_hh,
      category.work_before_cleaning_start_mm,
      category.work_before_cleaning_end_hh,
      category.work_before_cleaning_end_mm
    ),
    cleaningAfter: timeRange(
      category.work_end_cleaning_start_hh,
      category.work_end_cleaning_start_mm,
      category.work_end_cleaning_end_hh,
      category.work_end_cleaning_end_mm
    ),
    hp500No1Chk: bool(category.hp500_no1_chk),
    hp500No2Chk: bool(category.hp500_no2_chk),
    fr2Chk: bool(category.fr2_chk),
    fpgChk: bool(category.fpg_chk),
    ubaChk: bool(category.uba_chk),
    liftCleaning: beforeAfter(
      category.lift_cleaning_before_chk,
      category.lift_cleaning_after_chk
    ),
    liftOperation: beforeAfter(
      category.lift_operation_before_chk,
      category.lift_operation_after_chk
    ),
    liftRem: beforeAfter(category.lift_rem_before_chk, category.lift_rem_after_chk),
    packingFilter: beforeAfter(
      category.packing_filter_before_chk,
      category.packing_filter_after_chk
    ),
    packingSeal: beforeAfter(category.packing_seal_before_chk, category.packing_seal_after_chk),
    packingConveyor: beforeAfter(
      category.packing_conveyor_before_chk,
      category.packing_conveyor_after_chk
    ),
    packingMagnet: beforeAfter(
      category.packing_magnet_before_chk,
      category.packing_magnet_after_chk
    ),
    packingOperation: beforeAfter(
      category.packing_operation_before_chk,
      category.packing_operation_after_chk
    ),
    packingRem: beforeAfter(category.packing_rem_before_chk, category.packing_rem_after_chk),
    toolCleaning: beforeAfter(
      category.tool_cleaning_before_chk,
      category.tool_cleaning_after_chk
    ),
    uba3Cleaning: beforeAfter(
      category.uba3_cleaning_before_chk,
      category.uba3_cleaning_after_chk
    ),
    weightTestBefore: str(category.weight_test_before_chk),
    weightTestAfter: str(category.weight_test_after_chk),
    residualOxygenAm: str(category.residual_oxygen_am),
    residualOxygenPm: str(category.residual_oxygen_pm),
    weightNo1: str(category.weight_no_1),
    weightNo2: str(category.weight_no_2),
    weightNo3: str(category.weight_no_3),
    weightNo4: str(category.weight_no_4),
    weightNo5: str(category.weight_no_5),
    weightChk1: str(category.weight_chk_1),
    weightChk2: str(category.weight_chk_2),
    weightChk3: str(category.weight_chk_3),
    weightChk4: str(category.weight_chk_4),
    weightChk5: str(category.weight_chk_5),
    categorysRemarks: str(category.remarks) || str(baseRemarks)
  };
};

/** ③ ①②と一覧行をモーダルフォームへマッピング */
const enrichFormWithUseTeaParts = (
  form: PackageLotEditFormData,
  cache: MasterEntityCache,
  trItems: TrItem[] | undefined
): PackageLotEditFormData => {
  let next = form;
  if (trItems?.length && form.itemNo.trim()) {
    next = { ...next, ...organicClassFieldsFromTrItem(trItems, form.itemNo) };
  }
  if (!trItems?.length || !form.itemNo.trim()) return next;
  const parts = resolveUseTeaPartsFromItemBom(cache, trItems, form.itemNo);
  if (parts.length === 0) return next;
  return { ...next, ...useTeaPartsToFormFields(parts) };
};

export function buildPackageLotEditFormFromProductNo(
  cache: MasterEntityCache,
  productNo: number,
  rowFallback?: PackageLotRegistRow,
  trItems?: TrItem[]
): PackageLotEditFormData {
  const pkg = findPackageBaseByProductNo(cache, productNo);
  const category = findPackageCategorysByProductNo(cache, productNo);
  const base = pkg?.data;

  const organicCode = toOrganicClassCode(base?.organic_class ?? rowFallback?.organicClassCode ?? "");
  const parts = base?.lot_part_info ?? [];
  const part1 = mapLotPartRow(parts[0]);
  const part2 = mapLotPartRow(parts[1]);
  const part3 = mapLotPartRow(parts[2]);

  const form: PackageLotEditFormData = {
    ...createEmptyPackageLotEditForm(),
    lotStatusCode: str(base?.lot_status) || "1",
    organicClassPrefix: organicCode,
    productNo: intStr(base?.product_no ?? rowFallback?.productNo ?? productNo),
    itemNo: intStr(base?.item_no ?? rowFallback?.itemNo),
    productName: str(base?.product_name ?? rowFallback?.productName),
    organicClass: organicCode,
    workDate: toDateInputValue(base?.work_date ?? rowFallback?.workDate ?? null),
    partName: str(base?.part_name ?? rowFallback?.partName),
    completeQuantity: intStr(base?.complete_quantity ?? rowFallback?.completeQuantity),
    sampleQuantity: intStr(base?.sample_quantity),
    failQuantity: intStr(base?.fail_quantity),
    partLotNo1: part1.partLotNo,
    outQuantity1: part1.outQuantity,
    useQuantity1: part1.useQuantity,
    remQuantity1: part1.remQuantity,
    partLotNo2: part2.partLotNo,
    outQuantity2: part2.outQuantity,
    useQuantity2: part2.useQuantity,
    remQuantity2: part2.remQuantity,
    partLotNo3: part3.partLotNo,
    outQuantity3: part3.outQuantity,
    useQuantity3: part3.useQuantity,
    remQuantity3: part3.remQuantity,
    gradeNo: intStr(rowFallback?.gradeNo)
  };

  const mapped = mapCategorys(form, category?.data, base?.remarks);
  return enrichFormWithUseTeaParts(mapped, cache, trItems);
}

/** 一覧の表示・変更ボタン用（選択行から ①②③ を実行） */
export function buildPackageLotEditFormFromRow(
  cache: MasterEntityCache,
  row: PackageLotRegistRow,
  trItems?: TrItem[]
): PackageLotEditFormData {
  const productNo = row.productNo;
  if (productNo == null || !Number.isFinite(productNo)) {
    return createEmptyPackageLotEditForm();
  }
  return buildPackageLotEditFormFromProductNo(cache, productNo, row, trItems);
}
