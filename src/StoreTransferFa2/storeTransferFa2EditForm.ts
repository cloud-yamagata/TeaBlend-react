/**
 * 入出庫情報編集フォーム（StoreTransferFa2 EditWindow 登録／変更相当）
 */
import { normalizeDateToYmd } from "../lib/searchNormalize";
import type {
  StoreTransferFa2CreateBody,
  StoreTransferFa2UpdateBody
} from "../repositories/storeTransferFa2Repository";
import {
  lotTypeName,
  processTypeName,
  resultTypeName,
  transferTypeName
} from "./storeTransferFa2Display";
import type { StoreTransferFa2Row } from "./types";

export const PROCESS_TYPE_OPTIONS = [
  { value: "01", label: "荒茶原料" },
  { value: "02", label: "荒茶配合" },
  { value: "03", label: "仕上製造" },
  { value: "04", label: "火入製造" },
  { value: "05", label: "仕上配合" }
] as const;

export const TRANSFER_TYPE_OPTIONS = [
  { value: "1", label: "入庫" },
  { value: "2", label: "出庫" },
  { value: "3", label: "移動" }
] as const;

export const RESULT_TYPE_OPTIONS = [
  { value: "1", label: "生産" },
  { value: "2", label: "使用" },
  { value: "3", label: "受入" },
  { value: "4", label: "入荷" },
  { value: "5", label: "出荷" },
  { value: "6", label: "引当" },
  { value: "7", label: "返品" },
  { value: "8", label: "調整" }
] as const;

export const LOT_TYPE_OPTIONS = [
  { value: "1", label: "原料" },
  { value: "2", label: "仕上" },
  { value: "3", label: "商品" }
] as const;

export type StoreTransferFa2EditForm = {
  transferNo: string;
  transferDate: string;
  lotNo: string;
  lotName: string;
  processType: string;
  processTypeName: string;
  productNo: string;
  transferType: string;
  transferTypeName: string;
  resultType: string;
  resultTypeName: string;
  lotType: string;
  lotTypeName: string;
  reason: string;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  transferQuantity: string;
  unitType: string;
  remarks: string;
};

export type StoreTransferFa2EditFieldErrors = Partial<Record<keyof StoreTransferFa2EditForm, string>>;

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const qty = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "0";
const intStr = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? String(Math.trunc(n)) : "";

/** WPF StoreRepository.Init 相当（空の新規登録） */
export function createEmptyStoreTransferFa2EditForm(): StoreTransferFa2EditForm {
  return {
    transferNo: "",
    transferDate: todayYmd(),
    lotNo: "",
    lotName: "",
    processType: "01",
    processTypeName: processTypeName("01"),
    productNo: "",
    transferType: "1",
    transferTypeName: transferTypeName("1"),
    resultType: "1",
    resultTypeName: resultTypeName("1"),
    lotType: "1",
    lotTypeName: lotTypeName("1"),
    reason: "",
    unitWeight: "0",
    unitNumber: "0",
    fractionWeight: "0",
    fractionNumber: "0",
    transferQuantity: "0",
    unitType: "kg",
    remarks: ""
  };
}

export function createStoreTransferFa2EditFormFromRow(row: StoreTransferFa2Row): StoreTransferFa2EditForm {
  return {
    transferNo: String(row.transferNo),
    transferDate: normalizeDateToYmd(row.transferDate) ?? "",
    lotNo: intStr(row.lotNo),
    lotName: row.lotName,
    processType: row.processType,
    processTypeName: row.processTypeName,
    productNo: intStr(row.productNo),
    transferType: row.transferType,
    transferTypeName: row.transferTypeName,
    resultType: row.resultType,
    resultTypeName: row.resultTypeName,
    lotType: row.lotType,
    lotTypeName: row.lotTypeName,
    reason: row.reason,
    unitWeight: qty(row.unitWeight),
    unitNumber: row.unitNumber != null ? String(Math.trunc(row.unitNumber)) : "0",
    fractionWeight: qty(row.fractionWeight),
    fractionNumber: row.fractionNumber != null ? String(Math.trunc(row.fractionNumber)) : "0",
    transferQuantity: qty(row.transferQuantity),
    unitType: row.unitType,
    remarks: row.remarks
  };
}

export function sanitizeDecimal2Input(raw: string): string {
  const t = raw.replace(/[^\d.]/g, "");
  const parts = t.split(".");
  if (parts.length === 1) return parts[0] ?? "";
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
}

export function formatDecimal2OnBlur(raw: string): string {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) return raw.trim() === "" ? "" : raw;
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function validateStoreTransferFa2EditForm(
  form: StoreTransferFa2EditForm,
  mode: "create" | "update"
): StoreTransferFa2EditFieldErrors {
  const errors: StoreTransferFa2EditFieldErrors = {};
  if (!form.transferDate.trim()) errors.transferDate = "移動日を入力してください";
  if (!/^-?\d+(\.\d+)?$/.test(form.transferQuantity.trim())) {
    errors.transferQuantity = "移動量を入力してください";
  }
  if (mode === "create") {
    if (!/^\d+$/.test(form.lotNo.trim())) errors.lotNo = "ロットNOを入力してください";
    if (!form.lotName.trim()) errors.lotName = "ロット名を入力してください";
    if (!form.processType.trim()) errors.processType = "工程種別を選択してください";
    if (!/^\d+$/.test(form.productNo.trim())) errors.productNo = "製造NOを入力してください";
    if (!form.transferType.trim()) errors.transferType = "移動種別を選択してください";
    if (!form.resultType.trim()) errors.resultType = "実績種別を選択してください";
    if (!form.lotType.trim()) errors.lotType = "ロットタイプを選択してください";
  }
  return errors;
}

const emptyToNull = (v: string) => {
  const t = v.trim();
  return t ? t : null;
};
const toNumOrNull = (v: string): number | null => {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const toIntOrNull = (v: string): number | null => {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export function storeTransferFa2EditFormToCreateBody(
  form: StoreTransferFa2EditForm
): StoreTransferFa2CreateBody {
  return {
    transfer_date: form.transferDate.trim(),
    lot_no: Number(form.lotNo.trim()),
    process_type: form.processType.trim(),
    product_no: Number(form.productNo.trim()),
    lot_name: emptyToNull(form.lotName),
    transfer_type: form.transferType.trim(),
    result_type: form.resultType.trim(),
    lot_type: form.lotType.trim(),
    reason: emptyToNull(form.reason),
    unit_weight: toNumOrNull(form.unitWeight),
    unit_number: toIntOrNull(form.unitNumber),
    fraction_weight: toNumOrNull(form.fractionWeight),
    fraction_number: toIntOrNull(form.fractionNumber),
    transfer_quantity: Number(form.transferQuantity.trim()),
    unit_type: emptyToNull(form.unitType),
    remarks: emptyToNull(form.remarks)
  };
}

export function storeTransferFa2EditFormToUpdateBody(
  form: StoreTransferFa2EditForm
): StoreTransferFa2UpdateBody {
  return {
    transfer_no: Number(form.transferNo.trim()),
    transfer_date: form.transferDate.trim() || null,
    reason: emptyToNull(form.reason),
    unit_weight: toNumOrNull(form.unitWeight),
    unit_number: toIntOrNull(form.unitNumber),
    fraction_weight: toNumOrNull(form.fractionWeight),
    fraction_number: toIntOrNull(form.fractionNumber),
    transfer_quantity: Number(form.transferQuantity.trim()),
    remarks: emptyToNull(form.remarks)
  };
}
