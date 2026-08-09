/**
 * 仕上品仕入実績編集モーダル（EditWindow.xaml 相当）
 * レイアウトは仕入実績情報メンテナンス（PurchaseTtransfer Edit）風
 *
 * ① 登録ボタン … 登録モード時のみ活性
 * ② 更新ボタン … 更新モード時のみ活性（te_material_purchase のみ更新）
 * 更新モード: *仕入ロットNo・仕入先のみ編集可
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { masterTrConstantsAtom } from "../repository/masterData";
import {
  formatPurchaseDecimal2OnBlur,
  sanitizePurchaseDecimal2Input
} from "../PurchaseTtransfer/purchaseTtransferEditForm";
import { useBusyTask } from "../ui/useBusyTask";
import {
  createMaterialPurchaseAtom,
  updateMaterialPurchaseAtom,
  materialPurchaseMutationErrorAtom
} from "./store";
import type { MaterialPurchaseEditForm, MaterialPurchaseEditMode } from "./types";
import "./materialPurchaseEditModal.css";

type Props = {
  open: boolean;
  mode: MaterialPurchaseEditMode;
  initialForm: MaterialPurchaseEditForm;
  onClose: () => void;
  onRegistered?: (purchaseNo: number) => void;
  onUpdated?: (purchaseNo: number) => void;
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

/** WPF EditWindow 確認ダイアログ用（yyyy年MM月dd日） */
const formatPurchaseDateJa = (ymd: string): string => {
  const m = ymd.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return ymd;
  return `${m[1]}年${String(Number(m[2])).padStart(2, "0")}月${String(Number(m[3])).padStart(2, "0")}日`;
};

