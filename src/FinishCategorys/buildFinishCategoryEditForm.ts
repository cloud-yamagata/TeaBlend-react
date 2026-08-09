import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import { computeProductQuantity } from "../BlendCategorys/buildBlendCategoryEditForm";
import type { FinishCategoryEditFormData, FinishCategoryUpsertPayload } from "./finishCategoryEditTypes";
import type { FinishCategoryRow } from "./types";

const str = (v: string | null | undefined): string => v ?? "";
const bool = (v: boolean | null | undefined): boolean => v === true;

export function buildFinishCategoryEditForm(
  cache: MasterEntityCache,
  row: FinishCategoryRow
): FinishCategoryEditFormData {
  const lotNo = row.lotNo!;
  const base = cache.te_lot_base.find((e) => e.data.lot_no === lotNo);
  const use = cache.te_lot_use_item.find((e) => e.data.lot_no === lotNo);
  const finish = cache.te_lot_categorys_finish.find((e) => e.data.lot_no === lotNo);
  const common = cache.te_lot_categorys_common.find((e) => e.data.lot_no === lotNo);

  const b = base?.data;
  const f = finish?.data;
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
    processTypeCode: b?.process_type.trim() ?? "03",
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
    sp1UseChk: bool(f?.sp1_use_chk),
    sp1Value1: str(f?.sp1_value_1),
    sp1Value2a: str(f?.sp1_value_2a),
    sp1Value2b: str(f?.sp1_value_2b),
    sp1Value2c: str(f?.sp1_value_2c),
    sp1Value3a: str(f?.sp1_value_3a),
    sp1Value3b: str(f?.sp1_value_3b),
    sp1Value4: str(f?.sp1_value_4),
    sp1Value5: str(f?.sp1_value_5),
    sp1Value6a: str(f?.sp1_value_6a),
    sp1Value6b: str(f?.sp1_value_6b),
    sp2UseChk: bool(f?.sp2_use_chk),
    sp2Value1: str(f?.sp2_value_1),
    sp2Value2a: str(f?.sp2_value_2a),
    sp2Value2b: str(f?.sp2_value_2b),
    sp2Value2c: str(f?.sp2_value_2c),
    sp2Value2d: str(f?.sp2_value_2d),
    sp2Value3a: str(f?.sp2_value_3a),
    sp2Value3b: str(f?.sp2_value_3b),
    sp2Value4a: str(f?.sp2_value_4a),
    sp2Value4b: str(f?.sp2_value_4b),
    sp2Value5: str(f?.sp2_value_5),
    etcValue1a: str(f?.etc_value_1a),
    etcValue1b: str(f?.etc_value_1b),
    etcValue1c: str(f?.etc_value_1c),
    etcValue2a: str(f?.etc_value_2a),
    etcValue2b: str(f?.etc_value_2b),
    etcValue2c: str(f?.etc_value_2c),
    etcValue2d: str(f?.etc_value_2d),
    etcUseChk3a: bool(f?.etc_use_chk3a),
    etcUseChk3b: bool(f?.etc_use_chk3b),
    etcValue3: str(f?.etc_value_3),
    pickup1Name: str(f?.pickup1_name),
    pickup1Weight: str(f?.pickup1_weight),
    pickup1Number: str(f?.pickup1_number),
    pickup1Fraction: str(f?.pickup1_fraction),
    pickup2Name: str(f?.pickup2_name),
    pickup2Weight: str(f?.pickup2_weight),
    pickup2Number: str(f?.pickup2_number),
    pickup2Fraction: str(f?.pickup2_fraction),
    pickup3Name: str(f?.pickup3_name),
    pickup3Weight: str(f?.pickup3_weight),
    pickup3Number: str(f?.pickup3_number),
    pickup3Fraction: str(f?.pickup3_fraction),
    pickup4Name: str(f?.pickup4_name),
    pickup4Weight: str(f?.pickup4_weight),
    pickup4Number: str(f?.pickup4_number),
    pickup4Fraction: str(f?.pickup4_fraction),
    finishRemarks: str(f?.remarks)
  };
}

