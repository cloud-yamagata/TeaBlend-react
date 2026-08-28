/**
 * レポート判定セルから開く摘要の参照ポップアップ
 */
import { EditModalOverlay } from "../../components/modal";
import "../../PurchaseTtransfer/purchaseTtransferEditModal.css";

export type ReportRemarksPopupState = {
  itemName: string;
  yearMonth: string;
  remarks: string;
};

type Props = {
  open: boolean;
  data: ReportRemarksPopupState | null;
  onClose: () => void;
};

export function ReportRemarksPopup({ open, data, onClose }: Props) {
  if (!open || !data) return null;

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="ptEditOverlay reportRemarksOverlay">
      <div
        className="ptEditPanel reportRemarksPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reportRemarksTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reportRemarksTitle" className="ptEditPanelTitle">
          摘要
        </h2>
        <p className="reportRemarksMeta">
          {data.yearMonth}
          {data.itemName ? `　${data.itemName}` : ""}
        </p>
        <div className="ptEditToolbar">
          <button type="button" onClick={onClose}>
            閉じる
          </button>
        </div>
        <pre className="reportRemarksBody">{data.remarks}</pre>
      </div>
    </EditModalOverlay>
  );
}
