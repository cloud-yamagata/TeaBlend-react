/**
 * 振分実績一覧モーダル（仕入実績情報一覧の「振分一覧」ボタンから）
 */
import { EditModalOverlay } from "../components/modal";
import type { PurchaseTtransferRow } from "../PurchaseTtransfer/types";
import { PurchaseResaleListContent } from "./PurchaseResaleListContent";
import "../Factory2LotManufacture/styles.css";
import "../MonthlyPlan/styles.css";
import "./purchaseResaleList.css";

type Props = {
  open: boolean;
  onClose: () => void;
  contextRow: PurchaseTtransferRow | null;
};

export function PurchaseResaleListModal({ open, onClose, contextRow }: Props) {
  if (!open) return null;

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="purchaseResaleListOverlay">
      <div
        className="purchaseResaleListModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchaseResaleListTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="purchaseResaleListHeader">
          <h2 id="purchaseResaleListTitle">振分実績一覧</h2>
          <button type="button" className="purchaseResaleListClose" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <PurchaseResaleListContent contextRow={contextRow} autoSearchOnMount />
      </div>
    </EditModalOverlay>
  );
}
