/**
 * 振分実績一覧の検索条件パネル（MaterialListSearchPanel パターン）
 */
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import type { PurchaseResaleListTeaLifeFilter } from "./types";

export type PurchaseResaleListSearchDraft = {
  yearFilterEnabled: boolean;
  year: string;
  transfer: string;
  teaLifeFilter: PurchaseResaleListTeaLifeFilter;
  purchaseDate: string;
  limitToContext: boolean;
};

type Props = {
  draft: PurchaseResaleListSearchDraft;
  onDraftChange: (updater: (prev: PurchaseResaleListSearchDraft) => PurchaseResaleListSearchDraft) => void;
  contextPurchase: string | null;
  contextBidNo: string | null;
  searchEnabled: boolean;
  onSearch: () => void;
  onOpenTransferZoom: () => void;
};

export function PurchaseResaleListSearchPanel({
  draft,
  onDraftChange,
  contextPurchase,
  contextBidNo,
  searchEnabled,
  onSearch,
  onOpenTransferZoom
}: Props) {
  const setTeaLife = (key: keyof PurchaseResaleListTeaLifeFilter, checked: boolean) => {
    onDraftChange((prev) => ({
      ...prev,
      teaLifeFilter: { ...prev.teaLifeFilter, [key]: checked }
    }));
  };

  return (
    <section className="purchaseResaleListSearchPanel" aria-label="検索条件">
      <div className="purchaseResaleListSearchFields">
        <fieldset className="purchaseResaleListTeaLifeGroup purchaseResaleListSearchYearGroup">
          <legend>年度</legend>
          <label>
            <input
              type="checkbox"
              checked={draft.yearFilterEnabled}
              onChange={(e) =>
                onDraftChange((prev) => ({ ...prev, yearFilterEnabled: e.target.checked }))
              }
              aria-label="年度で絞り込む"
            />
          </label>
          <div
            className={`purchaseResaleListYearWrap${draft.yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!draft.yearFilterEnabled}
          >
            <Factory2MakeYearSpinner
              value={draft.year}
              onChange={(year) => onDraftChange((prev) => ({ ...prev, year }))}
            />
          </div>
        </fieldset>

        <div className="purchaseResaleListSearchField purchaseResaleListTransferGroup">
          <span className="factory2FieldLabel factory2FieldLabelCompact">振分先</span>
          <input
            className="purchaseResaleListTransferInput"
            type="text"
            value={draft.transfer}
            onChange={(e) => onDraftChange((prev) => ({ ...prev, transfer: e.target.value }))}
            autoComplete="off"
            aria-label="振分先"
          />
          <button type="button" className="zoomOpenButton" onClick={onOpenTransferZoom}>
            振分先
          </button>
        </div>

        <fieldset className="purchaseResaleListTeaLifeGroup">
          <legend>茶期</legend>
          <label>
            <input type="checkbox" checked={draft.teaLifeFilter.tea1} onChange={(e) => setTeaLife("tea1", e.target.checked)} />
            1茶
          </label>
          <label>
            <input type="checkbox" checked={draft.teaLifeFilter.tea2} onChange={(e) => setTeaLife("tea2", e.target.checked)} />
            2茶
          </label>
          <label>
            <input type="checkbox" checked={draft.teaLifeFilter.tea3} onChange={(e) => setTeaLife("tea3", e.target.checked)} />
            3茶
          </label>
          <label>
            <input type="checkbox" checked={draft.teaLifeFilter.tea4} onChange={(e) => setTeaLife("tea4", e.target.checked)} />
            4茶
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.teaLifeFilter.bancha}
              onChange={(e) => setTeaLife("bancha", e.target.checked)}
            />
            番茶
          </label>
          <label>
            <input type="checkbox" checked={draft.teaLifeFilter.aki} onChange={(e) => setTeaLife("aki", e.target.checked)} />
            秋番
          </label>
        </fieldset>

        <div className="purchaseResaleListSearchField">
          <span className="factory2FieldLabel factory2FieldLabelCompact">仕入日</span>
          <input
            className="factory2TextInput date factory2DateCompact"
            type="date"
            value={draft.purchaseDate}
            onChange={(e) => onDraftChange((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            aria-label="仕入日"
          />
        </div>

        {contextPurchase && contextBidNo ? (
          <label className="purchaseResaleListContextLimit">
            <input
              type="checkbox"
              checked={draft.limitToContext}
              onChange={(e) => onDraftChange((prev) => ({ ...prev, limitToContext: e.target.checked }))}
            />
            選択行に限定（{contextPurchase} / {contextBidNo}）
          </label>
        ) : null}

        <button
          type="button"
          className="factory2DarkButton"
          disabled={!searchEnabled}
          onClick={onSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、振分先・茶期・仕入日のいずれかを指定してください"
          }
        >
          検索
        </button>
      </div>
    </section>
  );
}
