/**
 * 第1工場生産情報メンテナンス（登録・変更・削除）
 * 入力UI・色合いは仕入実績情報メンテナンス（ptEdit*）に合わせる
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { masterTrConstantsAtom } from "../repository/masterData";
import { deleteFactory1Result, upsertFactory1Result } from "../repositories/factory1ResultRepository";
import {
  GRADE_OPTIONS,
  TEA_LIFE_OPTIONS,
  TEA_RANK_OPTIONS,
  buildFactory1LotNo,
  applyFactory1LotNoButton,
  createEmptyFactory1RresultEditForm,
  createFactory1RresultEditFormFromCopy,
  createFactory1RresultEditFormFromRow,
  factory1RresultEditFormToUpsertBody,
  factory1RresultIsMandatoryEmpty,
  formatDecimal2OnBlur,
  sanitizeDecimal2Input,
  sanitizeIntegerInput,
  validateFactory1RresultEditForm,
  type Factory1RresultEditFieldErrors,
  type Factory1RresultEditForm
} from "./factory1RresultEditForm";
import { refreshFactory1RresultMasterAtom } from "./refreshFactory1RresultMaster";
import type { Factory1RresultRow } from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./factory1RresultEditModal.css";

export type Factory1RresultEditModalMode = "create" | "update" | "delete" | "locked";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: Factory1RresultEditModalMode;
  initialYear?: string;
  targetRow?: Factory1RresultRow | null;
  /** 登録時 COPY 元（未選択時は null） */
  copySourceRow?: Factory1RresultRow | null;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  withCheck?: boolean;
  checkDisabled?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  /** ラベルセルをボタン化（WPF *ロットNO 相当） */
  labelButton?: {
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  };
  children: ReactNode;
};

