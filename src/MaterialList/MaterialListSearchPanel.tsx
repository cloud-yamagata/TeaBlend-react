/**
 * 原料一覧の検索条件パネル（ドラフトのみ保持）。
 * 年などの変更で一覧テーブルを再描画しないよう、親ページから分離している。
 */
import { useAtom } from "jotai";
import { useState } from "react";
import { materialSearchDraftAtom, type MaterialSearchFilters } from "./store";

const MATERIAL_YEAR_MIN = 17;
const MATERIAL_YEAR_MAX = 99;

function buildMaterialYearOptions(): number[] {
  const currentTwoDigit = new Date().getFullYear() % 100;
  const start = Math.min(Math.max(currentTwoDigit, MATERIAL_YEAR_MIN), MATERIAL_YEAR_MAX);
  const options: number[] = [];
  for (let y = start; y >= MATERIAL_YEAR_MIN; y -= 1) {
    options.push(y);
  }
  return options;
}

const MATERIAL_YEAR_OPTIONS = buildMaterialYearOptions();

type Props = {
  onSearch: (filters: MaterialSearchFilters) => void;
  onOpenPurchaseZoom: () => void;
  onOpenProducerZoom: () => void;
};

export function MaterialListSearchPanel({ onSearch, onOpenPurchaseZoom, onOpenProducerZoom }: Props) {
  const [draft, setDraft] = useAtom(materialSearchDraftAtom);
  const [searchPanelOpen, setSearchPanelOpen] = useState(true);

  return (
    <section className="searchPanel">
      <button
        type="button"
        className="searchPanelToggle"
        onClick={() => setSearchPanelOpen((v) => !v)}
        aria-expanded={searchPanelOpen}
      >
        検索条件
        <span className="searchPanelToggleIcon">{searchPanelOpen ? " ▼" : " ▶"}</span>
      </button>
      {searchPanelOpen && (
        <div className="searchPanelBody">
          <div className="searchFields">
            <label className="searchField">
              <span className="searchFieldLabel">年</span>
              <select
                className="searchControl"
                value={draft.year}
                onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))}
              >
                <option value="">（空白）</option>
                {MATERIAL_YEAR_OPTIONS.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="searchField">
              <span className="searchFieldLabel">仕入日</span>
              <input
                className="searchControl"
                type="date"
                value={draft.purchaseDate}
                onChange={(e) => setDraft((p) => ({ ...p, purchaseDate: e.target.value }))}
              />
            </label>
            <div className="searchFieldItemZoomGroup">
              <label className="searchField">
                <span className="searchFieldLabel">仕入先</span>
                <input
                  className="searchControl searchControlZoomField"
                  type="text"
                  value={draft.purchase}
                  onChange={(e) => setDraft((p) => ({ ...p, purchase: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <div className="searchField searchFieldZoomButtonWrap">
                <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
                <button type="button" className="zoomOpenButton" onClick={onOpenPurchaseZoom}>
                  仕入先
                </button>
              </div>
            </div>
            <div className="searchFieldItemZoomGroup">
              <label className="searchField">
                <span className="searchFieldLabel">生産者</span>
                <input
                  className="searchControl searchControlZoomField"
                  type="text"
                  value={draft.producer}
                  onChange={(e) => setDraft((p) => ({ ...p, producer: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <div className="searchField searchFieldZoomButtonWrap">
                <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
                <button type="button" className="zoomOpenButton" onClick={onOpenProducerZoom}>
                  生産者
                </button>
              </div>
            </div>
            <label className="searchField">
              <span className="searchFieldLabel">原料名</span>
              <input
                className="searchControl searchControlWide"
                type="text"
                value={draft.materialName}
                onChange={(e) => setDraft((p) => ({ ...p, materialName: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="searchActions">
              <button className="searchSubmitButton" type="button" onClick={() => onSearch(draft)}>
                検索
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