export function computePickupQuantity(weight: string, number: string, fraction: string): string {
  const w = Number(weight) || 0;
  const n = Number(number) || 0;
  const f = Number(fraction) || 0;
  return String(w * n + f);
}

const trimOrNull = (value: string): string | null => {
  const t = value.trim();
  return t.length > 0 ? t : null;
};

export function formToFinishCategoryUpsertPayload(
  form: FinishCategoryEditFormData
): FinishCategoryUpsertPayload {
  return {
    lot_no: form.lotNo,
    sp1_use_chk: form.sp1UseChk,
    sp1_value_1: trimOrNull(form.sp1Value1),
    sp1_value_2a: trimOrNull(form.sp1Value2a),
    sp1_value_2b: trimOrNull(form.sp1Value2b),
    sp1_value_2c: trimOrNull(form.sp1Value2c),
    sp1_value_3a: trimOrNull(form.sp1Value3a),
    sp1_value_3b: trimOrNull(form.sp1Value3b),
    sp1_value_4: trimOrNull(form.sp1Value4),
    sp1_value_5: trimOrNull(form.sp1Value5),
    sp1_value_6a: trimOrNull(form.sp1Value6a),
    sp1_value_6b: trimOrNull(form.sp1Value6b),
    sp2_use_chk: form.sp2UseChk,
    sp2_value_1: trimOrNull(form.sp2Value1),
    sp2_value_2a: trimOrNull(form.sp2Value2a),
    sp2_value_2b: trimOrNull(form.sp2Value2b),
    sp2_value_2c: trimOrNull(form.sp2Value2c),
    sp2_value_2d: trimOrNull(form.sp2Value2d),
    sp2_value_3a: trimOrNull(form.sp2Value3a),
    sp2_value_3b: trimOrNull(form.sp2Value3b),
    sp2_value_4a: trimOrNull(form.sp2Value4a),
    sp2_value_4b: trimOrNull(form.sp2Value4b),
    sp2_value_5: trimOrNull(form.sp2Value5),
    etc_value_1a: trimOrNull(form.etcValue1a),
    etc_value_1b: trimOrNull(form.etcValue1b),
    etc_value_1c: trimOrNull(form.etcValue1c),
    etc_value_2a: trimOrNull(form.etcValue2a),
    etc_value_2b: trimOrNull(form.etcValue2b),
    etc_value_2c: trimOrNull(form.etcValue2c),
    etc_value_2d: trimOrNull(form.etcValue2d),
    etc_use_chk3a: form.etcUseChk3a,
    etc_use_chk3b: form.etcUseChk3b,
    etc_value_3: trimOrNull(form.etcValue3),
    pickup1_name: trimOrNull(form.pickup1Name),
    pickup1_weight: trimOrNull(form.pickup1Weight),
    pickup1_number: trimOrNull(form.pickup1Number),
    pickup1_fraction: trimOrNull(form.pickup1Fraction),
    pickup2_name: trimOrNull(form.pickup2Name),
    pickup2_weight: trimOrNull(form.pickup2Weight),
    pickup2_number: trimOrNull(form.pickup2Number),
    pickup2_fraction: trimOrNull(form.pickup2Fraction),
    pickup3_name: trimOrNull(form.pickup3Name),
    pickup3_weight: trimOrNull(form.pickup3Weight),
    pickup3_number: trimOrNull(form.pickup3Number),
    pickup3_fraction: trimOrNull(form.pickup3Fraction),
    pickup4_name: trimOrNull(form.pickup4Name),
    pickup4_weight: trimOrNull(form.pickup4Weight),
    pickup4_number: trimOrNull(form.pickup4Number),
    pickup4_fraction: trimOrNull(form.pickup4Fraction),
    remarks: trimOrNull(form.finishRemarks)
  };
}
