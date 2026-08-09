import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import {
  computeOverallJudge,
  computeProductQuantity
} from "../BlendCategorys/buildBlendCategoryEditForm";
import type { FirepanCategoryEditFormData, FirepanCategoryUpsertPayload } from "./firepanCategoryEditTypes";
import type { FirepanCategoryRow } from "./types";

const str = (v: string | null | undefined): string => v ?? "";
const bool = (v: boolean | null | undefined): boolean => v === true;

export function computeFirepanMachineLabel(
  use1: boolean,
  use2: boolean,
  use3: boolean
): string {
  if (use1) return "①";
  if (use2) return "②";
  if (use3) return "ほうじ機";
  return "";
}

export { computeOverallJudge };

export function buildFirepanCategoryEditForm(
  cache: MasterEntityCache,
  row: FirepanCategoryRow
): FirepanCategoryEditFormData {
  const lotNo = row.lotNo!;
  const base = cache.te_lot_base.find((e) => e.data.lot_no === lotNo);
  const use = cache.te_lot_use_item.find((e) => e.data.lot_no === lotNo);
  const firepan = cache.te_lot_categorys_firepan.find((e) => e.data.lot_no === lotNo);
  const common = cache.te_lot_categorys_common.find((e) => e.data.lot_no === lotNo);

  const b = base?.data;
  const fp = firepan?.data;
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
    processTypeCode: b?.process_type.trim() ?? "04",
    unitWeight,
    unitNumber,
    fractionWeightRaw,
    productQuantity: computeProductQuantity(unitWeight, unitNumber, fractionWeightRaw),
    applicationRemarks: b?.remarks ?? null,
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
    magnetCleaningChk: bool(common?.data.magnet_cleaning_chk),
    firValue1: str(fp?.fir_value_1),
    firValue2: str(fp?.fir_value_2),
    firValue3a: str(fp?.fir_value_3a),
    firValue3b: str(fp?.fir_value_3b),
    firValue4a: str(fp?.fir_value_4a),
    firValue4b: str(fp?.fir_value_4b),
    firValue4c: str(fp?.fir_value_4c),
    firValue5: str(fp?.fir_value_5),
    firValue6: str(fp?.fir_value_6),
    firValue7: str(fp?.fir_value_7),
    sensualTestColorBefore: str(fp?.sensual_test_color_before),
    sensualTestTasteBefore: str(fp?.sensual_test_taste_before),
    sensualTestAromaBefore: str(fp?.sensual_test_aroma_before),
    sensualTestCommentBefore: str(fp?.sensual_test_comment_before),
    sensualTestColorAfter: str(fp?.sensual_test_color_after),
    sensualTestTasteAfter: str(fp?.sensual_test_taste_after),
    sensualTestAromaAfter: str(fp?.sensual_test_aroma_after),
    sensualTestCommentAfter: str(fp?.sensual_test_comment_after),
    firepanRemarks: str(fp?.remarks)
  };
}

const trimOrNull = (value: string): string | null => {
  const t = value.trim();
  return t.length > 0 ? t : null;
};

export function formToFirepanCategoryUpsertPayload(
  form: FirepanCategoryEditFormData
): FirepanCategoryUpsertPayload {
  return {
    lot_no: form.lotNo,
    fir_value_1: trimOrNull(form.firValue1),
    fir_value_2: trimOrNull(form.firValue2),
    fir_value_3a: trimOrNull(form.firValue3a),
    fir_value_3b: trimOrNull(form.firValue3b),
    fir_value_4a: trimOrNull(form.firValue4a),
    fir_value_4b: trimOrNull(form.firValue4b),
    fir_value_4c: trimOrNull(form.firValue4c),
    fir_value_5: trimOrNull(form.firValue5),
    fir_value_6: trimOrNull(form.firValue6),
    fir_value_7: trimOrNull(form.firValue7),
    sensual_test_color_before: trimOrNull(form.sensualTestColorBefore),
    sensual_test_taste_before: trimOrNull(form.sensualTestTasteBefore),
    sensual_test_aroma_before: trimOrNull(form.sensualTestAromaBefore),
    sensual_test_comment_before: trimOrNull(form.sensualTestCommentBefore),
    sensual_test_color_after: trimOrNull(form.sensualTestColorAfter),
    sensual_test_taste_after: trimOrNull(form.sensualTestTasteAfter),
    sensual_test_aroma_after: trimOrNull(form.sensualTestAromaAfter),
    sensual_test_comment_after: trimOrNull(form.sensualTestCommentAfter),
    remarks: trimOrNull(form.firepanRemarks)
  };
}
