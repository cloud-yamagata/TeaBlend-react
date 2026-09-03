/**
 * 転売先マスタメンテナンス … 検索条件（転売先）
 */
import { useAtom } from "jotai";
import { isResaleCorrectSearchEnabled, resaleCorrectSearchDraftAtom } from "./store";
import type { ResaleCorrectSearchFilters } from "./types";

type Props = {
  onSearch: (filters: ResaleCorrectSearchFilters) => void;
};

export function ResaleCorrectSearchPanel({ onSearch }: Props) {
  const [draft, setDraft] = useAtom(resaleCorrectSearchDraftAtom);
  const searchEnabled = isResaleCorrectSearchEnabled();

  return (
    <section className="resaleCorrectSearchRow" aria-label="検索条件">
      <div className="searchField resaleNameWithSearch">
        <span className="searchFieldLabel">転売先</span>
        <div className="resaleNameWithSearchControls">
          <input
            className="searchControl searchControlResaleName"
            type="text"
            value={draft.resaleName}
            onChange={(e) => setDraft((p) => ({ ...p, resaleName: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch({ ...draft });
            }}
            aria-label="転売先"
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
