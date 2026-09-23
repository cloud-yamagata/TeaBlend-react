/**
 * 仕入振分実績メンテナンス（SubEditWindow.xaml）フォーム
 */
import { getDefaultMakeYear } from "../Factory2LotManufacture/factory2MakeYear";
import {
  formatPurchaseDecimal2OnBlur,
  sanitizePurchaseDecimal2Input,
  sanitizePurchaseIntegerInput
} from "./purchaseTtransferEditForm";

export const PURCHASE_TRANSFER_UNSPECIFIED_GUIDE = "指定不可";

export const PURCHASE_TRANSFER_RESULT_TYPES = [
  { code: "1", label: "工場" },
  { code: "2", label: "転売" },
  { code: "3", label: "児湯茶" }
] as const;

export type PurchaseTransferResultTypeCode = (typeof PURCHASE_TRANSFER_RESULT_TYPES)[number]["code"];

export type PurchaseTransferEditForm = {
  year: string;
  purchase: string;
  bidNo: string;
  resultType: PurchaseTransferResultTypeCode;
  transfer: string;
  transferDate: string;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  unitPrice: string;
  remarks: string;
};

const todayIsoDate = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function createEmptyPurchaseTransferEditForm(initialYear?: string): PurchaseTransferEditForm {
  return {
    year: initialYear ?? getDefaultMakeYear(),
    purchase: "",
    bidNo: "",
    resultType: "2",
    transfer: "",
    transferDate: todayIsoDate(),
    unitWeight: "0.00",
    unitNumber: "0",
    fractionWeight: "0.00",
    fractionNumber: "0",
    unitPrice: "0.00",
    remarks: ""
  };
}

const toIntText = (value: number | null | undefined): string => (value == null ? "0" : String(value));
const toDecimal2Text = (value: number | null | undefined): string =>
  value == null ? "0.00" : (Math.round(value * 100) / 100).toFixed(2);

const yearToForm = (year: number | null | undefined, fallback?: string): string => {
  if (year == null) return fallback ?? getDefaultMakeYear();
  return String(year >= 100 ? year % 100 : year).padStart(2, "0");
};

/** 工場/児湯茶は振分先を固定（WPF SubEdit SetStock 相当） */
export function resolvePurchaseTransferDestination(
  resultType: PurchaseTransferResultTypeCode,
  transfer: string
): string {
  if (resultType === "1") return "第２工場";
  if (resultType === "3") return "児湯茶";
  return transfer.trim();
}

type TeaTransferSource = {
  year: number | null;
  purchase: string;
  bidNo: string;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  cost?: number | null;
  discount?: number | null;
};

export type PurchaseTeaTransferSource = TeaTransferSource;

export function createPurchaseTransferEditFormFromTeaRow(
  row: TeaTransferSource,
  initialYear?: string
): PurchaseTransferEditForm {
  const base = createEmptyPurchaseTransferEditForm(initialYear);
  return {
    ...base,
    year: yearToForm(row.year, initialYear),
    purchase: row.purchase,
    bidNo: row.bidNo,
    unitWeight: toDecimal2Text(row.unitWeight),
    unitNumber: toIntText(row.unitNumber),
    fractionWeight: toDecimal2Text(row.fractionWeight),
    fractionNumber: toIntText(row.fractionNumber)
  };
}

export function createPurchaseTransferEditFormFromResaleRow(
  row: import("../PurchaseResaleList/types").PurchaseResaleListRow
): PurchaseTransferEditForm {
  const resultType = (["1", "2", "3"].includes(row.resultType) ? row.resultType : "2") as PurchaseTransferResultTypeCode;
  return {
    year: yearToForm(row.year),
    purchase: row.purchase,
    bidNo: row.bidNo,
    resultType,
    transfer: row.transfer,
    transferDate: row.transferDate?.slice(0, 10) || todayIsoDate(),
    unitWeight: toDecimal2Text(row.unitWeight),
    unitNumber: toIntText(row.unitNumber),
    fractionWeight: toDecimal2Text(row.fractionWeight),
    fractionNumber: toIntText(row.fractionNumber),
    unitPrice: toDecimal2Text(row.unitPrice),
    remarks: row.remarks
  };
}

/** 小数2桁（お届け価格） */
export function sanitizePurchaseTransferUnitPriceInput(raw: string): string {
  return sanitizePurchaseDecimal2Input(raw);
}

export function formatPurchaseTransferUnitPriceOnBlur(text: string): string {
  return formatPurchaseDecimal2OnBlur(text);
}

export { sanitizePurchaseDecimal2Input, sanitizePurchaseIntegerInput, formatPurchaseDecimal2OnBlur };
