/**
 * 第3工場入出庫情報編集フォーム（te_store_transfer 登録／変更相当）
 */
import { normalizeDateToYmd } from "../lib/searchNormalize";
import type { StoreTransferCreateBody, StoreTransferUpdateBody } from "../repositories/storeTransferRepository";
import { lotTypeName, resultTypeName, transferTypeName } from "./storeTransferDisplay";
import { FACTORY3_STORE_NO, type StoreTransferRow } from "./types";

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

export type StoreTransferEditForm = {
  transferNo: string;
  transferDate: string;
  itemNo: string;
  productNo: string;
  lotNo: string;
  storeNo: string;
  storePartyName: string;
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

export type StoreTransferEditFieldErrors = Partial<Record<keyof StoreTransferEditForm, string>>;

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const qty = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "0";
const intStr = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? String(Math.trunc(n)) : "";

export function createEmptyStoreTransferEditForm(): StoreTransferEditForm {
  return {
    transferNo: "",
    transferDate: todayYmd(),
    itemNo: "",
    productNo: "",
    lotNo: "",
    storeNo: String(FACTORY3_STORE_NO),
    storePartyName: "",
    transferType: "1",
    transferTypeName: transferTypeName("1"),
    resultType: "1",
    resultTypeName: resultTypeName("1"),
    lotType: "2",
    lotTypeName: lotTypeName("2"),
    reason: "",
    unitWeight: "0",
    unitNumber: "0",
    fractionWeight: "0",
    fractionNumber: "0",
    transferQuantity: "0",
    unitType: "Kg",
    remarks: ""
  };
}

export function createStoreTransferEditFormFromRow(row: StoreTransferRow): StoreTransferEditForm {
  return {
    transferNo: String(row.transferNo),
    transferDate: normalizeDateToYmd(row.transferDate) ?? "",
    itemNo: intStr(row.itemNo),
    productNo: intStr(row.productNo),
    lotNo: row.lotNo,
    storeNo: intStr(row.storeNo),
    storePartyName: row.storePartyName,
    transferType: row.transferType,
    transferTypeName: row.transferTypeName,
    resultType: row.resultType,
    resultTypeName: row.resultTypeName,
    lotType: row.lotType,
    lotTypeName: row.lotTypeName,
    reason: row.reason,
    unitWeight: qty(row.unitWeight),
    unitNumber: intStr(row.unitNumber),
    fractionWeight: qty(row.fractionWeight),
    fractionNumber: intStr(row.fractionNumber),
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

export function validateStoreTransferEditForm(
  form: StoreTransferEditForm,
  mode: "create" | "update"
): StoreTransferEditFieldErrors {
  const errors: StoreTransferEditFieldErrors = {};
  if (!form.transferDate.trim()) errors.transferDate = "移動日を入力してください";
  if (!/^-?\d+(\.\d+)?$/.test(form.transferQuantity.trim())) {
    errors.transferQuantity = "移動量を入力してください";
  }
  if (mode === "create") {
    if (!/^\d+$/.test(form.itemNo.trim())) errors.itemNo = "商品NOを入力してください";
    if (!/^\d+$/.test(form.productNo.trim())) errors.productNo = "製造NOを入力してください";
    if (!form.lotNo.trim()) errors.lotNo = "ロットNOを入力してください";
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

export function storeTransferEditFormToCreateBody(form: StoreTransferEditForm): StoreTransferCreateBody {
  return {
    transfer_date: form.transferDate.trim(),
    item_no: Number(form.itemNo.trim()),
    product_no: Number(form.productNo.trim()),
    transfer_type: form.transferType.trim(),
    result_type: form.resultType.trim(),
    lot_no: form.lotNo.trim(),
    lot_type: form.lotType.trim(),
    reason: emptyToNull(form.reason),
    store_no: FACTORY3_STORE_NO,
    store_party_name: emptyToNull(form.storePartyName),
    unit_weight: Number(form.unitWeight.trim() || "0"),
    unit_number: Number(form.unitNumber.trim() || "0"),
    fraction_weight: Number(form.fractionWeight.trim() || "0"),
    fraction_number: Number(form.fractionNumber.trim() || "0"),
    transfer_quantity: Number(form.transferQuantity.trim()),
    unit_type: emptyToNull(form.unitType),
    remarks: emptyToNull(form.remarks)
  };
}

export function storeTransferEditFormToUpdateBody(form: StoreTransferEditForm): StoreTransferUpdateBody {
  return {
    transfer_no: Number(form.transferNo.trim()),
    transfer_date: form.transferDate.trim() || null,
    reason: emptyToNull(form.reason),
    store_party_name: emptyToNull(form.storePartyName),
    unit_weight: toNumOrNull(form.unitWeight),
    unit_number: toIntOrNull(form.unitNumber),
    fraction_weight: toNumOrNull(form.fractionWeight),
    fraction_number: toIntOrNull(form.fractionNumber),
    transfer_quantity: Number(form.transferQuantity.trim()),
    remarks: emptyToNull(form.remarks)
  };
}
