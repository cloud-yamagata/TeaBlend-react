/**
 * 仕入振分実績メンテナンス（SubEditWindow.xaml 左ペイン相当）
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { EditModalOverlay } from "../components/modal";
import { masterEntityCacheAtom, masterTrConstantsAtom } from "../repository/masterData";
import { upsertPurchaseTransfer } from "../repositories/purchaseTransferRepository";
import { applyBulkTransferPurchaseTransferCacheAtom } from "./applyBulkTransferPurchaseTransferCache";
import {
  buildBulkTransferBodies,
  validateBulkTransferForm
} from "./buildBulkTransferBodies";
import {
  PURCHASE_TRANSFER_RESULT_TYPES,
  PURCHASE_TRANSFER_UNSPECIFIED_GUIDE,
  createEmptyPurchaseTransferEditForm,
  formatPurchaseTransferUnitPriceOnBlur,
  sanitizePurchaseIntegerInput,
  sanitizePurchaseTransferUnitPriceInput,
  type PurchaseTransferEditForm,
  type PurchaseTransferResultTypeCode
} from "./purchaseTransferEditForm";
import { getPurchaseTransferUnitPrice } from "./getPurchaseTransferUnitPrice";
import type { PurchaseTtransferRow } from "./types";
import "./purchaseTransferEditModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  initialYear?: string;
  /** 一括振分対象行 ID */
  bulkTransferTargetIds?: ReadonlySet<string>;
  /** 一括振分対象行（単価・粉引の参照用） */
  bulkTransferRows?: readonly PurchaseTtransferRow[];
  onBulkTransferSuccess?: () => void;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  priceAction?: boolean;
  priceEnabled?: boolean;
  priceTitle?: string;
  onPriceClick?: () => void;
  children: ReactNode;
};

function FormRow({
  label,
  required = false,
  priceAction = false,
  priceEnabled = false,
  priceTitle = "お届け価格を計算",
  onPriceClick,
  children
}: FormRowProps) {
  return (
    <div className="ptTransferEditRow">
      <div
        className={`ptTransferEditLabelCell${required ? " required" : ""}${priceAction ? " priceAction" : ""}`}
      >
        {priceAction ? (
          <button
            type="button"
            className="ptTransferEditPriceLabelBtn"
            disabled={!priceEnabled}
            title={priceTitle}
            onClick={onPriceClick}
          >
            {label}
          </button>
        ) : (
          <span>{required ? `*${label}` : label}</span>
        )}
      </div>
      <div className="ptTransferEditValueCell">{children}</div>
    </div>
  );
}

function DisabledGuideField({ label, guideText = PURCHASE_TRANSFER_UNSPECIFIED_GUIDE }: { label: string; guideText?: string }) {
  return (
    <FormRow label={label} required>
      <div className="ptTransferEditGuideField" aria-label={label}>
        <span className="ptTransferEditGuideText">{guideText}</span>
      </div>
    </FormRow>
  );
}

