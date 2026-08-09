/**
 * 直送先マスタ編集モーダル（ShipmentCorrect EditWindow 相当）
 */
import { useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { upsertTrDirectShipment } from "../repositories/shipmentCorrectRepository";
import { refreshShipmentCorrectMasterAtom } from "./refreshShipmentCorrectMaster";
import {
  editFormToUpsertBody,
  shipmentCorrectIsMandatoryEmpty,
  validateShipmentCorrectEditForm,
  type ShipmentCorrectEditForm,
  type ShipmentCorrectEditMode,
  type ShipmentCorrectEditFieldErrors
} from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./shipmentCorrectEditModal.css";

type Props = {
  open: boolean;
  mode: ShipmentCorrectEditMode;
  initialForm: ShipmentCorrectEditForm;
  existingShipmentNos: ReadonlySet<number>;
  onClose: () => void;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: ReactNode;
};

function FormRow({ label, required = false, tooltip, children }: FormRowProps) {
  const labelText = required ? `*${label}` : label;
  return (
    <div className="ptEditRow">
      <div
        className={`ptEditLabelCell${required ? " required" : ""}`}
        title={tooltip || undefined}
      >
        <span className="ptEditLabelText">{labelText}</span>
      </div>
      <div className="ptEditValueCell">{children}</div>
    </div>
  );
}

export function ShipmentCorrectEditModal({
  open,
  mode,
  initialForm,
  existingShipmentNos,
  onClose
}: Props) {
  const refreshMaster = useSetAtom(refreshShipmentCorrectMasterAtom);
  const isCreate = mode === "create";
  const [form, setForm] = useState<ShipmentCorrectEditForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<ShipmentCorrectEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setFieldErrors({});
    setError("");
  }, [open, initialForm]);

  const patch = (partial: Partial<ShipmentCorrectEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    const errors = validateShipmentCorrectEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const shipmentNo = Number(form.directShipmentNo.trim());

    if (isCreate && existingShipmentNos.has(shipmentNo)) {
      setError("指定された直送先Noは既に登録済みです。");
      return;
    }

    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      await upsertTrDirectShipment(editFormToUpsertBody(form));
      await refreshMaster();
      window.alert(
        isCreate ? "直送先マスタの登録が正常に処理されました" : "直送先マスタの更新が正常に処理されました"
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = isCreate ? "直送先マスタ編集（登録）" : "直送先マスタ編集（変更）";
  const showRed = (key: Parameters<typeof shipmentCorrectIsMandatoryEmpty>[0]) =>
    shipmentCorrectIsMandatoryEmpty(key, form) || Boolean(fieldErrors[key]);
  const inputClass = (hasError?: boolean, readonly = false) =>
    `ptEditInput${readonly ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;

  return (
    <EditModalOverlay
      mode={isCreate ? "create" : "update"}
      onClose={onClose}
      className="ptEditOverlay shipmentCorrectEditOverlay"
    >
      <div
        className="ptEditPanel shipmentCorrectEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipmentCorrectEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shipmentCorrectEditTitle" className="ptEditPanelTitle">
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
            <FormRow label="直送先No" required>
              <input
                className={inputClass(showRed("directShipmentNo"), !isCreate)}
                type="text"
                inputMode="numeric"
                value={form.directShipmentNo}
                disabled={!isCreate}
                onChange={(e) => patch({ directShipmentNo: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("directShipmentNo") || undefined}
                aria-label="直送先No"
              />
            </FormRow>

            <FormRow label="直送先名" required>
              <input
                className={inputClass(showRed("directShipmentName"))}
                type="text"
                value={form.directShipmentName}
                onChange={(e) => patch({ directShipmentName: e.target.value })}
                aria-invalid={showRed("directShipmentName") || undefined}
                aria-label="直送先名"
              />
            </FormRow>

            <FormRow label="直送先カナ">
              <input
                className={inputClass()}
                type="text"
                value={form.directShipmentKana}
                onChange={(e) => patch({ directShipmentKana: e.target.value })}
                aria-label="直送先カナ"
              />
            </FormRow>

            <FormRow label="郵便番号">
              <input
                className={inputClass()}
                type="text"
                value={form.zip}
                onChange={(e) => patch({ zip: e.target.value })}
                aria-label="郵便番号"
              />
            </FormRow>

            <FormRow label="住所">
              <input
                className={inputClass()}
                type="text"
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
                aria-label="住所"
              />
            </FormRow>

            <FormRow label="電話番号">
              <input
                className={inputClass()}
                type="text"
                value={form.phoneNo}
                onChange={(e) => patch({ phoneNo: e.target.value })}
                aria-label="電話番号"
              />
            </FormRow>

            <FormRow label="FAX番号">
              <input
                className={inputClass()}
                type="text"
                value={form.faxNo}
                onChange={(e) => patch({ faxNo: e.target.value })}
                aria-label="FAX番号"
              />
            </FormRow>

            <FormRow label="表示順" required tooltip="0～9:値が小さい程画面上部に表示">
              <input
                className={inputClass()}
                type="text"
                inputMode="numeric"
                value={form.displayOrder}
                onChange={(e) => patch({ displayOrder: e.target.value.replace(/[^\d]/g, "") })}
                title="0～9:値が小さい程画面上部に表示"
                aria-label="表示順"
              />
            </FormRow>

            <FormRow label="備考">
              <input
                className={inputClass()}
                type="text"
                value={form.remarks}
                onChange={(e) => patch({ remarks: e.target.value })}
                aria-label="備考"
              />
            </FormRow>
          </div>
        </div>
      </div>
    </EditModalOverlay>
  );
}
