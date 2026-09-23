/**
 * 仕入振分実績メンテナンス（SubEditWindow.xaml 左ペイン相当）
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { EditModalOverlay } from "../components/modal";
import { masterEntityCacheAtom, masterTrConstantsAtom } from "../repository/masterData";
import { upsertPurchaseTransfer, deletePurchaseTransfer } from "../repositories/purchaseTransferRepository";
import { applyBulkTransferPurchaseTransferCacheAtom } from "./applyBulkTransferPurchaseTransferCache";
import { refreshPurchaseTransferMasterAtom } from "./refreshPurchaseTransferMaster";
import { refreshPurchaseTeaMasterAtom } from "./refreshPurchaseTeaMaster";
import {
  buildBulkTransferBodies,
  buildSingleTransferBody,
  validateBulkTransferForm
} from "./buildBulkTransferBodies";
import {
  PURCHASE_TRANSFER_RESULT_TYPES,
  PURCHASE_TRANSFER_UNSPECIFIED_GUIDE,
  createEmptyPurchaseTransferEditForm,
  createPurchaseTransferEditFormFromResaleRow,
  createPurchaseTransferEditFormFromTeaRow,
  formatPurchaseTransferUnitPriceOnBlur,
  resolvePurchaseTransferDestination,
  sanitizePurchaseIntegerInput,
  sanitizePurchaseTransferUnitPriceInput,
  type PurchaseTeaTransferSource,
  type PurchaseTransferEditForm,
  type PurchaseTransferResultTypeCode
} from "./purchaseTransferEditForm";
import { getPurchaseTransferUnitPrice } from "./getPurchaseTransferUnitPrice";
import type { PurchaseResaleListRow } from "../PurchaseResaleList/types";
import type { PurchaseTtransferRow } from "./types";
import "./purchaseTransferEditModal.css";

export type PurchaseTransferEditModalMode = "bulk" | "create" | "update" | "delete";

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: PurchaseTransferEditModalMode;
  initialYear?: string;
  /** 一括振分対象行 ID */
  bulkTransferTargetIds?: ReadonlySet<string>;
  /** 一括振分対象行（単価・粉引の参照用） */
  bulkTransferRows?: readonly PurchaseTtransferRow[];
  onBulkTransferSuccess?: () => void;
  /** 単件登録の親仕入行 */
  teaRow?: PurchaseTeaTransferSource | null;
  /** 単件変更・削除の振分行 */
  transferRow?: PurchaseResaleListRow | null;
  onTransferMutated?: () => void;
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
  mode = "bulk",
  initialYear,
  bulkTransferTargetIds,
  bulkTransferRows = [],
  onBulkTransferSuccess,
  teaRow = null,
  transferRow = null,
  onTransferMutated
}: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const applyBulkTransferCache = useSetAtom(applyBulkTransferPurchaseTransferCacheAtom);
  const refreshTransfers = useSetAtom(refreshPurchaseTransferMasterAtom);
  const refreshTea = useSetAtom(refreshPurchaseTeaMasterAtom);
  const [form, setForm] = useState<PurchaseTransferEditForm>(() => createEmptyPurchaseTransferEditForm(initialYear));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "create" && teaRow) {
      setForm(createPurchaseTransferEditFormFromTeaRow(teaRow, initialYear));
    } else if ((mode === "update" || mode === "delete") && transferRow) {
      setForm(createPurchaseTransferEditFormFromResaleRow(transferRow));
    } else {
      setForm(createEmptyPurchaseTransferEditForm(initialYear));
    }
    setError("");
    setStatus("");
    setSubmitting(false);
  }, [open, initialYear, mode, teaRow, transferRow]);

  const updateField = useCallback(<K extends keyof PurchaseTransferEditForm>(key: K, value: PurchaseTransferEditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResultTypeChange = useCallback((code: PurchaseTransferResultTypeCode) => {
    setForm((prev) => ({
      ...prev,
      resultType: code,
      transfer: resolvePurchaseTransferDestination(code, prev.transfer)
    }));
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const isBulk = mode === "bulk";
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isDelete = mode === "delete";
  const inputDisabled = submitting || isDelete;
  const transferLocked = form.resultType === "1" || form.resultType === "3";

  const targetCount = bulkTransferTargetIds?.size ?? 0;
  const canBulkTransfer = isBulk && targetCount > 0;

  const priceReferenceRow = (isBulk ? bulkTransferRows[0] : teaRow) ?? null;
  const canCalculateUnitPrice = !inputDisabled && form.resultType === "2" && (isBulk ? canBulkTransfer : isCreate || isUpdate);

  const priceButtonTitle = form.resultType !== "2"
    ? "振分種別が転売のときに利用できます"
    : "お届け価格を計算";

  const handleCalculateUnitPrice = useCallback(() => {
    if (!canCalculateUnitPrice) return;
    const cost = Math.trunc(priceReferenceRow?.cost ?? transferRow?.cost ?? 0);
    const discount = priceReferenceRow?.discount ?? transferRow?.discount ?? 0;
    const unitPrice = getPurchaseTransferUnitPrice(form.transfer, cost, discount, cache.tr_resale);
    updateField("unitPrice", formatPurchaseTransferUnitPriceOnBlur(String(unitPrice)));
  }, [canCalculateUnitPrice, priceReferenceRow, transferRow, form.transfer, cache.tr_resale, updateField]);

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

    if (!window.confirm("チェックされた仕入品に対し一括振分登録をします。\nよろしいですか？")) {
      return;
    }

    const bodies = buildBulkTransferBodies(form, bulkTransferRows);

    setSubmitting(true);
    try {
      for (const body of bodies) {
        await upsertPurchaseTransfer(body);
      }
      applyBulkTransferCache(bodies);
      await refreshTransfers();
      await refreshTea();
      window.alert(`${bodies.length} 件を一括振分しました`);
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
    submitting,
    refreshTea,
    refreshTransfers
  ]);

  const handleSingleSave = useCallback(async () => {
    if (isBulk || isDelete || submitting) return;
    setError("");
    setStatus("");
    const validationError = validateBulkTransferForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!form.purchase.trim() || !form.bidNo.trim()) {
      setError("仕入先と入札NOが必要です");
      return;
    }
    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      await upsertPurchaseTransfer(buildSingleTransferBody(form));
      await refreshTransfers();
      await refreshTea();
      window.alert(isCreate ? "登録が完了しました" : "更新が完了しました");
      onTransferMutated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [form, isBulk, isCreate, isDelete, onClose, onTransferMutated, refreshTea, refreshTransfers, submitting]);

  const handleSingleDelete = useCallback(async () => {
    if (!isDelete || submitting || !transferRow) return;
    if (!window.confirm("削除データに間違いがないか確認してください。削除を実行します。よろしいですか？")) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await deletePurchaseTransfer({
        year: transferRow.year,
        purchase: transferRow.purchase,
        bid_no: transferRow.bidNo,
        result_type: transferRow.resultType,
        transfer: transferRow.transfer
      });
      await refreshTransfers();
      await refreshTea();
      window.alert("削除が完了しました");
      onTransferMutated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [isDelete, onClose, onTransferMutated, refreshTea, refreshTransfers, submitting, transferRow]);

  if (!open) return null;

  return (
    <EditModalOverlay
      mode={isDelete ? "view" : isUpdate ? "update" : "create"}
      onClose={handleClose}
      className="ptTransferEditOverlay"
    >
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
          <button type="button" disabled={submitting || !isCreate} onClick={() => void handleSingleSave()}>
            登録
          </button>
          <button type="button" disabled={submitting || !isUpdate} onClick={() => void handleSingleSave()}>
            変更
          </button>
          <button type="button" disabled={submitting || !isDelete} onClick={() => void handleSingleDelete()}>
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

          {isBulk ? (
            <>
              <DisabledGuideField label="仕入先" />
              <DisabledGuideField label="入札NO" />
            </>
          ) : (
            <>
              <FormRow label="仕入先" required>
                <input
                  className="ptTransferEditInput ptTransferEditInputDisabled"
                  type="text"
                  value={form.purchase}
                  disabled
                  readOnly
                  aria-label="仕入先"
                />
              </FormRow>
              <FormRow label="入札NO" required>
                <input
                  className="ptTransferEditInput ptTransferEditInputDisabled"
                  type="text"
                  value={form.bidNo}
                  disabled
                  readOnly
                  aria-label="入札NO"
                />
              </FormRow>
            </>
          )}

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
                      disabled={inputDisabled || isUpdate}
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
              disabled={inputDisabled || transferLocked || isUpdate}
            />
          </FormRow>

          <FormRow label="振分日">
            <input
              className="ptTransferEditInput date"
              type="date"
              value={form.transferDate}
              disabled={inputDisabled}
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
                disabled={inputDisabled}
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
                disabled={inputDisabled}
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
              disabled={inputDisabled}
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
              disabled={inputDisabled}
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