export function PurchaseTransferEditModal({
  open,
  onClose,
  initialYear,
  bulkTransferTargetIds,
  bulkTransferRows = [],
  onBulkTransferSuccess
}: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const applyBulkTransferCache = useSetAtom(applyBulkTransferPurchaseTransferCacheAtom);
  const [form, setForm] = useState<PurchaseTransferEditForm>(() => createEmptyPurchaseTransferEditForm(initialYear));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createEmptyPurchaseTransferEditForm(initialYear));
    setError("");
    setStatus("");
    setSubmitting(false);
  }, [open, initialYear]);

  const updateField = useCallback(<K extends keyof PurchaseTransferEditForm>(key: K, value: PurchaseTransferEditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResultTypeChange = useCallback((code: PurchaseTransferResultTypeCode) => {
    updateField("resultType", code);
  }, [updateField]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const targetCount = bulkTransferTargetIds?.size ?? 0;
  const canBulkTransfer = targetCount > 0;

  const priceReferenceRow = bulkTransferRows[0] ?? null;
  /** 一括振分モードかつ振分種別=転売で活性（振分先未入力でも可。未登録時は cost をそのまま返す） */
  const canCalculateUnitPrice = canBulkTransfer && form.resultType === "2";

  const priceButtonTitle = !canBulkTransfer
    ? "一括振分対象を選択してください"
    : form.resultType !== "2"
      ? "振分種別が転売のときに利用できます"
      : "お届け価格を計算";

  const handleCalculateUnitPrice = useCallback(() => {
    if (!canCalculateUnitPrice) return;
    const cost = Math.trunc(priceReferenceRow?.cost ?? 0);
    const discount = priceReferenceRow?.discount ?? 0;
    const unitPrice = getPurchaseTransferUnitPrice(form.transfer, cost, discount, cache.tr_resale);
    updateField("unitPrice", formatPurchaseTransferUnitPriceOnBlur(String(unitPrice)));
  }, [canCalculateUnitPrice, priceReferenceRow, form.transfer, cache.tr_resale, updateField]);

  const handleBulkTransfer = useCallback(async () => {
    if (!canBulkTransfer || submitting) return;

    setError("");
    setStatus("");

    const validationError = validateBulkTransferForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (bulkTransferRows.length === 0) {
      setError("一括振分対象行がありません。");
      return;
    }

    const bodies = buildBulkTransferBodies(form, bulkTransferRows);

    setSubmitting(true);
    try {
      for (const body of bodies) {
        await upsertPurchaseTransfer(body);
      }
      applyBulkTransferCache(bodies);
      setStatus(`${bodies.length} 件を一括振分しました。`);
      onBulkTransferSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [
    applyBulkTransferCache,
    bulkTransferRows,
    canBulkTransfer,
    form,
    onBulkTransferSuccess,
    onClose,
    submitting
  ]);

  if (!open) return null;

  return (
    <EditModalOverlay mode="create" onClose={handleClose} className="ptTransferEditOverlay">
      <div
        className="ptTransferEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ptTransferEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ptTransferEditTitle" className="ptTransferEditPanelTitle">
          仕入振分実績メンテナンス
        </h2>

        <div className="ptTransferEditToolbar">
          <button type="button" disabled title="未実装">
            登録
          </button>
          <button type="button" disabled title="行を選択して変更">
            変更
          </button>
          <button type="button" disabled title="行を選択して削除">
            削除
          </button>
          <button
            type="button"
            disabled={!canBulkTransfer || submitting}
            title={canBulkTransfer ? "選択行へ一括振分を実行" : "一括振分対象がありません"}
            onClick={() => void handleBulkTransfer()}
          >
            一括振分
          </button>
          <button type="button" onClick={handleClose} disabled={submitting}>
            キャンセル
          </button>
        </div>

        <div className="ptTransferEditForm">
          <FormRow label="年度" required>
            <input
              className="ptTransferEditInput numeric ptTransferEditInputDisabled"
              type="text"
              value={form.year}
              disabled
              readOnly
              aria-label="年度"
            />
          </FormRow>

          <DisabledGuideField label="仕入先" />

          <DisabledGuideField label="入札NO" />

          <FormRow label="振分種別" required>
            <div className="ptTransferEditResultTypeRow">
              <input
                className="ptTransferEditInput ptTransferEditResultTypeCode ptTransferEditInputDisabled"
                type="text"
                value={form.resultType}
                disabled
                readOnly
                aria-label="振分種別コード"
              />
              <div className="ptTransferEditResultTypeRadios" role="radiogroup" aria-label="振分種別">
                {PURCHASE_TRANSFER_RESULT_TYPES.map((item) => (
                  <label key={item.code}>
                    <input
                      type="radio"
                      name="purchaseTransferResultType"
                      value={item.code}
                      checked={form.resultType === item.code}
                      onChange={() => handleResultTypeChange(item.code)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </FormRow>

          <FormRow label="振分先" required>
            <TrConstantZoomField
              value={form.transfer}
              onChange={(v) => updateField("transfer", v)}
              constField="transfer"
              title="システム定数（振分先）"
              constants={trConstants}
              ariaLabel="振分先"
            />
          </FormRow>

          <FormRow label="振分日">
            <input
              className="ptTransferEditInput date"
              type="date"
              value={form.transferDate}
              onChange={(e) => updateField("transferDate", e.target.value)}
              aria-label="振分日"
            />
          </FormRow>

          <FormRow label="梱包(重量/数)">
            <div className="ptTransferEditPair">
              <input
                className="ptTransferEditInput numeric ptTransferEditInputDisabled"
                type="text"
                value={form.unitWeight}
                disabled
                readOnly
                aria-label="梱包重量"
              />
              <input
                className="ptTransferEditInput numeric"
                type="text"
                inputMode="numeric"
                value={form.unitNumber}
                onChange={(e) => updateField("unitNumber", sanitizePurchaseIntegerInput(e.target.value))}
                aria-label="梱包数"
              />
            </div>
          </FormRow>

          <FormRow label="端数(重量/数)">
            <div className="ptTransferEditPair">
              <input
                className="ptTransferEditInput numeric ptTransferEditInputDisabled"
                type="text"
                value={form.fractionWeight}
                disabled
                readOnly
                aria-label="端数重量"
              />
              <input
                className="ptTransferEditInput numeric"
                type="text"
                inputMode="numeric"
                value={form.fractionNumber}
                onChange={(e) => updateField("fractionNumber", sanitizePurchaseIntegerInput(e.target.value))}
                aria-label="端数数"
              />
            </div>
          </FormRow>

          <FormRow
            label="お届け価格"
            priceAction
            priceEnabled={canCalculateUnitPrice}
            priceTitle={priceButtonTitle}
            onPriceClick={handleCalculateUnitPrice}
          >
            <input
              className="ptTransferEditInput numeric"
              type="text"
              inputMode="decimal"
              value={form.unitPrice}
              onChange={(e) => updateField("unitPrice", sanitizePurchaseTransferUnitPriceInput(e.target.value))}
              onBlur={() => updateField("unitPrice", formatPurchaseTransferUnitPriceOnBlur(form.unitPrice))}
              aria-label="お届け価格"
            />
          </FormRow>

          <FormRow label="摘要">
            <input
              className="ptTransferEditInput"
              type="text"
              value={form.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
              aria-label="摘要"
            />
          </FormRow>
        </div>

        {error ? <p className="ptTransferEditError">{error}</p> : null}
        {status ? <p className="ptTransferEditStatus">{status}</p> : null}
        {targetCount > 0 ? (
          <p className="ptTransferEditHint">一括振分対象: {targetCount} 件</p>
        ) : null}
      </div>
    </EditModalOverlay>
  );
}