function FormRow({
  label,
  required = false,
  withCheck = false,
  checkDisabled = true,
  checked = false,
  onCheckChange,
  labelButton,
  children
}: FormRowProps) {
  const labelText = required ? `*${label}` : label;
  return (
    <div className="ptEditRow">
      <div
        className={`ptEditLabelCell${required && !labelButton ? " required" : ""}${
          labelButton ? " asButton" : ""
        }${withCheck ? " withCheck" : ""}`}
      >
        {withCheck ? (
          <input
            type="checkbox"
            checked={checked}
            disabled={checkDisabled}
            onChange={(e) => onCheckChange?.(e.target.checked)}
            aria-label={`${label}一括変更対象`}
          />
        ) : null}
        {labelButton ? (
          <button
            type="button"
            className="ptEditLotNoLabelButton"
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

export function Factory1RresultEditModal({
  open,
  onClose,
  mode,
  initialYear,
  targetRow = null,
  copySourceRow = null
}: Props) {
  const refreshMaster = useSetAtom(refreshFactory1RresultMasterAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const [form, setForm] = useState<Factory1RresultEditForm>(() => createEmptyFactory1RresultEditForm(initialYear));
  const [, setFieldErrors] = useState<Factory1RresultEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const readOnly = mode === "delete" || mode === "locked";
  const inputDisabled = readOnly || submitting;
  /** 一括変更未実装のためチェックは常時無効（仕入実績の登録モードと同様） */
  const checkDisabled = true;
  const title = "第1工場生産情報メンテナンス";

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    setSubmitting(false);
    if (mode === "create") {
      setForm(
        copySourceRow
          ? createFactory1RresultEditFormFromCopy(copySourceRow, initialYear)
          : createEmptyFactory1RresultEditForm(initialYear)
      );
      return;
    }
    if (targetRow) {
      setForm(createFactory1RresultEditFormFromRow(targetRow));
    }
  }, [open, mode, initialYear, targetRow, copySourceRow]);

  const patch = useCallback((partial: Partial<Factory1RresultEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleBuildLotNo = () => {
    const result = applyFactory1LotNoButton(form);
    if (!result.ok) {
      setError(result.message);
      window.alert(result.message);
      return;
    }
    setError("");
    patch({ lotNo: result.lotNo });
  };

  const showRed = (key: Parameters<typeof factory1RresultIsMandatoryEmpty>[0]) =>
    !readOnly && factory1RresultIsMandatoryEmpty(key, form);

  const handleSubmit = async () => {
    if (mode === "locked") return;
    if (submitting) return;

    if (mode === "delete") {
      if (!targetRow) return;
      if (!window.confirm("削除を実行します。よろしいですか？")) return;
      setSubmitting(true);
      setError("");
      try {
        await deleteFactory1Result(targetRow.lotNo);
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

    const errors = validateFactory1RresultEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const lotNo = buildFactory1LotNo(form);
    if (mode === "create") {
      // WPF: 初期ロットとフォーム上のロットが同じ＝構成未変更。ボタンで採番済みであること。
      if (!form.lotNo.trim() || form.lotNo.trim() === form.initialLotNo) {
        setError("ロットNoの構成項目の変更を行ってください");
        return;
      }
      if (lotNo !== form.lotNo.trim()) {
        // 採番後に構成項目が変わっている場合は再採番を促す
        setError("ロットNoボタンで再採番してください");
        return;
      }
    } else if (mode === "update") {
      if (lotNo !== form.initialLotNo) {
        setError("ロットNoに構成項目の変更はできません");
        return;
      }
    }

    const confirmMsg =
      mode === "create"
        ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
        : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    const nextForm = { ...form, lotNo: mode === "create" ? lotNo : form.initialLotNo };
    setSubmitting(true);
    setError("");
    try {
      await upsertFactory1Result(factory1RresultEditFormToUpsertBody(nextForm));
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
  const selectClass = (hasError: boolean) =>
    `ptEditSelect preset${inputDisabled ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;

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
        aria-labelledby="f1rEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="f1rEditTitle" className="ptEditPanelTitle">
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
            <FormRow
              label="ロットNO"
              required
              labelButton={{
                onClick: handleBuildLotNo,
                disabled: inputDisabled,
                title: "ロットNOを生成（生産日＋圃場＋品種略＋品柄）"
              }}
            >
              <input
                className={`ptEditInput${disabledClass}${showRed("lotNo") ? " inputError" : ""}`}
                type="text"
                value={form.lotNo}
                readOnly
                aria-invalid={showRed("lotNo") || undefined}
                aria-label="ロットNO"
              />
            </FormRow>

            <FormRow label="生産日" required>
              <input
                className={`ptEditInput date${disabledClass}${showRed("workDate") ? " inputError" : ""}`}
                type="date"
                value={form.workDate}
                disabled={inputDisabled}
                onChange={(e) => patch({ workDate: e.target.value })}
                aria-invalid={showRed("workDate") || undefined}
                aria-label="生産日"
              />
            </FormRow>

            <FormRow label="年度" required>
              <div className={`ptEditYearWrap${showRed("year") ? " inputError" : ""}`}>
                <Factory2MakeYearSpinner
                  value={form.year}
                  onChange={(year) => patch({ year })}
                  readOnly={inputDisabled || mode === "update"}
                />
              </div>
            </FormRow>
          </div>

          <div className="ptEditFormBody">
            <FormRow label="品種" required>
              <TrConstantZoomField
                value={form.variety}
                onChange={(v) => patch({ variety: v })}
                constField="variety"
                title="システム定数（品種）"
                constants={trConstants}
                disabled={inputDisabled}
                ariaLabel="品種"
                invalid={showRed("variety")}
                className={showRed("variety") ? "f1rVarietyZoomError" : undefined}
                inputClassName={showRed("variety") ? "f1rVarietyZoomErrorInput" : undefined}
              />
            </FormRow>

            <FormRow label="品柄" required>
              <select
                className={selectClass(showRed("teaRank"))}
                value={form.teaRank}
                disabled={inputDisabled}
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

            <FormRow label="圃場">
              <input
                className={`ptEditInput${disabledClass}`}
                type="text"
                value={form.fieldNo}
                disabled={inputDisabled}
                onChange={(e) => patch({ fieldNo: e.target.value })}
                aria-label="圃場"
              />
            </FormRow>

            <FormRow
              label="茶期"
              withCheck
              checkDisabled={checkDisabled}
              checked={form.isTeaLifeCheck}
              onCheckChange={(v) => patch({ isTeaLifeCheck: v })}
            >
              <select
                className={selectClass(showRed("teaLife"))}
                value={form.teaLife}
                disabled={inputDisabled}
                onChange={(e) => patch({ teaLife: e.target.value })}
                aria-invalid={showRed("teaLife") || undefined}
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

            <FormRow
              label="格付"
              withCheck
              checkDisabled={checkDisabled}
              checked={form.isGradeCheck}
              onCheckChange={(v) => patch({ isGradeCheck: v })}
            >
              <select
                className={selectClass(showRed("grade"))}
                value={form.grade}
                disabled={inputDisabled}
                onChange={(e) => patch({ grade: e.target.value })}
                aria-invalid={showRed("grade") || undefined}
                aria-label="格付"
              >
                <option value="">（選択）</option>
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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

            <FormRow
              label="用途"
              withCheck
              checkDisabled={checkDisabled}
              checked={form.isTargetCheck}
              onCheckChange={(v) => patch({ isTargetCheck: v })}
            >
              <input
                className={`ptEditInput${disabledClass}`}
                type="text"
                value={form.target}
                disabled={inputDisabled}
                onChange={(e) => patch({ target: e.target.value })}
                aria-label="用途"
              />
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
