/**
 * 販売計画商品マスタ編集モーダル
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { TrItemMasterZoomModal } from "../components/TrItemMasterZoomModal";
import { masterEntityCacheAtom, masterTrItemsAtom } from "../repository/masterData";
import { upsertTrSalesPlanItem } from "../repositories/salesPlanItemCorrectRepository";
import { refreshSalesPlanItemCorrectMasterAtom } from "./refreshSalesPlanItemCorrectMaster";
import {
  editFormToUpsertBody,
  lookupTrItemDisplay,
  salesPlanItemCorrectIsMandatoryEmpty,
  validateSalesPlanItemCorrectEditForm,
  type SalesPlanItemCorrectEditForm,
  type SalesPlanItemCorrectEditMode,
  type SalesPlanItemCorrectEditFieldErrors
} from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./salesPlanItemCorrectEditModal.css";

type Props = {
  open: boolean;
  mode: SalesPlanItemCorrectEditMode;
  initialForm: SalesPlanItemCorrectEditForm;
  existingItemNos: ReadonlySet<number>;
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

export function SalesPlanItemCorrectEditModal({
  open,
  mode,
  initialForm,
  existingItemNos,
  onClose
}: Props) {
  const refreshMaster = useSetAtom(refreshSalesPlanItemCorrectMasterAtom);
  const items = useAtomValue(masterTrItemsAtom);
  const groups = useAtomValue(masterEntityCacheAtom).tr_item_group;
  const isCreate = mode === "create";
  const [form, setForm] = useState<SalesPlanItemCorrectEditForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<SalesPlanItemCorrectEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [itemZoomOpen, setItemZoomOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setFieldErrors({});
    setError("");
    setItemZoomOpen(false);
  }, [open, initialForm]);

  const applyItemNo = (itemNoText: string) => {
    const trimmed = itemNoText.replace(/[^\d]/g, "");
    if (!trimmed) {
      setForm((prev) => ({
        ...prev,
        itemNo: "",
        itemName: "",
        packageSize: "",
        itemGroupName: ""
      }));
      return;
    }
    const lookup = lookupTrItemDisplay(Number(trimmed), items, groups);
    setForm((prev) => ({
      ...prev,
      itemNo: trimmed,
      itemName: lookup.itemName,
      packageSize: lookup.found ? String(lookup.packageSize) : "",
      itemGroupName: lookup.itemGroupName
    }));
  };

  const handleSubmit = async () => {
    const errors = validateSalesPlanItemCorrectEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const itemNo = Number(form.itemNo.trim());
    const lookup = lookupTrItemDisplay(itemNo, items, groups);
    if (!lookup.found) {
      setError("商品マスタに存在しない商品Noです。");
      return;
    }

    if (isCreate && existingItemNos.has(itemNo)) {
      setError("指定された商品Noは既に登録済みです。");
      return;
    }

    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      await upsertTrSalesPlanItem(editFormToUpsertBody(form));
      await refreshMaster();
      window.alert(
        isCreate
          ? "販売計画商品マスタの登録が正常に処理されました"
          : "販売計画商品マスタの更新が正常に処理されました"
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = isCreate ? "販売計画商品マスタ編集（登録）" : "販売計画商品マスタ編集（変更）";
  const showRed = (key: Parameters<typeof salesPlanItemCorrectIsMandatoryEmpty>[0]) =>
    salesPlanItemCorrectIsMandatoryEmpty(key, form) || Boolean(fieldErrors[key]);
  const inputClass = (hasError?: boolean, readonly = false) =>
    `ptEditInput${readonly ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;

  return (
    <>
      <EditModalOverlay
        mode={isCreate ? "create" : "update"}
        onClose={onClose}
        className="ptEditOverlay salesPlanItemCorrectEditOverlay"
      >
        <div
          className="ptEditPanel salesPlanItemCorrectEditPanel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="salesPlanItemCorrectEditTitle"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="salesPlanItemCorrectEditTitle" className="ptEditPanelTitle">
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
              <FormRow label="商品No" required>
                <div className="salesPlanItemNoZoom">
                  <input
                    className={inputClass(showRed("itemNo"), !isCreate)}
                    type="text"
                    inputMode="numeric"
                    value={form.itemNo}
                    disabled={!isCreate}
                    onChange={(e) => applyItemNo(e.target.value)}
                    aria-invalid={showRed("itemNo") || undefined}
                    aria-label="商品No"
                  />
                  {isCreate ? (
                    <button
                      type="button"
                      className="zoomOpenButton"
                      disabled={submitting}
                      onClick={() => setItemZoomOpen(true)}
                    >
                      商品
                    </button>
                  ) : null}
                </div>
              </FormRow>

              <FormRow label="商品名">
                <input
                  className={inputClass(false, true)}
                  type="text"
                  value={form.itemName}
                  readOnly
                  tabIndex={-1}
                  aria-label="商品名"
                />
              </FormRow>

              <FormRow label="梱包サイズ">
                <input
                  className={inputClass(false, true)}
                  type="text"
                  value={form.packageSize}
                  readOnly
                  tabIndex={-1}
                  aria-label="梱包サイズ"
                />
              </FormRow>

              <FormRow label="商品分類名">
                <input
                  className={inputClass(false, true)}
                  type="text"
                  value={form.itemGroupName}
                  readOnly
                  tabIndex={-1}
                  aria-label="商品分類名"
                />
              </FormRow>

              <FormRow label="表示順" required tooltip="0～9:値が小さい程画面上部に表示">
                <input
                  className={inputClass(Boolean(fieldErrors.displayOrder))}
                  type="text"
                  inputMode="numeric"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, displayOrder: e.target.value.replace(/[^\d]/g, "") }))
                  }
                  title="0～9:値が小さい程画面上部に表示"
                  aria-label="表示順"
                />
              </FormRow>

              <FormRow label="表示" required tooltip="✓:表示 □:非表示">
                <label className="salesPlanItemDisplayCheck" title="✓:表示 □:非表示">
                  <input
                    type="checkbox"
                    checked={form.display}
                    onChange={(e) => setForm((prev) => ({ ...prev, display: e.target.checked }))}
                  />
                  表示する
                </label>
              </FormRow>

              <FormRow label="摘要">
                <input
                  className={inputClass()}
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  aria-label="摘要"
                />
              </FormRow>
            </div>
          </div>
        </div>
      </EditModalOverlay>

      <TrItemMasterZoomModal
        open={itemZoomOpen}
        onClose={() => setItemZoomOpen(false)}
        initialCode={form.itemNo}
        initialName={form.itemName}
        filterParams={{ systemClass: "1" }}
        onSelect={(code) => {
          applyItemNo(code);
          setItemZoomOpen(false);
        }}
      />
    </>
  );
}
