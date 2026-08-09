/**
 * 原料実績情報メンテナンス（登録・変更・削除）
 * 入力UI・色合いは仕入実績情報メンテナンス（ptEdit*）に合わせる
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { masterTrConstantsAtom } from "../repository/masterData";
import { deleteMaterialResult, upsertMaterialResult } from "../repositories/materialResultRepository";
import {
  ORGANIC_CLASS_OPTIONS,
  TEA_LIFE_OPTIONS,
  TEA_RANK_OPTIONS,
  TEA_TYPE_OPTIONS,
  buildMaterialRresultMaterialName,
  createEmptyMaterialRresultEditForm,
  createMaterialRresultEditFormFromCopy,
  createMaterialRresultEditFormFromRow,
  formatDecimal2OnBlur,
  materialRresultEditFormToDeleteBody,
  materialRresultEditFormToUpsertBody,
  materialRresultIsMandatoryEmpty,
  sanitizeDecimal2Input,
  sanitizeIntegerInput,
  validateMaterialRresultEditForm,
  type MaterialRresultEditFieldErrors,
  type MaterialRresultEditForm
} from "./materialRresultEditForm";
import { refreshMaterialRresultMasterAtom } from "./refreshMaterialRresultMaster";
import type { MaterialRresultRow } from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./materialRresultEditModal.css";

export type MaterialRresultEditModalMode = "create" | "update" | "delete" | "locked";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: MaterialRresultEditModalMode;
  initialYear?: string;
  targetRow?: MaterialRresultRow | null;
  copySourceRow?: MaterialRresultRow | null;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  labelButton?: {
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  };
  children: ReactNode;
};

function FormRow({ label, required = false, labelButton, children }: FormRowProps) {
  const labelText = required ? `*${label}` : label;
  return (
    <div className="ptEditRow">
      <div
        className={`ptEditLabelCell${required && !labelButton ? " required" : ""}${
          labelButton ? " asButton" : ""
        }`}
      >
        {labelButton ? (
          <button
            type="button"
            className="mrEditMaterialNameLabelButton"
            disabled={labelButton.disabled}
            onClick={labelButton.onClick}
            title={labelButton.title}
          >
            {labelText}
          </button>
        ) : (
          <span className="ptEditLabelText">{labelText}</span>
        )}
      </div>
      <div className="ptEditValueCell">{children}</div>
    </div>
  );
}

export function MaterialRresultEditModal({
  open,
  onClose,
  mode,
  initialYear,
  targetRow = null,
  copySourceRow = null
}: Props) {
  const refreshMaster = useSetAtom(refreshMaterialRresultMasterAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const [form, setForm] = useState<MaterialRresultEditForm>(() =>
    createEmptyMaterialRresultEditForm(initialYear)
  );
  const [fieldErrors, setFieldErrors] = useState<MaterialRresultEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const inputDisabled = mode === "delete" || mode === "locked";
  const keyReadonly = mode === "update" || mode === "delete" || mode === "locked";

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    setForm(
      mode === "create"
        ? copySourceRow
          ? createMaterialRresultEditFormFromCopy(copySourceRow, initialYear)
          : createEmptyMaterialRresultEditForm(initialYear)
        : targetRow
          ? createMaterialRresultEditFormFromRow(targetRow)
          : createEmptyMaterialRresultEditForm(initialYear)
    );
  }, [open, mode, initialYear, targetRow, copySourceRow]);

  const patch = useCallback((partial: Partial<MaterialRresultEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleBuildMaterialName = () => {
    const name = buildMaterialRresultMaterialName(form);
    if (!name) {
      const msg = "仕入先が「第2工場」または「児湯茶」のとき原料名を生成できます";
      setError(msg);
      window.alert(msg);
      return;
    }
    setError("");
    patch({ materialName: name });
  };

  const showRed = (key: Parameters<typeof materialRresultIsMandatoryEmpty>[0]) =>
    materialRresultIsMandatoryEmpty(key, form) || Boolean(fieldErrors[key]);

  const title =
    mode === "create"
      ? "原料実績情報メンテナンス（登録）"
      : mode === "update"
        ? "原料実績情報メンテナンス（変更）"
        : mode === "delete"
          ? "原料実績情報メンテナンス（削除）"
          : "原料実績情報メンテナンス（参照）";

  const handleSubmit = async () => {
    if (mode === "locked") return;

    if (mode === "delete") {
      if (!window.confirm("削除内容に間違いがないか確認してください。削除を実行します。よろしいですか？")) {
        return;
      }
      setSubmitting(true);
      setError("");
      try {
        await deleteMaterialResult(materialRresultEditFormToDeleteBody(form));
        await refreshMaster();
        window.alert("削除が完了しました");
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const errors = validateMaterialRresultEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const confirmMsg =
      mode === "create"
        ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
        : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      await upsertMaterialResult(materialRresultEditFormToUpsertBody(form));
      await refreshMaster();
      window.alert(mode === "create" ? "登録が完了しました" : "更新が完了しました");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const disabledClass = inputDisabled ? " ptEditInputDisabled" : "";
  const keyDisabledClass = keyReadonly ? " ptEditInputDisabled" : "";
  const selectClass = (hasError: boolean, readonly = false) =>
    `ptEditSelect preset${readonly || inputDisabled ? " ptEditInputDisabled" : ""}${
      hasError ? " inputError" : ""
    }`;

  return (
    <EditModalOverlay
      mode={mode === "locked" || mode === "delete" ? "view" : mode === "update" ? "update" : "create"}
      className="ptEditOverlay"
      onClose={onClose}
    >
      <div
        className="ptEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mrEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="mrEditTitle" className="ptEditPanelTitle">
          {title}
        </h2>

        <div className="ptEditToolbar">
          <button type="button" disabled={mode !== "create" || submitting} onClick={() => void handleSubmit()}>
            登録
          </button>
          <button type="button" disabled={mode !== "update" || submitting} onClick={() => void handleSubmit()}>
            変更
          </button>
          <button type="button" disabled={mode !== "delete" || submitting} onClick={() => void handleSubmit()}>
            削除
          </button>
          <button type="button" disabled title="未実装">
            一括変更
          </button>
          <button type="button" disabled={submitting} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {error ? <p className="ptEditError">{error}</p> : null}

        <div className="ptEditForm">
          <div className="ptEditFormHead">
            <FormRow label="年度" required>
              <div className={`ptEditYearWrap${showRed("year") ? " inputError" : ""}`}>
                <Factory2MakeYearSpinner
                  value={form.year}
                  onChange={(year) => patch({ year })}
                  readOnly={keyReadonly}
                />
              </div>
            </FormRow>

            <FormRow label="仕入先" required>
              <input
                className={`ptEditInput${keyDisabledClass}${showRed("purchase") ? " inputError" : ""}`}
                type="text"
                value={form.purchase}
                disabled={keyReadonly}
                onChange={(e) => patch({ purchase: e.target.value })}
                aria-invalid={showRed("purchase") || undefined}
                aria-label="仕入先"
              />
            </FormRow>

            <FormRow label="製造NO" required>
              <input
                className={`ptEditInput${disabledClass}${showRed("productNo") ? " inputError" : ""}`}
                type="text"
                value={form.productNo}
                disabled={inputDisabled || mode === "update"}
                onChange={(e) => patch({ productNo: e.target.value })}
                aria-invalid={showRed("productNo") || undefined}
                aria-label="製造NO"
              />
            </FormRow>

            <FormRow label="仕入日" required>
              <input
                className={`ptEditInput date${disabledClass}${showRed("purchaseDate") ? " inputError" : ""}`}
                type="date"
                value={form.purchaseDate}
                disabled={inputDisabled || mode === "update"}
                onChange={(e) => patch({ purchaseDate: e.target.value })}
                aria-invalid={showRed("purchaseDate") || undefined}
                aria-label="仕入日"
              />
            </FormRow>
          </div>

          <div className="ptEditFormBody">
            <FormRow label="品柄" required>
              <select
                className={selectClass(showRed("teaRank"), mode === "update")}
                value={form.teaRank}
                disabled={inputDisabled || mode === "update"}
                onChange={(e) => patch({ teaRank: e.target.value })}
                aria-invalid={showRed("teaRank") || undefined}
                aria-label="品柄"
              >
                <option value="">（選択）</option>
                {TEA_RANK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="等級" required>
              <input
                className={`ptEditInput${disabledClass}${showRed("rank") ? " inputError" : ""}`}
                type="text"
                value={form.rank}
                disabled={inputDisabled || mode === "update"}
                onChange={(e) => patch({ rank: e.target.value })}
                aria-invalid={showRed("rank") || undefined}
                aria-label="等級"
              />
            </FormRow>

            <FormRow label="茶種">
              <select
                className={selectClass(false)}
                value={form.teaType}
                disabled={inputDisabled}
                onChange={(e) => patch({ teaType: e.target.value })}
                aria-label="茶種"
              >
                <option value="">（選択）</option>
                {TEA_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="茶期">
              <select
                className={selectClass(false)}
                value={form.teaLife}
                disabled={inputDisabled}
                onChange={(e) => patch({ teaLife: e.target.value })}
                aria-label="茶期"
              >
                <option value="">（選択）</option>
                {TEA_LIFE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="格付" required>
              <select
                className={selectClass(showRed("organicClass"))}
                value={form.organicClass}
                disabled={inputDisabled}
                onChange={(e) => patch({ organicClass: e.target.value })}
                aria-invalid={showRed("organicClass") || undefined}
                aria-label="格付"
              >
                {ORGANIC_CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="生産者">
              <TrConstantZoomField
                value={form.producer}
                onChange={(v) => patch({ producer: v })}
                constField="producer"
                title="システム定数（生産者）"
                constants={trConstants}
                disabled={inputDisabled}
                ariaLabel="生産者"
              />
            </FormRow>

            <FormRow
              label="原料名"
              required
              labelButton={{
                onClick: handleBuildMaterialName,
                disabled: inputDisabled,
                title: "仕入先が第2工場／児湯茶のとき原料名を生成"
              }}
            >
              <input
                className={`ptEditInput${disabledClass}${showRed("materialName") ? " inputError" : ""}`}
                type="text"
                value={form.materialName}
                disabled={inputDisabled}
                onChange={(e) => patch({ materialName: e.target.value })}
                aria-invalid={showRed("materialName") || undefined}
                aria-label="原料名"
              />
            </FormRow>

            <FormRow label="梱包(重量/数)">
              <div className="ptEditPair">
                <input
                  className={`ptEditInput numeric${disabledClass}`}
                  type="text"
                  inputMode="decimal"
                  value={form.unitWeight}
                  disabled={inputDisabled}
                  onChange={(e) => patch({ unitWeight: sanitizeDecimal2Input(e.target.value) })}
                  onBlur={() => patch({ unitWeight: formatDecimal2OnBlur(form.unitWeight) })}
                  aria-label="梱包重量"
                />
                <input
                  className={`ptEditInput numeric${disabledClass}`}
                  type="text"
                  inputMode="numeric"
                  value={form.unitNumber}
                  disabled={inputDisabled}
                  onChange={(e) => patch({ unitNumber: sanitizeIntegerInput(e.target.value) })}
                  aria-label="梱包数"
                />
              </div>
            </FormRow>

            <FormRow label="端数(重量/数)">
              <div className="ptEditPair">
                <input
                  className={`ptEditInput numeric${disabledClass}`}
                  type="text"
                  inputMode="decimal"
                  value={form.fractionWeight}
                  disabled={inputDisabled}
                  onChange={(e) => patch({ fractionWeight: sanitizeDecimal2Input(e.target.value) })}
                  onBlur={() => patch({ fractionWeight: formatDecimal2OnBlur(form.fractionWeight) })}
                  aria-label="端数重量"
                />
                <input
                  className={`ptEditInput numeric${disabledClass}`}
                  type="text"
                  inputMode="numeric"
                  value={form.fractionNumber}
                  disabled={inputDisabled}
                  onChange={(e) => patch({ fractionNumber: sanitizeIntegerInput(e.target.value) })}
                  aria-label="端数数"
                />
              </div>
            </FormRow>

            <FormRow label="摘要">
              <input
                className={`ptEditInput${disabledClass}`}
                type="text"
                value={form.remarks}
                disabled={inputDisabled}
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
