/**
 * 製造報告書モーダルフォーム → te_package_base_new / te_package_categorys_new ペイロード
 */
import type { MasterEntityCache } from "../domain/masterTableEntityModels";
import type { TePackageLotPartInfo } from "../domain/packageReportEntities";
import { findPackageBaseByProductNo } from "./buildPackageLotEditFormFromRow";
import {
  buildLotPartInfoFromForm,
  compactLotDetailRows,
  extractLotDetailRows,
  isFilledLotDetailRow
} from "./packageLotDetailRows";
import { resolveLotStatusOnSave } from "./packageLotMandatoryFields";
import type {
  PackageLotEditBeforeAfter,
  PackageLotEditFormData,
  PackageLotEditMode,
  PackageLotEditTimeHm,
  PackageLotEditTimeRange
} from "./packageLotEditTypes";

export type PackageLotMutationPayload = {
  product_no: number;
  lot_status: string;
  baseRecord: Record<string, unknown>;
  categorysRecord: Record<string, unknown>;
};

const strOrNull = (value: string): string | null => {
  const t = value.trim();
  return t || null;
};

const parseIntField = (value: string, fallback = 0): number => {
  const n = Number(value.trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const parseIntOrNull = (value: string): number | null => {
  const t = value.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const hmFields = (prefix: string, time: PackageLotEditTimeHm): Record<string, string | null> => ({
  [`${prefix}_hh`]: strOrNull(time.hh),
  [`${prefix}_mm`]: strOrNull(time.mm)
});

const rangeFields = (prefix: string, range: PackageLotEditTimeRange): Record<string, string | null> => ({
  ...hmFields(`${prefix}_start`, range.start),
  ...hmFields(`${prefix}_end`, range.end)
});

const beforeAfterFields = (
  prefix: string,
  value: PackageLotEditBeforeAfter
): Record<string, boolean | null> => ({
  [`${prefix}_before_chk`]: value.before,
  [`${prefix}_after_chk`]: value.after
});

/** 新規登録用 product_no（キャッシュ上の最大 + 1） */
export function nextPackageProductNo(cache: MasterEntityCache): number {
  let max = 0;
  for (const row of cache.te_package_base_new) {
    max = Math.max(max, row.data.product_no);
  }
  return max + 1;
}

export function validatePackageLotFormForSave(
  form: PackageLotEditFormData,
  mode: PackageLotEditMode
): string | null {
  if (!form.itemNo.trim()) return "製品名（商品No）を指定してください。";
  if (!form.productName.trim()) return "製品名を指定してください。";
  if (!form.organicClass.trim()) return "茶区分を選択してください。";
  if (!form.workDate.trim()) return "製造日を入力してください。";

  if (mode === "update" || mode === "view") {
    const productNo = parseIntField(form.productNo, -1);
    if (productNo <= 0) return "製造Noが不正です。";
  }

  return null;
}

const buildCategorysFieldValues = (form: PackageLotEditFormData): Record<string, unknown> => ({
  temperature: strOrNull(form.temperature),
  humidity: strOrNull(form.humidity),
  ...hmFields("packing_start", form.packingStart),
  ...hmFields("packing_end", form.packingEnd),
  ...rangeFields("work_before_cleaning", form.cleaningBefore),
  ...rangeFields("work_end_cleaning", form.cleaningAfter),
  hp500_no1_chk: form.hp500No1Chk,
  hp500_no2_chk: form.hp500No2Chk,
  fr2_chk: form.fr2Chk,
  fpg_chk: form.fpgChk,
  uba_chk: form.ubaChk,
  ...beforeAfterFields("lift_cleaning", form.liftCleaning),
  ...beforeAfterFields("lift_operation", form.liftOperation),
  ...beforeAfterFields("lift_rem", form.liftRem),
  ...beforeAfterFields("packing_filter", form.packingFilter),
  ...beforeAfterFields("packing_seal", form.packingSeal),
  ...beforeAfterFields("packing_conveyor", form.packingConveyor),
  ...beforeAfterFields("packing_magnet", form.packingMagnet),
  ...beforeAfterFields("packing_operation", form.packingOperation),
  ...beforeAfterFields("packing_rem", form.packingRem),
  ...beforeAfterFields("tool_cleaning", form.toolCleaning),
  ...beforeAfterFields("uba3_cleaning", form.uba3Cleaning),
  weight_test_before_chk: strOrNull(form.weightTestBefore),
  weight_test_after_chk: strOrNull(form.weightTestAfter),
  residual_oxygen_am: strOrNull(form.residualOxygenAm),
  residual_oxygen_pm: strOrNull(form.residualOxygenPm),
  weight_no_1: strOrNull(form.weightNo1),
  weight_no_2: strOrNull(form.weightNo2),
  weight_no_3: strOrNull(form.weightNo3),
  weight_no_4: strOrNull(form.weightNo4),
  weight_no_5: strOrNull(form.weightNo5),
  weight_chk_1: strOrNull(form.weightChk1),
  weight_chk_2: strOrNull(form.weightChk2),
  weight_chk_3: strOrNull(form.weightChk3),
  weight_chk_4: strOrNull(form.weightChk4),
  weight_chk_5: strOrNull(form.weightChk5),
  remarks: strOrNull(form.categorysRemarks)
});

const buildCategorysRecord = (
  form: PackageLotEditFormData,
  productNo: number
): Record<string, unknown> => ({
  product_no: productNo,
  ...buildCategorysFieldValues(form)
});

const buildBaseFieldValues = (
  form: PackageLotEditFormData,
  lotStatus: string,
  lotPartInfo: TePackageLotPartInfo[]
): Record<string, unknown> => ({
  lot_status: lotStatus,
  organic_class: form.organicClass.trim().toUpperCase(),
  item_no: parseIntField(form.itemNo),
  product_name: form.productName.trim(),
  work_date: form.workDate.trim(),
  complete_quantity: parseIntField(form.completeQuantity),
  sample_quantity: parseIntField(form.sampleQuantity),
  fail_quantity: parseIntField(form.failQuantity),
  use_tea_no: parseIntOrNull(form.useTeaItemNo1),
  part_name: strOrNull(form.useTeaItemName1) ?? strOrNull(form.partName),
  remarks: strOrNull(form.categorysRemarks),
  lot_part_info: lotPartInfo.length > 0 ? lotPartInfo : null
});

const buildBaseRecord = (
  form: PackageLotEditFormData,
  productNo: number,
  lotStatus: string,
  lotPartInfo: TePackageLotPartInfo[]
): Record<string, unknown> => ({
  product_no: productNo,
  ...buildBaseFieldValues(form, lotStatus, lotPartInfo)
});

export type PackageLotApiCreateBody = {
  base_fields: Record<string, unknown>;
  category_fields: Record<string, unknown>;
};

export type PackageLotApiUpdateBody = PackageLotApiCreateBody & {
  product_no: number;
};

export function collectPackageLotCreateApiBody(
  form: PackageLotEditFormData
): PackageLotApiCreateBody {
  const lotPartInfo = buildLotPartInfoFromForm(form);
  const lotStatus = resolveLotStatusOnSave(form);
  return {
    base_fields: buildBaseFieldValues(form, lotStatus, lotPartInfo),
    category_fields: buildCategorysFieldValues(form)
  };
}

export function collectPackageLotUpdateApiBody(
  cache: MasterEntityCache,
  form: PackageLotEditFormData
): PackageLotApiUpdateBody {
  const productNo = parseIntField(form.productNo);
  const existing = findPackageBaseByProductNo(cache, productNo);
  if (!existing) {
    throw new Error(`製造No ${productNo} がキャッシュに存在しません。`);
  }
  const lotPartInfo = buildLotPartInfoFromForm(form);
  const lotStatus = resolveLotStatusOnSave(form, existing.data.lot_status);
  return {
    product_no: productNo,
    base_fields: buildBaseFieldValues(form, lotStatus, lotPartInfo),
    category_fields: buildCategorysFieldValues(form)
  };
}

export function collectPackageLotCreatePayload(
  cache: MasterEntityCache,
  form: PackageLotEditFormData,
  allocatedProductNo?: number
): PackageLotMutationPayload {
  const productNo = allocatedProductNo ?? nextPackageProductNo(cache);
  const lotPartInfo = buildLotPartInfoFromForm(form);
  const lotStatus = resolveLotStatusOnSave(form);
  return {
    product_no: productNo,
    lot_status: lotStatus,
    baseRecord: buildBaseRecord(form, productNo, lotStatus, lotPartInfo),
    categorysRecord: buildCategorysRecord(form, productNo)
  };
}

export function collectPackageLotUpdatePayload(
  cache: MasterEntityCache,
  form: PackageLotEditFormData
): PackageLotMutationPayload {
  const productNo = parseIntField(form.productNo);
  const existing = findPackageBaseByProductNo(cache, productNo);
  if (!existing) {
    throw new Error(`製造No ${productNo} がキャッシュに存在しません。`);
  }
  const lotStatus = resolveLotStatusOnSave(form, existing.data.lot_status);
  const lotPartInfo = buildLotPartInfoFromForm(form);
  return {
    product_no: productNo,
    lot_status: lotStatus,
    baseRecord: buildBaseRecord(form, productNo, lotStatus, lotPartInfo),
    categorysRecord: buildCategorysRecord(form, productNo)
  };
}

export function collectPackageLotDeleteProductNo(form: PackageLotEditFormData): number {
  const productNo = parseIntField(form.productNo);
  if (productNo <= 0) {
    throw new Error("製造Noが不正です。");
  }
  return productNo;
}

export type PackageLotConfirmStockTransferRow = {
  item_no: number;
  lot_no: number;
  transfer_quantity: number;
};

export type PackageLotConfirmStockApiBody = {
  product_no: number;
  transfer_rows: PackageLotConfirmStockTransferRow[];
};

/** システム日付（yyyy-mm-dd） */
const systemDateYmd = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseQtyField = (value: string): number => {
  const n = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** 在庫確定用：ロットが設定されている明細行（最大3行） */
export function collectPackageLotConfirmStockTransferRows(
  form: PackageLotEditFormData
): PackageLotConfirmStockTransferRow[] {
  const useTeaItemNo = parseIntField(form.useTeaItemNo1);
  if (useTeaItemNo <= 0) {
    throw new Error("使用茶Noが不正です。");
  }

  const rows = compactLotDetailRows(extractLotDetailRows(form))
    .filter(isFilledLotDetailRow)
    .map((row) => {
      const lotNo = parseIntField(row.partLotNo);
      if (lotNo <= 0) {
        throw new Error("ロットNoが不正です。");
      }
      return {
        item_no: useTeaItemNo,
        lot_no: lotNo,
        transfer_quantity: parseQtyField(row.useQuantity)
      };
    });

  if (rows.length === 0) {
    throw new Error("使用ロットが設定されていません。");
  }
  return rows;
}

export function collectPackageLotConfirmStockApiBody(
  form: PackageLotEditFormData
): PackageLotConfirmStockApiBody {
  const productNo = parseIntField(form.productNo);
  if (productNo <= 0) {
    throw new Error("製造Noが不正です。");
  }
  return {
    product_no: productNo,
    transfer_rows: collectPackageLotConfirmStockTransferRows(form)
  };
}

export function buildStoreTransferCacheRecord(
  transferNo: number,
  row: PackageLotConfirmStockTransferRow
): Record<string, unknown> {
  return {
    transfer_no: transferNo,
    transfer_date: `${systemDateYmd()}T00:00:00`,
    item_no: row.item_no,
    product_no: row.lot_no,
    transfer_type: "2",
    result_type: "2",
    lot_no: "",
    lot_type: "2",
    reason: "通常品使用",
    store_no: 3,
    store_party_name: "",
    unit_weight: 0,
    unit_number: 0,
    fraction_weight: 0,
    fraction_number: 0,
    transfer_quantity: row.transfer_quantity,
    unit_type: "Kg",
    remarks: ""
  };
}
