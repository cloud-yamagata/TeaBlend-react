/**
 * 仕入受入実績一覧モーダル（PurchaseReceive SubWindow.xaml 相当）
 */
import { useMemo } from "react";
import { EditModalOverlay } from "../components/modal";
import { buildPurchaseReceiveDetails } from "./buildPurchaseReceiveList";
import type { PurchaseReceiveRow } from "./types";
import { masterEntityCacheAtom } from "../repository/masterData";
import { useAtomValue } from "jotai";

type Props = {
  open: boolean;
  onClose: () => void;
  contextRow: PurchaseReceiveRow | null;
};

const toDateText = (value: string): string => {
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const fmt2 = (n: number): string =>
  new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmt0 = (n: number): string => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(n);

export function PurchaseReceiveSubModal({ open, onClose, contextRow }: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);

  const detailRows = useMemo(() => {
    if (!contextRow) return [];
    return buildPurchaseReceiveDetails(cache, contextRow.year, contextRow.purchase, contextRow.bidNo);
  }, [cache, contextRow]);

  if (!open || !contextRow) return null;

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="purchaseReceiveOverlay">
      <div
        className="purchaseReceiveSubModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchaseReceiveSubTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="purchaseReceiveSubHeader">
          <h2 id="purchaseReceiveSubTitle">仕入受入実績一覧</h2>
          <button type="button" className="purchaseReceiveSubClose" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <p className="purchaseReceiveHint">
          {contextRow.purchase} / {contextRow.bidNo} … {detailRows.length} 件
        </p>

        <div className="purchaseReceiveSubToolbar">
          <button type="button" className="factory2DarkButton" disabled title="未実装">
            登録
          </button>
          <button type="button" className="factory2DarkButton" disabled title="未実装">
            変更
          </button>
          <button type="button" className="factory2DarkButton" disabled title="未実装">
            削除
          </button>
        </div>

        {detailRows.length === 0 ? (
          <p className="purchaseReceiveSubEmpty">受入実績がありません</p>
        ) : (
          <div className="purchaseReceiveSubTableWrap">
            <table className="purchaseReceiveSubTable">
              <thead>
                <tr>
                  <th>年度</th>
                  <th>仕入先</th>
                  <th>入札NO</th>
                  <th>受入日</th>
                  <th>梱包重量</th>
                  <th>梱包数</th>
                  <th>端数重量</th>
                  <th>端数</th>
                  <th>移動重量</th>
                  <th>備考</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row) => (
                  <tr key={row.id}>
                    <td className="num">{row.year >= 100 ? row.year % 100 : row.year}</td>
                    <td>{row.purchase}</td>
                    <td>{row.bidNo}</td>
                    <td>{toDateText(row.receiveDate)}</td>
                    <td className="num">{fmt2(row.unitWeight)}</td>
                    <td className="num">{fmt0(row.unitNumber)}</td>
                    <td className="num">{fmt2(row.fractionWeight)}</td>
                    <td className="num">{fmt0(row.fractionNumber)}</td>
                    <td className="num">{fmt2(row.transferQuantity)}</td>
                    <td>{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EditModalOverlay>
  );
}
