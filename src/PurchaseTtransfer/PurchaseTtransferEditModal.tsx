/**
 * 仕入実績情報メンテナンス（登録・一括変更）… EditWindow.xaml 左ペイン相当
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { masterEntityCacheAtom, masterTrConstantsAtom } from "../repository/masterData";
import { upsertPurchaseTea } from "../repositories/purchaseTeaRepository";
import {
  GRADE_OPTIONS,
  TEA_LIFE_OPTIONS,
  TEA_RANK_OPTIONS,
  TEA_TYPE_OPTIONS,
  createBulkUpdatePurchaseTtransferEditForm,
  createEmptyPurchaseTtransferEditForm,
  createPurchaseTtransferEditFormFromRow,
  formatPurchaseDecimal2OnBlur,
  formatPurchaseDiscountOnBlur,
  hasBulkUpdateFieldChecked,
  purchaseTtransferEditFormToUpsertBody,
  sanitizePurchaseDecimal2Input,
  sanitizePurchaseDiscountInput,
  sanitizePurchaseIntegerInput,
  validatePurchaseTtransferEditForm,
  type PurchaseTtransferEditFieldErrors,
  type PurchaseTtransferEditForm
} from "./purchaseTtransferEditForm";
import { refreshPurchaseTeaMasterAtom } from "./refreshPurchaseTeaMaster";
import { applyBulkUpdatePurchaseTeaCacheAtom } from "./applyBulkUpdatePurchaseTeaCache";
import type { PurchaseTtransferRow } from "./types";
import "./purchaseTtransferEditModal.css";

export type PurchaseTtransferEditModalMode = "create" | "bulkUpdate";

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: PurchaseTtransferEditModalMode;
  initialYear?: string;
  /** 選択行 COPY 登録の元データ（未選択時は null） */
  copySourceRow?: PurchaseTtransferRow | null;
  /** 一括変更対象行 ID（mode=bulkUpdate 時） */
  bulkUpdateTargetIds?: ReadonlySet<string>;
  /** 一括変更成功時（キャッシュ更新後） */
  onBulkUpdateSuccess?: () => void;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  withCheck?: boolean;
  checkDisabled?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  children: ReactNode;
};

function FormRow({
  label,
  required = false,
  withCheck = false,
  checkDisabled = true,
  checked = false,
  onCheckChange,
  children
}: FormRowProps) {
  return (
    <div className="ptEditRow">
      <div className={`ptEditLabelCell${required ? " required" : ""}${withCheck ? " withCheck" : ""}`}>
        {withCheck ? (
          <input
            type="checkbox"
            checked={checked}
            disabled={checkDisabled}
            onChange={(e) => onCheckChange?.(e.target.checked)}
            aria-label={`${label}一括変更対象`}
          />
        ) : null}
        <span className="ptEditLabelText">{required ? `*${label}` : label}</span>
      </div>
      <div className="ptEditValueCell">{children}</div>
    </div>
  );
}

