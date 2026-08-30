/**
 * 仕上品仕入の検索条件パネル
 * - 年度: fieldset + チェック + Factory2MakeYearSpinner
 * - 商品No／商品名: ZOOM 選択のみ（手入力不可）
 * - 仕入先: tr_constant const_field=purchase3 の ZOOM 選択のみ
 */
import { useState } from "react";
import { useAtom } from "jotai";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { isMaterialPurchaseSearchEnabled } from "./buildMaterialPurchaseList";
import { materialPurchaseSearchDraftAtom, type MaterialPurchaseSearchFilters } from "./store";
import "../Factory2LotManufacture/factory2LotEditModal.css";

type Props = {
  onSearch: (filters: MaterialPurchaseSearchFilters) => void;
  onOpenItemZoom: () => void;
  onOpenSupplierZoom: () => void;
};

export function MaterialPurchaseSearchPanel({
  onSearch,
  onOpenItemZoom,
  onOpenSupplierZoom
}: Props) {
  const [draft, setDraft] = useAtom(materialPurchaseSearchDraftAtom);
  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);
  const yearValue = draft.year ?? getDefaultMakeYear();
  const searchEnabled = isMaterialPurchaseSearchEnabled(
    { ...draft, year: yearValue },
    yearFilterEnabled
  );

  const handleSearch = () => {
    onSearch({
      ...draft,
      year: yearFilterEnabled ? normalizeMakeYearFromForm(yearValue) : null
    });
  };

  return (
    <section className="materialPurchaseSearchRow" aria-label="検索条件">
      <fieldset className="materialPurchaseFilterGroup materialPurchaseSearchYearGroup">
        <legend>年度</legend>
        <label>
          <input
            type="checkbox"
            checked={yearFilterEnabled}
            onChange={(e) => setYearFilterEnabled(e.target.checked)}
            aria-label="年度で絞り込む"
          />
        </label>
        <div
          className={`materialPurchaseMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
          aria-disabled={!yearFilterEnabled}
        >
          <Factory2MakeYearSpinner
            value={yearValue}
            onChange={(year) => setDraft((p) => ({ ...p, year }))}
          />
        </div>
      </fieldset>

      <div className="searchFieldItemZoomGroup materialPurchaseItemZoomGroup">
        <label className="searchField">
          <span className="searchFieldLabel">商品No</span>
          <input
            className="searchControl searchControlItemNo searchControlReadonly"
            type="text"
            value={draft.itemNo}
            readOnly
            tabIndex={-1}
            placeholder="（ZOOMで選択）"
            aria-label="商品No"
            title="商品名ZOOMで選択してください"
          />
        </label>
        <label className="searchField">
          <span className="searchFieldLabel">商品名</span>
          <input
            className="searchControl searchControlItemName searchControlReadonly"
            type="text"
            value={draft.itemName}
            readOnly
            tabIndex={-1}
            placeholder="（商品名を選択してください）"
            aria-label="商品名"
            title="商品名ZOOMで選択してください"
          />
        </label>
        <div className="searchField searchFieldZoomButtonWrap">
          <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
          <button type="button" className="zoomOpenButton" onClick={onOpenItemZoom}>
            商品名
          </button>
        </div>
      </div>

      <label className="searchField materialPurchaseSearchDateField">
        <span className="searchFieldLabel">仕入日</span>
        <input
          className="searchControl"
          type="date"
          value={draft.purchaseDate}
          onChange={(e) => setDraft((p) => ({ ...p, purchaseDate: e.target.value }))}
          aria-label="仕入日"
        />
      </label>

      <div className="searchFieldItemZoomGroup materialPurchaseSupplierZoomGroup">
        <label className="searchField">
          <span className="searchFieldLabel">仕入先</span>
          <input
            className="searchControl searchControlSupplier searchControlReadonly"
            type="text"
            value={draft.supplier}
            readOnly
            tabIndex={-1}
            placeholder="（仕入先を選択してください）"
            aria-label="仕入先"
            title="仕入先ZOOMで選択してください"
          />
        </label>
        <div className="searchField searchFieldZoomButtonWrap">
          <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
          <button type="button" className="zoomOpenButton" onClick={onOpenSupplierZoom}>
            仕入先
          </button>
        </div>
      </div>

      <div className="searchActions">
        <button
          className="searchSubmitButton"
          type="button"
          disabled={!searchEnabled}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、商品・仕入日・仕入先のいずれかを指定してください"
          }
        >
          検索
        </button>
      </div>
    </section>
  );
}
