/**
 * 一括振分 … チェック行ごとの te_purchase_transfer upsert ボディ
 */
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import type { PurchaseTransferEditForm } from "./purchaseTransferEditForm";
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
    transfer: form.transfer.trim(),
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
  if (!form.transfer.trim()) return "振分先を入力してください";
  if (!form.transferDate.trim()) return "振分日を入力してください";
  return null;
}
