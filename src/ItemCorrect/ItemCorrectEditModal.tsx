/**
 * 商品マスタ編集モーダル（ItemCorrect EditWindow 相当）
 * 選択UIは原料実績情報メンテナンス（ptEditSelect preset）に合わせる
 */
import { useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal";
import { masterTrItemsAtom } from "../repository/masterData";
import { refreshTrItems, upsertTrItem } from "../repositories/itemCorrectRepository";
import {
  ITEM_GROUP_OPTIONS,
  ORGANIC_CLASS_OPTIONS,
  SYSTEM_CLASS_OPTIONS,
  editFormToUpsertBody,
  itemCorrectIsMandatoryEmpty,
  validateItemCorrectEditForm,
  type ItemCorrectEditForm,
  type ItemCorrectEditMode,
  type ItemCorrectEditFieldErrors
} from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./itemCorrectEditModal.css";

type Props = {
  open: boolean;
  mode: ItemCorrectEditMode;
  initialForm: ItemCorrectEditForm;
  existingItemNos: ReadonlySet<number>;
  existingItemNames: ReadonlySet<string>;
  onClose: () => void;
};

type FormRowProps = {
  label: string;
  required?: boolean;
  /** 項目説明（ツールチップ） */
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

export function ItemCorrectEditModal({
  open,
  mode,
  initialForm,
  existingItemNos,
  existingItemNames,
  onClose
}: Props) {
  const setTrItems = useSetAtom(masterTrItemsAtom);
  const isCreate = mode === "create";
  const [form, setForm] = useState<ItemCorrectEditForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<ItemCorrectEditFieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setFieldErrors({});
    setError("");
  }, [open, initialForm]);

  const patch = (partial: Partial<ItemCorrectEditForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    const errors = validateItemCorrectEditForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("入力内容を確認してください");
      return;
    }

    const itemNo = Number(form.itemNo.trim());
    const itemName = form.itemName.trim();

    if (isCreate) {
      if (existingItemNos.has(itemNo)) {
        setError("指定された商品コードは既に登録済みです。");
        return;
      }
      if (existingItemNames.has(itemName)) {
        setError("入力した商品名は既に使用されております。");
        return;
      }
    }

    const confirmMsg = isCreate
      ? "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
      : "更新内容に間違いがないか確認してください。更新を実行します。よろしいですか？";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError("");
    try {
      await upsertTrItem(editFormToUpsertBody(form));
      setTrItems(await refreshTrItems());
      window.alert(isCreate ? "商品マスタの登録が正常に処理されました" : "商品マスタの更新が正常に処理されました");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = isCreate ? "商品マスタ編集（登録）" : "商品マスタ編集（変更）";
  const showRed = (key: Parameters<typeof itemCorrectIsMandatoryEmpty>[0]) =>
    itemCorrectIsMandatoryEmpty(key, form) || Boolean(fieldErrors[key]);
  const selectClass = () => `ptEditSelect preset`;
  const inputClass = (hasError?: boolean, readonly = false) =>
    `ptEditInput${readonly ? " ptEditInputDisabled" : ""}${hasError ? " inputError" : ""}`;

  return (
    <EditModalOverlay
      mode={isCreate ? "create" : "update"}
      onClose={onClose}
      className="ptEditOverlay itemCorrectEditOverlay"
    >
      <div
        className="ptEditPanel itemCorrectEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itemCorrectEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="itemCorrectEditTitle" className="ptEditPanelTitle">
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
              <input
                className={inputClass(showRed("itemNo"), !isCreate)}
                type="text"
                inputMode="numeric"
                value={form.itemNo}
                disabled={!isCreate}
                onChange={(e) => patch({ itemNo: e.target.value.replace(/[^\d]/g, "") })}
                aria-invalid={showRed("itemNo") || undefined}
                aria-label="商品No"
              />
            </FormRow>

            <FormRow label="商品区分" required tooltip="1:商品 2:仕上品">
              <select
                className={selectClass()}
                value={form.systemClass}
                onChange={(e) => patch({ systemClass: e.target.value })}
                title="1:商品 2:仕上品"
                aria-label="商品区分"
              >
                {SYSTEM_CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="有機区分" required tooltip="A:有機 B:無農薬 C:一般">
              <select
                className={selectClass()}
                value={form.organicClass}
                onChange={(e) => patch({ organicClass: e.target.value })}
                title="A:有機 B:無農薬 C:一般"
                aria-label="有機区分"
              >
                {ORGANIC_CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow
              label="商品分類"
              required
              tooltip="1:商品 3:仕上茶 4:仕入茶 5:委託品 6:ブレンド 7:委託支給品 9:卸 / 2,8:(指定不可)"
            >
              <select
                className={selectClass()}
                value={form.itemGroupNo}
                onChange={(e) => patch({ itemGroupNo: e.target.value })}
                title="1:商品 3:仕上茶 4:仕入茶 5:委託品 6:ブレンド 7:委託支給品 9:卸 / 2,8:(指定不可)"
                aria-label="商品分類"
              >
                {ITEM_GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="商品名" required>
              <input
                className={inputClass(showRed("itemName"))}
                type="text"
                value={form.itemName}
                onChange={(e) => patch({ itemName: e.target.value })}
                aria-invalid={showRed("itemName") || undefined}
                aria-label="商品名"
              />
            </FormRow>

            <FormRow label="JANコード">
              <input
                className={inputClass()}
                type="text"
                value={form.janCode}
                onChange={(e) => patch({ janCode: e.target.value })}
                aria-label="JANコード"
              />
            </FormRow>

            <FormRow label="梱包サイズ" required>
              <input
                className={inputClass()}
                type="text"
                inputMode="numeric"
                value={form.packageSize}
                onChange={(e) => patch({ packageSize: e.target.value.replace(/[^\d]/g, "") })}
                aria-label="梱包サイズ"
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

            <FormRow label="表示" required tooltip="✓:表示 □:非表示">
              <label className="itemCorrectDisplayCheck" title="✓:表示 □:非表示">
                <input
                  type="checkbox"
                  checked={form.display}
                  onChange={(e) => patch({ display: e.target.checked })}
                />
                表示する
              </label>
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
