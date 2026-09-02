/**
 * 第3工場入出庫情報編集モーダル（te_store_transfer 登録／変更相当）
 */
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { createStoreTransfer, updateStoreTransfer } from "../repositories/storeTransferRepository";
import { refreshStoreTransferMasterAtom } from "./refreshStoreTransferMaster";
import {
  LOT_TYPE_OPTIONS,
  RESULT_TYPE_OPTIONS,
  TRANSFER_TYPE_OPTIONS,
  createEmptyStoreTransferEditForm,
  createStoreTransferEditFormFromRow,
  formatDecimal2OnBlur,
  sanitizeDecimal2Input,
  sanitizeIntegerInput,
  storeTransferEditFormToCreateBody,
  storeTransferEditFormToUpdateBody,
  validateStoreTransferEditForm,
  type StoreTransferEditFieldErrors,
  type StoreTransferEditForm
} from "./storeTransferEditForm";
import { lotTypeName, resultTypeName, transferTypeName } from "./storeTransferDisplay";
import type { StoreTransferRow } from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./storeTransferEditModal.css";

export type StoreTransferEditModalMode = "create" | "update";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: StoreTransferEditModalMode;
  targetRow?: StoreTransferRow | null;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

function FormRow({ label, required = false, children }: FormRowProps) {
  const labelText = required ? `*${label}` : label;
  return (
    <div className="ptEditRow">
      <div className={`ptEditLabelCell${required ? " required" : ""}`}>
        <span className="ptEditLabelText">{labelText}</span>
      </div>
      <div className="ptEditValueCell">{children}</div>
    </div>
  );
}

function CodeNameReadonly({ code, name }: { code: string; name: string }) {
  return (
    <div className="stEditCodeNameRow">
      <input className="ptEditInput ptEditInputDisabled stEditCode" type="text" value={code} readOnly tabIndex={-1} />
      <input className="ptEditInput ptEditInputDisabled stEditName" type="text" value={name} readOnly tabIndex={-1} />
    </div>
  );
}

