/**
 * 一括振分 … チェック行ごとの te_purchase_transfer upsert ボディ
 */
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import {
  resolvePurchaseTransferDestination,
  type PurchaseTransferEditForm
} from "./purchaseTransferEditForm";
import type { PurchaseTtransferRow } from "./types";

function parseScreenUnitPrice(text: string): number {
  const n = Number(text.trim());
  return Number.isFinite(n) ? n : 0;
}

/** 画面お届け価格が 0 以外なら画面値、0 なら行の単価（cost） */
export function resolveBulkTransferUnitPrice(form: PurchaseTransferEditForm, row: PurchaseTtransferRow): number {
  const screenPrice = parseScreenUnitPrice(form.unitPrice);
  if (screenPrice !== 0) return screenPrice;
  return row.cost ?? 0;
}

export function buildBulkTransferBodyForRow(
  form: PurchaseTransferEditForm,
  row: PurchaseTtransferRow
): Record<string, unknown> {
  const year = Number(normalizeMakeYearFromForm(form.year));
  const unitNumber = row.unitNumber ?? 0;
  const fractionNumber = row.fractionNumber ?? 0;

  return {
    year,
    purchase: row.purchase,
    bid_no: row.bidNo,
    result_type: form.resultType,
    transfer: resolvePurchaseTransferDestination(form.resultType, form.transfer),
    transfer_date: form.transferDate,
    unit_weight: row.unitWeight ?? 0,
    unit_number: unitNumber,
    fraction_weight: row.fractionWeight ?? 0,
    fraction_number: fractionNumber,
    unit_price: resolveBulkTransferUnitPrice(form, row),
    remarks: form.remarks.trim() || null
  };
}

export function buildBulkTransferBodies(
  form: PurchaseTransferEditForm,
  rows: readonly PurchaseTtransferRow[]
): Record<string, unknown>[] {
  return rows.map((row) => buildBulkTransferBodyForRow(form, row));
}

export function validateBulkTransferForm(form: PurchaseTransferEditForm): string | null {
  if (!normalizeMakeYearFromForm(form.year)) return "年度を入力してください";
  if (form.resultType === "2" && !form.transfer.trim()) return "振分先を入力してください";
  if (!form.transferDate.trim()) return "振分日を入力してください";
  return null;
}

export function buildSingleTransferBody(form: PurchaseTransferEditForm): Record<string, unknown> {
  const year = Number(normalizeMakeYearFromForm(form.year));
  const unitNumber = Number(form.unitNumber.trim() || 0);
  const fractionNumber = Number(form.fractionNumber.trim() || 0);
  const unitWeight = Number(form.unitWeight.trim() || 0);
  const fractionWeight = Number(form.fractionWeight.trim() || 0);
  const unitPrice = Number(form.unitPrice.trim() || 0);
  return {
    year,
    purchase: form.purchase.trim(),
    bid_no: form.bidNo.trim(),
    result_type: form.resultType,
    transfer: resolvePurchaseTransferDestination(form.resultType, form.transfer),
    transfer_date: form.transferDate,
    unit_weight: unitNumber === 0 ? 0 : unitWeight,
    unit_number: unitNumber,
    fraction_weight: fractionNumber === 0 ? 0 : fractionWeight,
    fraction_number: fractionNumber,
    unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
    remarks: form.remarks.trim() || null
  };
}
