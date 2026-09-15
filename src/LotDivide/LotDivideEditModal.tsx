/**
 * ロット分割による原料登録モーダル（WPF EditWindow 相当）
 * 再投入 / 転売
 */
import { useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import {
  formatPurchaseDecimal2OnBlur,
  sanitizePurchaseDecimal2Input
} from "../PurchaseTtransfer/purchaseTtransferEditForm";
import { materialRegistLotDivide } from "../repositories/lotDivideRepository";
import { useBusyTask } from "../ui/useBusyTask";
import { refreshLotDivideMastersAtom } from "./refreshLotDivideMasters";
import type { LotDivideEditForm } from "./types";
import "../MaterialPurchase/materialPurchaseEditModal.css";

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

function FormRow({ label, required = false, children }: FormRowProps) {
  return (
    <div className="mpEditRow">
      <div className={`mpEditLabelCell${required ? " required" : ""}`}>
        <span className="mpEditLabelText">{required ? `*${label}` : label}</span>
      </div>
      <div className="mpEditValueCell">{children}</div>
    </div>
  );
}

const todayYmd = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function LotDivideEditModal({ open, initialForm, onClose, onDone }: Props) {
  const runBusy = useBusyTask();
  const refreshMasters = useSetAtom(refreshLotDivideMastersAtom);
  const [form, setForm] = useState<LotDivideEditForm>(initialForm);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...initialForm,
      divideDate: initialForm.divideDate || todayYmd(),
      divideLotName: initialForm.divideLotName || initialForm.lotName
    });
    setLocalError("");
    setSubmitting(false);
  }, [open, initialForm]);

  if (!open) return null;

  const qty = Number(form.divideQuantity.replace(/,/g, ""));
  const stock = Number(form.factory2Stock.replace(/,/g, ""));
  const canSubmit =
    !submitting &&
    form.lotNo > 0 &&
    form.divideDate.trim() !== "" &&
    form.divideLotName.trim() !== "" &&
    form.divideQuantity.trim() !== "" &&
    Number.isFinite(qty) &&
    qty > 0;

  const runDivide = async (divideType: "1" | "2") => {
    if (submitting) return;
    setLocalError("");

    if (!Number.isFinite(qty) || qty <= 0 || qty > stock) {
      setLocalError("入力された分割数量が不正です");
      return;
    }
    if (divideType === "2" && form.reason.trim() === "") {
      setLocalError("転売先を入力してください");
      return;
    }
    if (form.divideLotName.trim() === "") {
      setLocalError("分割ロット名を入力してください");
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
    <EditModalOverlay mode="update" onClose={onClose} className="mpEditOverlay">
      <div
        className="mpEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-edit-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(480px, calc(100vw - 32px))" }}
      >
        <h2 id="ld-edit-title" className="mpEditPanelTitle">
          ロット分割による原料登録
        </h2>

        <div className="mpEditToolbar">
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
          <p className="mpEditError" role="alert">
            {localError}
          </p>
        ) : null}

        <div className="mpEditForm">
          <FormRow label="ロットNo">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.lotNo} readOnly />
          </FormRow>
          <FormRow label="工程">
            <input
              className="mpEditInput mpEditInputDisabled"
              type="text"
              value={`${form.processType} ${form.processTypeName}`.trim()}
              readOnly
            />
          </FormRow>
          <FormRow label="製造No">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.productNo} readOnly />
          </FormRow>
          <FormRow label="ロット名">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.lotName} readOnly />
          </FormRow>
          <FormRow label="通称名">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.itemName} readOnly />
          </FormRow>
          <FormRow label="在庫重量">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.factory2Stock} readOnly />
          </FormRow>
          <FormRow label="摘要">
            <input
              className="mpEditInput"
              type="text"
              value={form.remarks}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
            />
          </FormRow>
          <FormRow label="分割日" required>
            <input
              className="mpEditInput date"
              type="date"
              value={form.divideDate}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, divideDate: e.target.value }))}
            />
          </FormRow>
          <FormRow label="事由">
            <input
              className="mpEditInput"
              type="text"
              value={form.reason}
              disabled={submitting}
              placeholder="転売時は転売先を入力"
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </FormRow>
          <FormRow label="分割重量" required>
            <input
              className="mpEditInput"
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
            />
          </FormRow>
          <FormRow label="分割ロット名" required>
            <input
              className="mpEditInput"
              type="text"
              value={form.divideLotName}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, divideLotName: e.target.value }))}
            />
          </FormRow>
        </div>
      </div>
    </EditModalOverlay>
  );
}
