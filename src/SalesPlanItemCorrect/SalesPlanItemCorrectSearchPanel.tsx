/**
 * 販売計画商品マスタメンテナンス … 検索条件（商品名）
 */
import { useAtom } from "jotai";
import { isSalesPlanItemCorrectSearchEnabled, salesPlanItemCorrectSearchDraftAtom } from "./store";
import type { SalesPlanItemCorrectSearchFilters } from "./types";

type Props = {
  onSearch: (filters: SalesPlanItemCorrectSearchFilters) => void;
};

export function SalesPlanItemCorrectSearchPanel({ onSearch }: Props) {
  const [draft, setDraft] = useAtom(salesPlanItemCorrectSearchDraftAtom);
  const searchEnabled = isSalesPlanItemCorrectSearchEnabled();

  return (
    <section className="salesPlanItemCorrectSearchRow" aria-label="検索条件">
      <div className="searchField itemNameWithSearch">
        <span className="searchFieldLabel">商品名</span>
        <div className="itemNameWithSearchControls">
          <input
            className="searchControl searchControlItemName"
            type="text"
            value={draft.itemName}
            onChange={(e) => setDraft((p) => ({ ...p, itemName: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch({ ...draft });
            }}
            aria-label="商品名"
            autoComplete="off"
          />
          <button
            type="button"
            className="searchSubmitButton"
            disabled={!searchEnabled}
            onClick={() => onSearch({ ...draft })}
          >
            検索
          </button>
        </div>
      </div>
    </section>
  );
}