export function StoreTransferEditModal({ open, onClose, mode, targetRow = null }: Props) {
  const refreshMaster = useSetAtom(refreshStoreTransferMasterAtom);
  const isCreate = mode === "create";
  const [form, setForm] = useState<StoreTransferEditForm>(() =>
    isCreate || !targetRow
      ? createEmptyStoreTransferEditForm()
      : createStoreTransferEditFormFromRow(targetRow)
  );
  const [fieldErrors, setFieldErrors] = useState<StoreTransferEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    setForm(
      isCreate || !targetRow
        ? createEmptyStoreTransferEditForm()
        : createStoreTransferEditFormFromRow(targetRow)
    );
  }, [open, mode, isCreate, targetRow]);

  const patch = useCallback((partial: Partial<StoreTransferEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = async () => {
    const errors = validateStoreTransferEditForm(form, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      if (isCreate) {
        await createStoreTransfer(storeTransferEditFormToCreateBody(form));
        await refreshMaster();
        window.alert("入出庫情報の登録が正常に処理されました");
      } else {
        await updateStoreTransfer(storeTransferEditFormToUpdateBody(form));
        await refreshMaster();
        window.alert("入出庫情報の更新が正常に処理されました");
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputClass = (hasError = false, readonly = false) =>
    `ptEditInput${readonly ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;
  const selectClass = (hasError = false) => `ptEditSelect preset${hasError ? " inputError" : ""}`;

  const title = isCreate ? "入出庫情報編集（登録）" : "入出庫情報編集（変更）";

  return (
    <EditModalOverlay
      mode={isCreate ? "create" : "update"}
      className="ptEditOverlay stEditOverlay"
      onClose={onClose}
    >
      <div
        className="ptEditPanel stEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stEditTitle" className="ptEditPanelTitle">
          {title}
        </h2>

        <div className="ptEditToolbar">
          <button type="button" disabled={!isCreate || submitting} onClick={() => void handleSubmit()}>
            登録
          </button>
          <button type="button" disabled={isCreate || submitting} onClick={() => void handleSubmit()}>
            変更
          </button>
          <button type="button" disabled title="未実装">
            削除
          </button>
          <button type="button" disabled={submitting} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {error ? <p className="ptEditError">{error}</p> : null}

        <div className="ptEditForm">
          <div className="ptEditFormBody">
            <FormRow label="入出庫No">
              <input
                className={inputClass(false, true)}
                type="text"
                value={isCreate ? "（自動採番）" : form.transferNo}
                readOnly
                tabIndex={-1}
                aria-label="入出庫No"
              />
            </FormRow>

            <FormRow label="移動日" required>
              <input
                className={inputClass(Boolean(fieldErrors.transferDate))}
                type="date"
                value={form.transferDate}
                onChange={(e) => patch({ transferDate: e.target.value })}
                aria-invalid={Boolean(fieldErrors.transferDate) || undefined}
                aria-label="移動日"
              />
            </FormRow>

            <FormRow label="商品NO" required={isCreate}>
              <input
                className={`${inputClass(Boolean(fieldErrors.itemNo), !isCreate)}${
                  !isCreate ? " stEditReadonlyHighlight" : ""
                }`}
                type="text"
                inputMode="numeric"
                value={form.itemNo}
                readOnly={!isCreate}
                tabIndex={isCreate ? undefined : -1}
                onChange={(e) => patch({ itemNo: sanitizeIntegerInput(e.target.value) })}
                aria-invalid={Boolean(fieldErrors.itemNo) || undefined}
                aria-label="商品NO"
              />
            </FormRow>

            <FormRow label="製造NO" required={isCreate}>
              <input
                className={`${inputClass(Boolean(fieldErrors.productNo), !isCreate)}${
                  !isCreate ? " stEditReadonlyHighlight" : ""
                }`}
                type="text"
                inputMode="numeric"
                value={form.productNo}
                readOnly={!isCreate}
                tabIndex={isCreate ? undefined : -1}
                onChange={(e) => patch({ productNo: sanitizeIntegerInput(e.target.value) })}
                aria-invalid={Boolean(fieldErrors.productNo) || undefined}
                aria-label="製造NO"
              />
            </FormRow>

            <FormRow label="ロットNO" required={isCreate}>
              <input
                className={`${inputClass(Boolean(fieldErrors.lotNo), !isCreate)}${
                  !isCreate ? " stEditReadonlyHighlight" : ""
                }`}
                type="text"
                value={form.lotNo}
                readOnly={!isCreate}
                tabIndex={isCreate ? undefined : -1}
                onChange={(e) => patch({ lotNo: e.target.value })}
                aria-invalid={Boolean(fieldErrors.lotNo) || undefined}
                aria-label="ロットNO"
              />
            </FormRow>

            <FormRow label="相手先名">
              <input
                className={inputClass()}
                type="text"
                value={form.storePartyName}
                onChange={(e) => patch({ storePartyName: e.target.value })}
                aria-label="相手先名"
              />
            </FormRow>

            <FormRow label="移動種別" required={isCreate}>
              {isCreate ? (
                <select
                  className={selectClass(Boolean(fieldErrors.transferType))}
                  value={form.transferType}
                  onChange={(e) =>
                    patch({
                      transferType: e.target.value,
                      transferTypeName: transferTypeName(e.target.value)
                    })
                  }
                  aria-label="移動種別"
                >
                  {TRANSFER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}:{opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <CodeNameReadonly code={form.transferType} name={form.transferTypeName} />
              )}
            </FormRow>

            <FormRow label="実績種別" required={isCreate}>
              {isCreate ? (
                <select
                  className={selectClass(Boolean(fieldErrors.resultType))}
                  value={form.resultType}
                  onChange={(e) =>
                    patch({
                      resultType: e.target.value,
                      resultTypeName: resultTypeName(e.target.value)
                    })
                  }
                  aria-label="実績種別"
                >
                  {RESULT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}:{opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <CodeNameReadonly code={form.resultType} name={form.resultTypeName} />
              )}
            </FormRow>

            <FormRow label="ロットタイプ" required={isCreate}>
              {isCreate ? (
                <select
                  className={selectClass(Boolean(fieldErrors.lotType))}
                  value={form.lotType}
                  onChange={(e) =>
                    patch({
                      lotType: e.target.value,
                      lotTypeName: lotTypeName(e.target.value)
                    })
                  }
                  aria-label="ロットタイプ"
                >
                  {LOT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}:{opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <CodeNameReadonly code={form.lotType} name={form.lotTypeName} />
              )}
            </FormRow>

            <FormRow label="事由">
              <input
                className={`${inputClass()} stEditReadonlyHighlight`}
                type="text"
                value={form.reason}
                onChange={(e) => patch({ reason: e.target.value })}
                aria-label="事由"
              />
            </FormRow>

            <FormRow label="梱包重量">
              <input
                className={inputClass()}
                type="text"
                inputMode="decimal"
                value={form.unitWeight}
                onChange={(e) => patch({ unitWeight: sanitizeDecimal2Input(e.target.value) })}
                onBlur={() => patch({ unitWeight: formatDecimal2OnBlur(form.unitWeight) })}
                aria-label="梱包重量"
              />
            </FormRow>

            <FormRow label="梱包本数">
              <input
                className={inputClass()}
                type="text"
                inputMode="numeric"
                value={form.unitNumber}
                onChange={(e) => patch({ unitNumber: sanitizeIntegerInput(e.target.value) })}
                aria-label="梱包本数"
              />
            </FormRow>

            <FormRow label="端数重量">
              <input
                className={inputClass()}
                type="text"
                inputMode="decimal"
                value={form.fractionWeight}
                onChange={(e) => patch({ fractionWeight: sanitizeDecimal2Input(e.target.value) })}
                onBlur={() => patch({ fractionWeight: formatDecimal2OnBlur(form.fractionWeight) })}
                aria-label="端数重量"
              />
            </FormRow>

            <FormRow label="端数本数">
              <input
                className={inputClass()}
                type="text"
                inputMode="numeric"
                value={form.fractionNumber}
                onChange={(e) => patch({ fractionNumber: sanitizeIntegerInput(e.target.value) })}
                aria-label="端数本数"
              />
            </FormRow>

            <FormRow label="移動量" required>
              <input
                className={inputClass(Boolean(fieldErrors.transferQuantity))}
                type="text"
                inputMode="decimal"
                value={form.transferQuantity}
                onChange={(e) => patch({ transferQuantity: sanitizeDecimal2Input(e.target.value) })}
                onBlur={() => patch({ transferQuantity: formatDecimal2OnBlur(form.transferQuantity) })}
                aria-invalid={Boolean(fieldErrors.transferQuantity) || undefined}
                aria-label="移動量"
              />
            </FormRow>

            <FormRow label="単位">
              <input
                className={`${inputClass(false, !isCreate)}${!isCreate ? " stEditReadonlyHighlight" : ""}`}
                type="text"
                value={form.unitType}
                readOnly={!isCreate}
                tabIndex={isCreate ? undefined : -1}
                onChange={(e) => patch({ unitType: e.target.value })}
                aria-label="単位"
              />
            </FormRow>

            <FormRow label="摘要">
              <input
                className={inputClass()}
                type="text"
                value={form.remarks}
                onChange={(e) => patch({ remarks: e.target.value })}
                aria-label="摘要"
              />
            </FormRow>
          </div>
        </div>
      </div>
    </EditModalOverlay>
  );
}
