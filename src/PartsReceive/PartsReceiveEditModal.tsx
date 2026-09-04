/**
 * 仕上品受入実績編集モーダル（WPF EditWindow 相当）
 * レイアウトは MaterialPurchase 編集モーダルを踏襲
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import {
  formatPurchaseDecimal2OnBlur,
  sanitizePurchaseDecimal2Input
} from "../PurchaseTtransfer/purchaseTtransferEditForm";
import { useBusyTask } from "../ui/useBusyTask";
import { partsReceiveMutationErrorAtom, receivePartsReceiveAtom } from "./store";
import type { PartsReceiveEditForm } from "./types";
import "../MaterialPurchase/materialPurchaseEditModal.css";

type Props = {
  open: boolean;
  initialForm: PartsReceiveEditForm;
  onClose: () => void;
  onReceived?: () => void;
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

export function PartsReceiveEditModal({ open, initialForm, onClose, onReceived }: Props) {
  const runBusy = useBusyTask();
  const receiveParts = useSetAtom(receivePartsReceiveAtom);
  const mutationError = useAtomValue(partsReceiveMutationErrorAtom);
  const setMutationError = useSetAtom(partsReceiveMutationErrorAtom);
  const [form, setForm] = useState<PartsReceiveEditForm>(initialForm);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...initialForm,
      transferDate: initialForm.transferDate || todayYmd()
    });
    setLocalError("");
    setMutationError(null);
    setSubmitting(false);
  }, [open, initialForm, setMutationError]);

  if (!open) return null;

  const qty = Number(form.transferQuantity.replace(/,/g, ""));
  const qtyEmpty = form.transferQuantity.trim() === "";
  const dateEmpty = form.transferDate.trim() === "";
  const factoryEmpty = form.storeNo !== 2 && form.storeNo !== 3;

  const canUpdate =
    !submitting &&
    form.itemNo > 0 &&
    form.productNo > 0 &&
    !factoryEmpty &&
    !dateEmpty &&
    !qtyEmpty &&
    Number.isFinite(qty) &&
    qty > 0;

  const handleUpdate = async () => {
    if (submitting) return;
    setLocalError("");
    setMutationError(null);

    if (factoryEmpty) {
      setLocalError("受入先の工場が指定されておりません");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setLocalError("移動量の指定が正しくありません");
      return;
    }

    const f2 = Number(form.factory2Stock.replace(/,/g, ""));
    const f3 = Number(form.factory3Stock.replace(/,/g, ""));

    if (form.storeNo === 3 && qty > f2) {
      setLocalError("第二工場の在庫量に対し受入れ量の指定が正しくありません");
      return;
    }
    if (form.storeNo === 2 && qty > f3) {
      setLocalError("第三工場の在庫量に対し受入れ量の指定が正しくありません");
      return;
    }

    if (
      !window.confirm(
        "受入れ内容に間違いがないか確認してください。受入れを実行します。よろしいですか？"
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await runBusy(
        () =>
          receiveParts({
            item_no: form.itemNo,
            product_no: form.productNo,
            transfer_quantity: qty,
            transfer_date: form.transferDate.trim(),
            store_no: form.storeNo as 2 | 3
          }),
        "受入処理中…"
      );
      if (!result.ok) return;
      window.alert("仕上茶の受入が正常に処理されました");
      onReceived?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const headerError = localError || mutationError || "";

  return (
    <EditModalOverlay mode="update" onClose={onClose} className="mpEditOverlay">
      <div
        className="mpEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-edit-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(420px, calc(100vw - 32px))" }}
      >
        <h2 id="pr-edit-title" className="mpEditPanelTitle">
          仕上品受入実績編集
        </h2>

        <div className="mpEditToolbar">
          <button
            type="button"
            disabled={!canUpdate}
            onClick={() => void handleUpdate()}
            title={canUpdate ? "受入を実行" : "移動先・移動日・移動量を入力してください"}
          >
            更新
          </button>
          <button type="button" disabled={submitting} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {headerError ? (
          <p className="mpEditError" role="alert">
            {headerError}
          </p>
        ) : null}

        <div className="mpEditForm">
          <FormRow label="製造日">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.productDate} readOnly />
          </FormRow>
          <FormRow label="商品No">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.itemNo || ""} readOnly />
          </FormRow>
          <FormRow label="製造No">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.productNo || ""} readOnly />
          </FormRow>
          <FormRow label="商品名">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.itemName} readOnly />
          </FormRow>
          <FormRow label="年">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.makeYear} readOnly />
          </FormRow>
          <FormRow label="回数">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.count} readOnly />
          </FormRow>
          <FormRow label="生産量">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.productQuantity} readOnly />
          </FormRow>
          <FormRow label="第2工場">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.factory2Stock} readOnly />
          </FormRow>
          <FormRow label="第3工場">
            <input className="mpEditInput mpEditInputDisabled" type="text" value={form.factory3Stock} readOnly />
          </FormRow>
          <FormRow label="移動先">
            <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "0 6px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="parts-receive-store"
                  checked={form.storeNo === 2}
                  disabled={submitting}
                  onChange={() => setForm((p) => ({ ...p, storeNo: 2 }))}
                />
                第2工場
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="parts-receive-store"
                  checked={form.storeNo === 3}
                  disabled={submitting}
                  onChange={() => setForm((p) => ({ ...p, storeNo: 3 }))}
                />
                第3工場
              </label>
            </div>
          </FormRow>
          <FormRow label="移動日" required>
            <input
              className="mpEditInput date"
              type="date"
              value={form.transferDate}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, transferDate: e.target.value }))}
              aria-label="移動日"
            />
          </FormRow>
          <FormRow label="移動量" required>
            <input
              className="mpEditInput"
              type="text"
              inputMode="decimal"
              value={form.transferQuantity}
              disabled={submitting}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  transferQuantity: sanitizePurchaseDecimal2Input(e.target.value)
                }))
              }
              onBlur={() =>
                setForm((p) => ({
                  ...p,
                  transferQuantity: formatPurchaseDecimal2OnBlur(p.transferQuantity)
                }))
              }
              aria-label="移動量"
            />
          </FormRow>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#475569" }}>
          仕上品を受入れる工場を指定（第2＝返品 / 第3＝受入）
        </p>
      </div>
    </EditModalOverlay>
  );
}
