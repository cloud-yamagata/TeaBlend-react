import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { BlendCategoryEditFormData } from "./blendCategoryEditTypes";
import type { BlendCategoryRow } from "./types";

const str = (v: string | null | undefined): string => v ?? "";
const bool = (v: boolean | null | undefined): boolean => v === true;

export function computeProductQuantity(
  unitWeight: number | null,
  unitNumber: number | null,
  fractionWeight: number | null
): number {
  const w = unitWeight ?? 0;
  const n = unitNumber ?? 0;
  const f = fractionWeight ?? 0;
  return w * n + f;
}

export function buildBlendCategoryEditForm(
  cache: MasterEntityCache,
  row: BlendCategoryRow
): BlendCategoryEditFormData {
  const lotNo = row.lotNo!;
  const base = cache.te_lot_base.find((e) => e.data.lot_no === lotNo);
  const use = cache.te_lot_use_item.find((e) => e.data.lot_no === lotNo);
  const blend = cache.te_lot_categorys_blend.find((e) => e.data.lot_no === lotNo);
  const common = cache.te_lot_categorys_common.find((e) => e.data.lot_no === lotNo);

  const b = base?.data;
  const fractionWeightRaw = b?.fraction_weight ?? null;
  const unitWeight = b?.unit_weight ?? row.unitWeight;
  const unitNumber = b?.unit_number ?? row.unitNumber;

  return {
    lotNo,
    organicClassCode: row.organicClassCode,
    productNo: row.productNo,
    makeYear: use?.data.make_year?.trim() || (row.makeYear != null ? String(row.makeYear) : null),
    itemName: row.itemName,
    count: use?.data.count?.trim() || (row.count != null ? String(row.count) : null),
    workDate: row.workDate,
    lotName: row.lotName,
    processTypeCode: row.processTypeCode,
    organicClass: row.organicClass,
    unitWeight,
    unitNumber,
    fractionWeightRaw,
    productQuantity: computeProductQuantity(unitWeight, unitNumber, fractionWeightRaw),
    applicationRemarks: blend?.data.remarks ?? b?.remarks ?? null,
    sensualTestColor: blend?.data.sensual_test_color ?? "",
    sensualTestTaste: blend?.data.sensual_test_taste ?? "",
    sensualTestAroma: blend?.data.sensual_test_aroma ?? "",
    blendRemarks: blend?.data.remarks ?? "",
    temperature: str(common?.data.temperature),
    humidity: str(common?.data.humidity),
    workStartHh: str(common?.data.work_start_hh),
    workStartMm: str(common?.data.work_start_mm),
    workEndHh: str(common?.data.work_end_hh),
    workEndMm: str(common?.data.work_end_mm),
    workBeforeCleaningStartHh: str(common?.data.work_before_cleaning_start_hh),
    workBeforeCleaningStartMm: str(common?.data.work_before_cleaning_start_mm),
    workBeforeCleaningEndHh: str(common?.data.work_before_cleaning_end_hh),
    workBeforeCleaningEndMm: str(common?.data.work_before_cleaning_end_mm),
    workEndCleaningStartHh: str(common?.data.work_end_cleaning_start_hh),
    workEndCleaningStartMm: str(common?.data.work_end_cleaning_start_mm),
    workEndCleaningEndHh: str(common?.data.work_end_cleaning_end_hh),
    workEndCleaningEndMm: str(common?.data.work_end_cleaning_end_mm),
    useDeviceUnit1: bool(common?.data.use_device_unit1_chk),
    useDeviceUnit2: bool(common?.data.use_device_unit2_chk),
    useDeviceUnit3: bool(common?.data.use_device_unit3_chk),
    packingCase1: bool(common?.data.packing_case1_chk),
    packingCase2: bool(common?.data.packing_case2_chk),
    workBeforeCleaningChk: bool(common?.data.work_before_cleaning_chk),
    workAfterCleaningChk: bool(common?.data.work_after_cleaning_chk),
    deviceChk: bool(common?.data.device_chk),
    operationChk: bool(common?.data.operation_chk),
    restChk: bool(common?.data.rest_chk),
    magnetCleaningChk: bool(common?.data.magnet_cleaning_chk)
  };
}

export function computeOverallJudge(color: string, taste: string, aroma: string): string {
  const c = Number(color);
  const t = Number(taste);
  const a = Number(aroma);
  const sum = (Number.isFinite(c) ? c : 0) + (Number.isFinite(t) ? t : 0) + (Number.isFinite(a) ? a : 0);
  return String(sum);
}
