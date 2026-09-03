/**
 * 転売先マスタ編集モーダル（ResaleCorrect EditWindow 相当）
 */
import { useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { upsertTrResale } from "../repositories/resaleCorrectRepository";
import { refreshResaleCorrectMasterAtom } from "./refreshResaleCorrectMaster";
import {
  CALC_TYPE_OPTIONS,
  editFormToUpsertBody,
  resaleCorrectIsMandatoryEmpty,
  validateResaleCorrectEditForm,
  type ResaleCorrectEditForm,
  type ResaleCorrectEditMode,
  type ResaleCorrectEditFieldErrors
} from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./resaleCorrectEditModal.css";

type Props = {
  open: boolean;
  mode: ResaleCorrectEditMode;
  initialForm: ResaleCorrectEditForm;
  existingResaleNames: ReadonlySet<string>;
  onClose: () => void;
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

export function ResaleCorrectEditModal({
  open,
  mode,
  initialForm,
  existingResaleNames,
  onClose
}: Props) {
  const refreshMaster = useSetAtom(refreshResaleCorrectMasterAtom);
  const isCreate = mode === "create";
  const [form, setForm] = useState<ResaleCorrectEditForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<ResaleCorrectEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setFieldErrors({});
    setError("");
  }, [open, initialForm]);

  const patch = (partial: Partial<ResaleCorrectEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    const errors = validateResaleCorrectEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const resaleName = form.resale.trim();
    if (isCreate && existingResaleNames.has(resaleName)) {
      setError("指定された転売先名は既に登録済みです。");
      return;
    }

    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      await upsertTrResale(editFormToUpsertBody(form));
      await refreshMaster();
      window.alert(
        isCreate ? "転売先マスタの登録が正常に処理されました" : "転売先マスタの更新が正常に処理されました"
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = isCreate ? "転売先マスタ編集（登録）" : "転売先マスタ編集（変更）";
  const showRed = (key: Parameters<typeof resaleCorrectIsMandatoryEmpty>[0]) =>
    resaleCorrectIsMandatoryEmpty(key, form) || Boolean(fieldErrors[key]);
  const inputClass = (hasError?: boolean, readonly = false) =>
    `ptEditInput${readonly ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;

  return (
    <EditModalOverlay
      mode={isCreate ? "create" : "update"}
      onClose={onClose}
      className="ptEditOverlay resaleCorrectEditOverlay"
    >
      <div
        className="ptEditPanel resaleCorrectEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resaleCorrectEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="resaleCorrectEditTitle" className="ptEditPanelTitle">
          {title}
        </h2>

        <div className="ptEditToolbar">
          <button type="button" disabled={!isCreate || submitting} onClick={() => void handleSubmit()}>
            登録
          </button>
          <button type="button" disabled={isCreate || submitting} onClick={() => void handleSubmit()}>
            更新
          </button>
          <button type="button" disabled={submitting} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {error ? <p className="ptEditError">{error}</p> : null}

        <div className="ptEditForm">
          <div className="ptEditFormBody">
            <FormRow label="転売先" required>
              <input
                className={inputClass(showRed("resale"), !isCreate)}
                type="text"
                value={form.resale}
                disabled={!isCreate}
                onChange={(e) => patch({ resale: e.target.value })}
                aria-invalid={showRed("resale") || undefined}
                aria-label="転売先"
              />
            </FormRow>

            <FormRow label="手数料(%)" required>
              <input
                className={`${inputClass(showRed("rate"))} ptEditInputRight`}
                type="text"
                inputMode="numeric"
                value={form.rate}
                onChange={(e) => patch({ rate: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("rate") || undefined}
                aria-label="手数料%"
              />
            </FormRow>

            <FormRow label="送料" required>
              <input
                className={`${inputClass(showRed("postage"))} ptEditInputRight`}
                type="text"
                inputMode="numeric"
                value={form.postage}
                onChange={(e) => patch({ postage: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("postage") || undefined}
                aria-label="送料"
              />
            </FormRow>

            <FormRow label="下限額" required>
              <input
                className={`${inputClass(showRed("limitPrice"))} ptEditInputRight`}
                type="text"
                inputMode="numeric"
                value={form.limitPrice}
                onChange={(e) => patch({ limitPrice: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("limitPrice") || undefined}
                aria-label="下限額"
              />
            </FormRow>

            <FormRow label="固定額" required>
              <input
                className={`${inputClass(showRed("fixedPrice"))} ptEditInputRight`}
                type="text"
                inputMode="numeric"
                value={form.fixedPrice}
                onChange={(e) => patch({ fixedPrice: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("fixedPrice") || undefined}
                aria-label="固定額"
              />
            </FormRow>

            <FormRow label="計算区分" required>
              <div className="resaleCorrectCalcTypeRow">
                <input
                  className={`${inputClass(showRed("calcType"), true)} ptEditInputRight resaleCorrectCalcTypeValue`}
                  type="text"
                  value={form.calcType}
                  readOnly
                  disabled
                  aria-label="計算区分"
                />
                <select
                  className="resaleCorrectCalcTypeSelect"
                  value={form.calcType}
                  onChange={(e) => patch({ calcType: e.target.value })}
                  aria-label="計算区分を選択"
                >
                  {CALC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </FormRow>

            <p className="resaleCorrectCalcTypeHint">
              ■0:数量粉引 / 1:単価粉引 / 2:直販 / 3:堀口園_棒
            </p>

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
