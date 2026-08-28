/**
 * 月次販売計画のノート（摘要）入力モーダル
 */
import { useEffect, useState } from "react";
import { EditModalOverlay } from "../components/modal";
import type { MonthlySalesPlanRow } from "./types";
import "../PurchaseTtransfer/purchaseTtransferEditModal.css";
import "./monthlySalesPlanCorrectNoteModal.css";

type Props = {
  open: boolean;
  row: MonthlySalesPlanRow | null;
  busy?: boolean;
  onRegister: (remarks: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onClose: () => void;
};

export function MonthlySalesPlanCorrectNoteModal({
  open,
  row,
  busy = false,
  onRegister,
  onDelete,
  onClose
}: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setText(row.remarks);
    setError("");
    setSubmitting(false);
  }, [open, row]);

  if (!open || !row) return null;

  const disabled = busy || submitting;

  const handleRegister = async () => {
    setError("");
    if (!window.confirm("ノートを登録します。よろしいですか？")) return;
    setSubmitting(true);
    try {
      await onRegister(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    if (!window.confirm("ノートを削除します。よろしいですか？")) return;
    setSubmitting(true);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EditModalOverlay mode="update" onClose={onClose} className="ptEditOverlay monthlySalesPlanCorrectNoteOverlay">
      <div
        className="ptEditPanel monthlySalesPlanCorrectNotePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monthlySalesPlanCorrectNoteTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="monthlySalesPlanCorrectNoteTitle" className="ptEditPanelTitle">
          ノート
        </h2>
        <p className="monthlySalesPlanCorrectNoteMeta">
          {row.itemNo}　{row.itemName}
        </p>

        <div className="ptEditToolbar">
          <button type="button" disabled={disabled} onClick={() => void handleRegister()}>
            登録
          </button>
          <button type="button" disabled={disabled} onClick={() => void handleDelete()}>
            削除
          </button>
          <button type="button" disabled={disabled} onClick={onClose}>
            キャンセル
          </button>
        </div>

        {error ? <p className="ptEditError">{error}</p> : null}

        <label className="monthlySalesPlanCorrectNoteField">
          <span className="monthlySalesPlanCorrectNoteFieldLabel">摘要</span>
          <textarea
            className="monthlySalesPlanCorrectNoteTextarea"
            value={text}
            disabled={disabled}
            rows={8}
            onChange={(e) => setText(e.target.value)}
            aria-label="ノート"
          />
        </label>
      </div>
    </EditModalOverlay>
  );
}