export function MaterialPurchaseEditModal({
  open,
  mode,
  initialForm,
  onClose,
  onRegistered,
  onUpdated
}: Props) {
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const runBusy = useBusyTask();
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const createPurchase = useSetAtom(createMaterialPurchaseAtom);
  const updatePurchase = useSetAtom(updateMaterialPurchaseAtom);
  const mutationError = useAtomValue(materialPurchaseMutationErrorAtom);
  const setMutationError = useSetAtom(materialPurchaseMutationErrorAtom);
  const [form, setForm] = useState<MaterialPurchaseEditForm>(initialForm);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...initialForm,
      purchaseDate: initialForm.purchaseDate || (isCreate ? todayYmd() : "")
    });
    setLocalError("");
    setMutationError(null);
    setSubmitting(false);
  }, [open, initialForm, isCreate, setMutationError]);

  if (!open) return null;

  const qty = Number(form.purchaseQuantity.replace(/,/g, ""));
  const lotEmpty = form.purchaseLotNo.trim() === "";
  const qtyEmpty = form.purchaseQuantity.trim() === "";
  const supplierEmpty = form.supplier.trim() === "";

  /** ① 登録ボタン：登録モード＋必須充足時のみ活性 */
  const canRegister =
    isCreate &&
    !submitting &&
    form.itemNo > 0 &&
    form.itemName.trim() !== "" &&
    form.purchaseDate.trim() !== "" &&
    !lotEmpty &&
    !qtyEmpty &&
    Number.isFinite(qty) &&
    qty > 0 &&
    !supplierEmpty;

  /** ② 更新ボタン：更新モード＋ロット／仕入先充足時のみ活性 */
  const canUpdate =
    isUpdate && !submitting && form.purchaseNo > 0 && form.itemNo > 0 && !lotEmpty && !supplierEmpty;

  /**
   * 登録モード：WPF EditWindowViewModel.Update（EditType=1）→ Insert/Regist
   * 確認は EditWindow 側の1回のみ（Repository 内の二重確認は踏襲しない）
   */
  const handleRegister = async () => {
    if (!isCreate || submitting) return;
    setLocalError("");
    setMutationError(null);

    if (!Number.isFinite(qty) || qty <= 0) {
      setLocalError("仕入れ量の指定が正しくありません");
      return;
    }

    const confirmLines = [
      `仕入日 : ${formatPurchaseDateJa(form.purchaseDate)}`,
      `商品名: ${form.itemName}`,
      `仕入ロットNo: ${form.purchaseLotNo}`,
      `仕入量: ${qty}`,
      `仕入先: ${form.supplier}`,
      "",
      "登録内容に間違いがないか確認してください。",
      "仕上品仕入登録を実行します。よろしいですか？"
    ].join("\n");

    if (!window.confirm(confirmLines)) {
      return;
    }

    const body = {
      purchase_date: form.purchaseDate.trim(),
      item_no: form.itemNo,
      item_name: form.itemName.trim(),
      purchase_lot_no: form.purchaseLotNo.trim(),
      purchase_quantity: qty,
      supplier: form.supplier.trim()
    };

    setSubmitting(true);
    try {
      const result = await runBusy(() => createPurchase(body), "仕入登録処理中…");
      if (!result.ok || result.purchaseNo == null) {
        return;
      }
      window.alert("仕上品の仕入が正常に処理されました");
      onRegistered?.(result.purchaseNo);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 更新モード：te_material_purchase のみ更新
   * （te_store_transfer / te_lot は更新しない）
   */
  const handleUpdate = async () => {
    if (!isUpdate || submitting) return;
    setLocalError("");
    setMutationError(null);

    if (form.purchaseNo <= 0) {
      setLocalError("仕入Noが不正です");
      return;
    }
    if (lotEmpty || supplierEmpty) {
      setLocalError("仕入ロットNo・仕入先を入力してください");
      return;
    }

    const confirmLines = [
      `仕入日 : ${formatPurchaseDateJa(form.purchaseDate)}`,
      `商品名: ${form.itemName}`,
      `仕入ロットNo: ${form.purchaseLotNo}`,
      `仕入量: ${form.purchaseQuantity}`,
      `仕入先: ${form.supplier}`,
      "",
      "登録内容に間違いがないか確認してください。",
      "仕上品仕入の変更を実行します。よろしいですか？"
    ].join("\n");

    if (!window.confirm(confirmLines)) {
      return;
    }

    const body = {
      purchase_no: form.purchaseNo,
      purchase_date: form.purchaseDate.trim(),
      item_no: form.itemNo,
      item_name: form.itemName.trim(),
      purchase_lot_no: form.purchaseLotNo.trim(),
      purchase_quantity: Number.isFinite(qty) && qty > 0 ? qty : Number(form.purchaseQuantity) || 0,
      supplier: form.supplier.trim()
    };

    setSubmitting(true);
    try {
      const result = await runBusy(() => updatePurchase(body), "仕入更新処理中…");
      if (!result.ok || result.purchaseNo == null) {
        return;
      }
      window.alert("仕入品の実績変更が正常に処理されました");
      onUpdated?.(result.purchaseNo);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const headerError = localError || mutationError || "";
  const lotRequired = true;
  const qtyRequired = isCreate;
  const supplierRequired = true;
  const showLotEmpty = lotEmpty;
  const showQtyEmpty = isCreate && qtyEmpty;
  const showSupplierEmpty = supplierEmpty;

  return (
    <EditModalOverlay mode={isCreate ? "create" : "update"} onClose={onClose} className="mpEditOverlay">
      <div
        className="mpEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="mp-edit-title" className="mpEditPanelTitle">
          仕上品仕入実績編集
          {isUpdate ? "（変更）" : ""}
        </h2>

        <div className="mpEditToolbar">
          <button
            type="button"
            disabled={!canRegister}
            onClick={() => void handleRegister()}
            title={
              isCreate
                ? canRegister
                  ? "仕入登録を実行"
                  : "必須項目を入力してください"
                : "登録モードでのみ使用できます"
            }
          >
            登録
          </button>
          <button
            type="button"
            disabled={!canUpdate}
            onClick={() => void handleUpdate()}
            title={
              isUpdate
                ? canUpdate
                  ? "仕入実績の変更を実行"
                  : "仕入ロットNo・仕入先を入力してください"
                : "更新モードでのみ使用できます"
            }
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
          <FormRow label="仕入日">
            <input
              className={`mpEditInput date${!isCreate ? " mpEditInputDisabled" : ""}`}
              type="date"
              value={form.purchaseDate}
              readOnly={isUpdate}
              disabled={isUpdate || submitting}
              onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))}
              aria-label="仕入日"
            />
          </FormRow>
          <FormRow label="商品No">
            <input
              className="mpEditInput mpEditInputDisabled"
              type="text"
              value={form.itemNo || ""}
              readOnly
              aria-label="商品No"
            />
          </FormRow>
          <FormRow label="仕入No">
            <input
              className="mpEditInput mpEditInputDisabled"
              type="text"
              value={form.purchaseNo || ""}
              readOnly
              aria-label="仕入No"
            />
          </FormRow>
          <FormRow label="商品名">
            <input
              className="mpEditInput mpEditInputDisabled"
              type="text"
              value={form.itemName}
              readOnly
              aria-label="商品名"
            />
          </FormRow>
          <FormRow label="仕入ロットNo" required={lotRequired}>
            <input
              className={`mpEditInput${showLotEmpty ? " mpEditMandatoryEmpty" : ""}`}
              type="text"
              value={form.purchaseLotNo}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, purchaseLotNo: e.target.value }))}
              autoComplete="off"
              aria-required={lotRequired}
              aria-invalid={showLotEmpty}
              aria-label="仕入ロットNo"
            />
          </FormRow>
          <FormRow label="仕入量" required={qtyRequired}>
            <input
              className={`mpEditInput numeric${showQtyEmpty ? " mpEditMandatoryEmpty" : ""}${
                isUpdate ? " mpEditInputDisabled" : ""
              }`}
              type="text"
              inputMode="decimal"
              value={form.purchaseQuantity}
              readOnly={isUpdate}
              disabled={isUpdate || submitting}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  purchaseQuantity: sanitizePurchaseDecimal2Input(e.target.value)
                }))
              }
              onBlur={() => {
                if (isUpdate) return;
                setForm((p) => ({
                  ...p,
                  purchaseQuantity: p.purchaseQuantity.trim()
                    ? formatPurchaseDecimal2OnBlur(p.purchaseQuantity)
                    : ""
                }));
              }}
              autoComplete="off"
              aria-required={qtyRequired}
              aria-invalid={showQtyEmpty}
              aria-label="仕入量"
            />
          </FormRow>
          <FormRow label="仕入先" required={supplierRequired}>
            <TrConstantZoomField
              value={form.supplier}
              onChange={(v) => setForm((p) => ({ ...p, supplier: v }))}
              constField="purchase3"
              title="仕入先"
              constants={trConstants}
              readOnly
              disabled={submitting}
              ariaLabel="仕入先"
              invalid={showSupplierEmpty}
              className={showSupplierEmpty ? "mpEditMandatoryEmpty" : undefined}
            />
          </FormRow>
        </div>
      </div>
    </EditModalOverlay>
  );
}
