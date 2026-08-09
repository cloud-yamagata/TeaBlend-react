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

/** 小数2桁（お届け価格） */
export function sanitizePurchaseTransferUnitPriceInput(raw: string): string {
  return sanitizePurchaseDecimal2Input(raw);
}

export function formatPurchaseTransferUnitPriceOnBlur(text: string): string {
  return formatPurchaseDecimal2OnBlur(text);
}

export { sanitizePurchaseDecimal2Input, sanitizePurchaseIntegerInput, formatPurchaseDecimal2OnBlur };
