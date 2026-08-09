/**
 * 振分実績一覧（PurchaseResaleList）… メニューから遷移する独立画面
 */
import { PurchaseResaleListContent } from "./PurchaseResaleListContent";
import "../Factory2LotManufacture/styles.css";
import "../MonthlyPlan/styles.css";
import "./purchaseResaleList.css";

export default function PurchaseResaleListPage() {
  return (
    <main className="page purchaseResaleListPage">
      <header className="toolbar">
        <h1 className="title">振分実績一覧</h1>
      </header>

      <PurchaseResaleListContent tableWrapClassName="tableWrap purchaseResaleListTableWrap" />
    </main>
  );
}
