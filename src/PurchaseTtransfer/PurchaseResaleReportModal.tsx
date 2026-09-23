/**
 * 転売リスト条件設定（旧 ReportCondWindow.xaml）
 */
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { EditModalOverlay } from "../components/modal";
import { TrConstantZoomField } from "../components/TrConstantZoomField";
import { matchesPurchaseTeaYear } from "./purchaseTtransferSearchCriteria";
import { masterEntityCacheAtom, masterTrConstantsAtom } from "../repository/masterData";
import {
  exportPurchaseResaleReportExcel,
  type PurchaseResaleReportKind,
  type PurchaseResaleReportRow
} from "./exportPurchaseResaleReportExcel";
import "./purchaseTtransferEditModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  year: string;
};

const sameOrAfter = (value: string, from: string): boolean => {
  if (!from) return true;
  return value.slice(0, 10) >= from;
};

const sameOrBefore = (value: string, to: string): boolean => {
  if (!to) return true;
  return value.slice(0, 10) <= to;
};

export function PurchaseResaleReportModal({ open, onClose, year }: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);
  const [transfer, setTransfer] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const teaByKey = useMemo(() => {
    const map = new Map<string, (typeof cache.te_purchase_tea)[number]["data"]>();
    for (const tea of cache.te_purchase_tea) {
      const d = tea.data;
      map.set(`${d.year}|${d.purchase}|${d.bid_no}`, d);
    }
    return map;
  }, [cache.te_purchase_tea]);

  const buildRows = useCallback(
    (kind: PurchaseResaleReportKind): PurchaseResaleReportRow[] => {
      const transferFilter = transfer.trim();
      const rows: PurchaseResaleReportRow[] = [];
      for (const entity of cache.te_purchase_transfer) {
        const t = entity.data;
        if (kind === "resale" && t.result_type !== "2") continue;
        const tea = teaByKey.get(`${t.year}|${t.purchase}|${t.bid_no}`);
        if (!tea) continue;
        if (kind === "organic" && (tea.grade ?? "") !== "有機") continue;
        if (year && !matchesPurchaseTeaYear(t.year, year)) continue;
        if (transferFilter && t.transfer !== transferFilter) continue;
        const date = kind === "resale" ? t.transfer_date : tea.purchase_date;
        if (!sameOrAfter(date, fromDate) || !sameOrBefore(date, toDate)) continue;
        rows.push({
          year: t.year,
          transfer: t.transfer,
          purchase: t.purchase,
          bidNo: t.bid_no,
          date,
          variety: tea.variety ?? "",
          teaLife: tea.tea_life ?? "",
          grade: tea.grade ?? "",
          teaType: tea.tea_type ?? "",
          teaRank: tea.tea_rank ?? "",
          fieldNo: tea.field_no ?? "",
          producer: tea.producer ?? "",
          unitWeight: t.unit_weight,
          unitNumber: t.unit_number,
          fractionWeight: t.fraction_weight,
          fractionNumber: t.fraction_number,
          cost: tea.cost,
          discount: tea.discount,
          unitPrice: t.unit_price,
          targetPlan: tea.target_plan ?? "",
          lotNo: tea.lot_no?.trim() ?? ""
        });
      }
      rows.sort((a, b) => {
        const transferCmp = a.transfer.localeCompare(b.transfer, "ja");
        if (transferCmp !== 0) return transferCmp;
        const dateCmp = a.date.localeCompare(b.date, "ja");
        if (dateCmp !== 0) return dateCmp;
        return a.bidNo.localeCompare(b.bidNo, "ja", { numeric: true });
      });
      return rows;
    },
    [cache.te_purchase_transfer, fromDate, teaByKey, toDate, transfer, year]
  );

  const handleExport = useCallback(
    async (kind: PurchaseResaleReportKind) => {
      setError("");
      const rows = buildRows(kind);
      if (rows.length === 0) {
        setError("対象データがありません");
        return;
      }
      setExporting(true);
      try {
        await exportPurchaseResaleReportExcel(kind, rows);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setExporting(false);
      }
    },
    [buildRows, onClose]
  );

  if (!open) return null;

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="ptEditOverlay">
      <div
        className="ptEditPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ptResaleReportTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ptResaleReportTitle" className="ptEditPanelTitle">
          転売リスト条件設定
        </h2>
        <div className="ptEditToolbar">
          <button type="button" disabled={exporting} onClick={() => void handleExport("resale")}>
            転売リスト
          </button>
          <button type="button" disabled={exporting} onClick={() => void handleExport("organic")}>
            紐付リスト
          </button>
          <button type="button" disabled={exporting} onClick={onClose}>
            キャンセル
          </button>
        </div>
        <div className="ptEditForm">
          <div className="ptEditRow">
            <div className="ptEditLabelCell required">
              <span className="ptEditLabelText">年度</span>
            </div>
            <div className="ptEditValueCell">
              <input className="ptEditInput ptEditInputDisabled" type="text" value={year} disabled readOnly aria-label="年度" />
            </div>
          </div>
          <div className="ptEditRow">
            <div className="ptEditLabelCell">
              <span className="ptEditLabelText">転売先</span>
            </div>
            <div className="ptEditValueCell">
              <TrConstantZoomField
                value={transfer}
                onChange={setTransfer}
                constField="transfer"
                title="システム定数（転売先）"
                constants={trConstants}
                ariaLabel="転売先"
                disabled={exporting}
              />
            </div>
          </div>
          <div className="ptEditRow">
            <div className="ptEditLabelCell">
              <span className="ptEditLabelText">開始日</span>
            </div>
            <div className="ptEditValueCell">
              <input
                className="ptEditInput date"
                type="date"
                value={fromDate}
                disabled={exporting}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="開始日"
              />
            </div>
          </div>
          <div className="ptEditRow">
            <div className="ptEditLabelCell">
              <span className="ptEditLabelText">終了日</span>
            </div>
            <div className="ptEditValueCell">
              <input
                className="ptEditInput date"
                type="date"
                value={toDate}
                disabled={exporting}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="終了日"
              />
            </div>
          </div>
        </div>
        {error ? <p className="ptEditError">{error}</p> : null}
      </div>
    </EditModalOverlay>
  );
}