export function PurchaseTtransferEditModal({
  open,
  onClose,
  mode = "create",
  initialYear,
  copySourceRow = null,
  bulkUpdateTargetIds,
  onBulkUpdateSuccess
}: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const refreshPurchaseTea = useSetAtom(refreshPurchaseTeaMasterAtom);
  const applyBulkUpdateCache = useSetAtom(applyBulkUpdatePurchaseTeaCacheAtom);

  const isBulkUpdate = mode === "bulkUpdate";

  const [form, setForm] = useState<PurchaseTtransferEditForm>(() => createEmptyPurchaseTtransferEditForm(initialYear));
  const [fieldErrors, setFieldErrors] = useState<PurchaseTtransferEditFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isBulkUpdate) {
      setForm(createBulkUpdatePurchaseTtransferEditForm());
    } else if (copySourceRow) {
      setForm(createPurchaseTtransferEditFormFromRow(copySourceRow));
    } else {
      setForm(createEmptyPurchaseTtransferEditForm(initialYear));
    }
    setFieldErrors({});
    setSubmitAttempted(false);
    setError("");
    setStatus("");
    setSubmitting(false);
  }, [open, initialYear, copySourceRow, isBulkUpdate]);

  const updateField = useCallback(<K extends keyof PurchaseTtransferEditForm>(key: K, value: PurchaseTtransferEditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  /** 一括変更: チェック付き項目は入力可（チェックは更新対象の指定） */
  const bulkCheckFieldDisabled = () => submitting;

  /** 一括変更: チェック無し項目は常に非活性 */
  const plainFieldDisabled = submitting || isBulkUpdate;

  const handleRegister = useCallback(async () => {
    setSubmitAttempted(true);
    setError("");
    setStatus("");

    const errors = validatePurchaseTtransferEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const year = Number(form.year);
    const purchase = form.purchase.trim();
    const bidNo = form.bidNo.trim();
    const duplicate = cache.te_purchase_tea.some(
      (row) => row.data.year === year && row.data.purchase === purchase && row.data.bid_no === bidNo
    );
    if (duplicate) {
      setError("同じ年度・仕入先・入札NOの仕入実績が既に存在します。");
      return;
    }

    setSubmitting(true);
    try {
      await upsertPurchaseTea(purchaseTtransferEditFormToUpsertBody(form));
      await refreshPurchaseTea();
      setStatus("登録しました。");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [cache.te_purchase_tea, form, onClose, refreshPurchaseTea]);

  const handleBulkUpdate = useCallback(() => {
    setSubmitAttempted(true);
    setError("");
    setStatus("");

    if (!hasBulkUpdateFieldChecked(form)) {
      setError("変更する項目をチェックしてください。");
      return;
    }

    const targetCount = bulkUpdateTargetIds?.size ?? 0;
    if (targetCount === 0) {
      setError("一括変更対象行がありません。");
      return;
    }

    const updatedCount = applyBulkUpdateCache({ form, targetIds: bulkUpdateTargetIds! });
    if (updatedCount === 0) {
      setError("更新対象の仕入実績が見つかりませんでした。");
      return;
    }

    setStatus(`${updatedCount} 件を更新しました。`);
    onBulkUpdateSuccess?.();
    onClose();
  }, [applyBulkUpdateCache, bulkUpdateTargetIds, form, onBulkUpdateSuccess, onClose]);

  if (!open) return null;

  const fieldError = (key: keyof PurchaseTtransferEditFieldErrors): string | undefined =>
    submitAttempted ? fieldErrors[key] : undefined;

  const selectClass = (enabled: boolean) =>
    enabled ? "ptEditSelect preset" : "ptEditSelect preset ptEditInputDisabled";

  const checkFieldInputEnabled = !isBulkUpdate || !submitting;

  return (
    <EditModalOverlay mode={isBulkUpdate ? "update" : "create"} onClose={handleClose} className="ptEditOverlay">
      <div
        className="ptEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ptEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ptEditTitle" className="ptEditPanelTitle">
          仕入実績情報メンテナンス
        </h2>

        <div className="ptEditToolbar">
          <button type="button" disabled={submitting || isBulkUpdate} onClick={() => void handleRegister()}>
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
            disabled={submitting || !isBulkUpdate}
            onClick={() => void handleBulkUpdate()}
          >
            一括変更
          </button>
          <button type="button" disabled={submitting} onClick={handleClose}>
            キャンセル
          </button>
        </div>

        <div className="ptEditForm">
          <div className="ptEditFormHead">
            <FormRow label="年度" required>
              <div className="ptEditYearWrap">
                <Factory2MakeYearSpinner
                  value={form.year}
                  onChange={(v) => updateField("year", v)}
                  readOnly={plainFieldDisabled}
                />
              </div>
            </FormRow>

            <FormRow label="仕入先" required>
              <TrConstantZoomField
                value={form.purchase}
                onChange={(v) => updateField("purchase", v)}
                constField="purchase"
                title="システム定数（仕入先）"
                constants={trConstants}
                disabled={plainFieldDisabled}
                ariaLabel="仕入先"
                invalid={fieldError("purchase") != null}
              />
            </FormRow>

            <FormRow label="入札NO" required>
              <input
                className={`ptEditInput${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
                type="text"
                value={form.bidNo}
                disabled={plainFieldDisabled}
                onChange={(e) => updateField("bidNo", e.target.value)}
                aria-invalid={fieldError("bidNo") != null}
                aria-label="入札NO"
              />
            </FormRow>
          </div>

          <div className="ptEditFormBody">
          <FormRow label="仕入日">
            <input
              className={`ptEditInput date${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
              type="date"
              value={form.purchaseDate}
              disabled={plainFieldDisabled}
              onChange={(e) => updateField("purchaseDate", e.target.value)}
              aria-invalid={fieldError("purchaseDate") != null}
              aria-label="仕入日"
            />
          </FormRow>

          <FormRow
            label="品種"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isVarietyCheck}
            onCheckChange={(v) => updateField("isVarietyCheck", v)}
          >
            <TrConstantZoomField
              value={form.variety}
              onChange={(v) => updateField("variety", v)}
              constField="variety"
              title="システム定数（品種）"
              constants={trConstants}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              ariaLabel="品種"
            />
          </FormRow>

          <FormRow
            label="茶期"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isTeaLifeCheck}
            onCheckChange={(v) => updateField("isTeaLifeCheck", v)}
          >
            <select
              className={selectClass(checkFieldInputEnabled)}
              value={form.teaLife}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("teaLife", e.target.value)}
              aria-label="茶期"
            >
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
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isGradeCheck}
            onCheckChange={(v) => updateField("isGradeCheck", v)}
          >
            <select
              className={selectClass(checkFieldInputEnabled)}
              value={form.grade}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("grade", e.target.value)}
              aria-label="格付"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            label="茶種"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isTeaTypeCheck}
            onCheckChange={(v) => updateField("isTeaTypeCheck", v)}
          >
            <select
              className={selectClass(checkFieldInputEnabled)}
              value={form.teaType}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("teaType", e.target.value)}
              aria-label="茶種"
            >
              {TEA_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            label="品柄"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isTeaRankCheck}
            onCheckChange={(v) => updateField("isTeaRankCheck", v)}
          >
            <select
              className={selectClass(checkFieldInputEnabled)}
              value={form.teaRank}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("teaRank", e.target.value)}
              aria-label="品柄"
            >
              {TEA_RANK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            label="圃場"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isFieldNoCheck}
            onCheckChange={(v) => updateField("isFieldNoCheck", v)}
          >
            <input
              className={`ptEditInput${!checkFieldInputEnabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              value={form.fieldNo}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("fieldNo", e.target.value)}
              aria-label="圃場"
            />
          </FormRow>

          <FormRow label="生産者">
            <TrConstantZoomField
              value={form.producer}
              onChange={(v) => updateField("producer", v)}
              constField="producer"
              title="システム定数（生産者）"
              constants={trConstants}
              disabled={plainFieldDisabled}
              ariaLabel="生産者"
            />
          </FormRow>

          <FormRow label="仕入単価">
            <input
              className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              inputMode="numeric"
              value={form.cost}
              disabled={plainFieldDisabled}
              onChange={(e) => updateField("cost", e.target.value)}
              aria-invalid={fieldError("cost") != null}
              aria-label="仕入単価"
            />
          </FormRow>

          <FormRow label="梱包(重量/数)">
            <div className="ptEditPair">
              <input
                className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
                type="text"
                inputMode="decimal"
                value={form.unitWeight}
                disabled={plainFieldDisabled}
                onChange={(e) => updateField("unitWeight", sanitizePurchaseDecimal2Input(e.target.value))}
                onBlur={() => updateField("unitWeight", formatPurchaseDecimal2OnBlur(form.unitWeight))}
                aria-invalid={fieldError("unitWeight") != null}
                aria-label="梱包重量"
              />
              <input
                className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
                type="text"
                inputMode="numeric"
                value={form.unitNumber}
                disabled={plainFieldDisabled}
                onChange={(e) => updateField("unitNumber", sanitizePurchaseIntegerInput(e.target.value))}
                aria-invalid={fieldError("unitNumber") != null}
                aria-label="梱包数"
              />
            </div>
          </FormRow>

          <FormRow label="端数(重量/数)">
            <div className="ptEditPair">
              <input
                className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
                type="text"
                inputMode="decimal"
                value={form.fractionWeight}
                disabled={plainFieldDisabled}
                onChange={(e) => updateField("fractionWeight", sanitizePurchaseDecimal2Input(e.target.value))}
                onBlur={() => updateField("fractionWeight", formatPurchaseDecimal2OnBlur(form.fractionWeight))}
                aria-invalid={fieldError("fractionWeight") != null}
                aria-label="端数重量"
              />
              <input
                className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
                type="text"
                inputMode="numeric"
                value={form.fractionNumber}
                disabled={plainFieldDisabled}
                onChange={(e) => updateField("fractionNumber", sanitizePurchaseIntegerInput(e.target.value))}
                aria-invalid={fieldError("fractionNumber") != null}
                aria-label="端数数"
              />
            </div>
          </FormRow>

          <FormRow label="粉引(%)">
            <input
              className={`ptEditInput numeric${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              inputMode="numeric"
              value={form.discount}
              disabled={plainFieldDisabled}
              onChange={(e) => updateField("discount", sanitizePurchaseDiscountInput(e.target.value))}
              onBlur={() => updateField("discount", formatPurchaseDiscountOnBlur(form.discount))}
              aria-invalid={fieldError("discount") != null}
              aria-label="粉引"
            />
          </FormRow>

          <FormRow
            label="用途"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isTargetCheck}
            onCheckChange={(v) => updateField("isTargetCheck", v)}
          >
            <input
              className={`ptEditInput${!checkFieldInputEnabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              value={form.target}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("target", e.target.value)}
              aria-label="用途"
            />
          </FormRow>

          <FormRow
            label="予定用途"
            withCheck
            checkDisabled={!isBulkUpdate || submitting}
            checked={form.isTargetPlanCheck}
            onCheckChange={(v) => updateField("isTargetPlanCheck", v)}
          >
            <input
              className={`ptEditInput${!checkFieldInputEnabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              value={form.targetPlan}
              disabled={isBulkUpdate ? bulkCheckFieldDisabled() : submitting}
              onChange={(e) => updateField("targetPlan", e.target.value)}
              aria-label="予定用途"
            />
          </FormRow>

          <FormRow label="ロットNO">
            <input
              className={`ptEditInput${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              value={form.lotNo}
              disabled={plainFieldDisabled}
              onChange={(e) => updateField("lotNo", e.target.value)}
              aria-label="ロットNO"
            />
          </FormRow>

          <FormRow label="摘要">
            <input
              className={`ptEditInput${plainFieldDisabled ? " ptEditInputDisabled" : ""}`}
              type="text"
              value={form.remarks}
              disabled={plainFieldDisabled}
              onChange={(e) => updateField("remarks", e.target.value)}
              aria-label="摘要"
            />
          </FormRow>
          </div>
        </div>

        {isBulkUpdate && bulkUpdateTargetIds ? (
          <p className="ptEditStatus">一括変更対象: {bulkUpdateTargetIds.size} 件</p>
        ) : null}
        {submitAttempted && !isBulkUpdate && Object.keys(fieldErrors).length > 0 ? (
          <p className="ptEditError">{Object.values(fieldErrors)[0]}</p>
        ) : null}
        {error ? <p className="ptEditError">{error}</p> : null}
        {status ? <p className="ptEditStatus">{status}</p> : null}
      </div>
    </EditModalOverlay>
  );
}
