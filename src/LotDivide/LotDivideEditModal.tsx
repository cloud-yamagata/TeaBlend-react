/**
 * ロット分割による原料登録モーダル（WPF EditWindow 相当）
 * 配色・必須赤枠は原料実績情報メンテナンス（ptEdit*）に合わせる
 * 再投入 / 転売
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import {
  formatPurchaseDecimal2OnBlur,
  sanitizePurchaseDecimal2Input
} from "../PurchaseTtransfer/purchaseTtransferEditForm";
import { masterTrConstantsAtom } from "../repository/masterData";
import { materialRegistLotDivide } from "../repositories/lotDivideRepository";
import { useBusyTask } from "../ui/useBusyTask";
import { refreshLotDivideMastersAtom } from "./refreshLotDivideMasters";
import type { LotDivideEditForm } from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "./lotDivideEditModal.css";

type Props = {
  open: boolean;
  initialForm: LotDivideEditForm;
  onClose: () => void;
  onDone?: () => void;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

type MandatoryKey = "divideDate" | "divideQuantity" | "divideLotName" | "reason";

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

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isMandatoryEmpty = (key: MandatoryKey, form: LotDivideEditForm, forResale = false): boolean => {
  switch (key) {
    case "divideDate":
      return form.divideDate.trim() === "";
    case "divideQuantity": {
      const qty = Number(form.divideQuantity.replace(/,/g, ""));
      return form.divideQuantity.trim() === "" || !Number.isFinite(qty) || qty <= 0;
    }
    case "divideLotName":
      return form.divideLotName.trim() === "";
    case "reason":
      return forResale && form.reason.trim() === "";
  }
};

export function LotDivideEditModal({ open, initialForm, onClose, onDone }: Props) {
  const runBusy = useBusyTask();
  const refreshMasters = useSetAtom(refreshLotDivideMastersAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const [form, setForm] = useState<LotDivideEditForm>(initialForm);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /** 転売押下後に事由未入力を赤枠表示する */
  const [resaleAttempted, setResaleAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...initialForm,
      divideDate: initialForm.divideDate || todayYmd(),
      divideLotName: initialForm.divideLotName || initialForm.lotName
    });
    setLocalError("");
    setSubmitting(false);
    setResaleAttempted(false);
  }, [open, initialForm]);

  if (!open) return null;

  const qty = Number(form.divideQuantity.replace(/,/g, ""));
  const stock = Number(form.factory2Stock.replace(/,/g, ""));
  /** 変更前と同じ活性条件（分割日・分割ロット名・分割重量が揃ったとき） */
  const canSubmit =
    !submitting &&
    form.lotNo > 0 &&
    form.divideDate.trim() !== "" &&
    form.divideLotName.trim() !== "" &&
    form.divideQuantity.trim() !== "" &&
    Number.isFinite(qty) &&
    qty > 0;

  const showRed = (key: MandatoryKey) =>
    isMandatoryEmpty(key, form, key === "reason" ? resaleAttempted : false);

  const inputClass = (key?: MandatoryKey, extra = "") =>
    `ptEditInput${extra}${key && showRed(key) ? " inputError" : ""}`;

  const runDivide = async (divideType: "1" | "2") => {
    if (submitting || !canSubmit) return;
    setLocalError("");
    if (divideType === "2") setResaleAttempted(true);

    if (!Number.isFinite(qty) || qty <= 0 || qty > stock) {
      setLocalError("入力された分割数量が不正です");
      return;
    }
    if (isMandatoryEmpty("reason", form, divideType === "2")) {
      setLocalError("転売先を入力してください");
      return;
    }
    if (
      !window.confirm(
        "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？"
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await runBusy(
        () =>
          materialRegistLotDivide({
            lot_no: form.lotNo,
            process_type: form.processType,
            product_no: form.productNo,
            lot_name: form.lotName,
            item_no: form.itemNo,
            item_name: form.itemName,
            organic_class: form.organicClass,
            make_year: form.makeYear || null,
            count: form.count || null,
            factory2_stock: stock,
            divide_type: divideType,
            divide_date: form.divideDate.trim(),
            divide_quantity: qty,
            divide_lot_name: form.divideLotName.trim(),
            reason: form.reason.trim() || null,
            remarks: form.remarks.trim() || null
          }),
        "ロット分割処理中…"
      );
      await refreshMasters();
      window.alert(
        `${result.message}\nロット分割(${divideType === "1" ? "再投入" : "転売"})情報の更新が正常に処理されました`
      );
      onDone?.();
      onClose();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EditModalOverlay mode="create" onClose={onClose} className="ptEditOverlay ldEditOverlay">
      <div
        className="ptEditPanel ldEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ld-edit-title" className="ptEditPanelTitle">
          ロット分割による原料登録
        </h2>

        <div className="ptEditToolbar">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void runDivide("1")}
            title="再投入として分割"
          >
            再投入
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void runDivide("2")}
            title="転売として分割"
          >
            転売
          </button>
          <button type="button" disabled={submitting} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {localError ? (
          <p className="ptEditError" role="alert">
            {localError}
          </p>
        ) : null}

        <div className="ptEditForm">
          <div className="ptEditFormHead">
            <FormRow label="ロットNo">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={form.lotNo} readOnly />
            </FormRow>
            <FormRow label="工程">
              <input
                className="ptEditInput ptEditInputDisabled"
                type="text"
                value={`${form.processType} ${form.processTypeName}`.trim()}
                readOnly
              />
            </FormRow>
            <FormRow label="製造No">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={form.productNo} readOnly />
            </FormRow>
            <FormRow label="ロット名">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={form.lotName} readOnly />
            </FormRow>
            <FormRow label="通称名">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={form.itemName} readOnly />
            </FormRow>
            <FormRow label="在庫重量">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={form.factory2Stock} readOnly />
            </FormRow>
          </div>

          <div className="ptEditFormBody">
            <FormRow label="摘要">
              <input
                className="ptEditInput"
                type="text"
                value={form.remarks}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
              />
            </FormRow>
            <FormRow label="分割日" required>
              <input
                className={inputClass("divideDate", " date")}
                type="date"
                value={form.divideDate}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, divideDate: e.target.value }))}
                aria-invalid={showRed("divideDate") || undefined}
              />
            </FormRow>
            <FormRow label="事由(転売先)" required={resaleAttempted}>
              <TrConstantZoomField
                value={form.reason}
                onChange={(v) => setForm((p) => ({ ...p, reason: v }))}
                constField="resale"
                title="システム定数（転売先）"
                constants={trConstants}
                disabled={submitting}
                ariaLabel="事由(転売先)"
                invalid={showRed("reason")}
                inputClassName={showRed("reason") ? "inputError" : undefined}
              />
            </FormRow>
            <FormRow label="分割重量" required>
              <input
                className={inputClass("divideQuantity", " numeric")}
                type="text"
                inputMode="decimal"
                value={form.divideQuantity}
                disabled={submitting}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    divideQuantity: sanitizePurchaseDecimal2Input(e.target.value)
                  }))
                }
                onBlur={() =>
                  setForm((p) => ({
                    ...p,
                    divideQuantity: formatPurchaseDecimal2OnBlur(p.divideQuantity)
                  }))
                }
                aria-invalid={showRed("divideQuantity") || undefined}
              />
            </FormRow>
            <FormRow label="分割ロット名" required>
              <input
                className={inputClass("divideLotName")}
                type="text"
                value={form.divideLotName}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, divideLotName: e.target.value }))}
                aria-invalid={showRed("divideLotName") || undefined}
              />
            </FormRow>
          </div>
        </div>
      </div>
    </EditModalOverlay>
  );
}
