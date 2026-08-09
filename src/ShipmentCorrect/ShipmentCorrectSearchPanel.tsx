/**
 * 直送先マスタメンテナンス … 検索条件（直送先名）
 */
import { useAtom } from "jotai";
import { isShipmentCorrectSearchEnabled, shipmentCorrectSearchDraftAtom } from "./store";
import type { ShipmentCorrectSearchFilters } from "./types";

type Props = {
  onSearch: (filters: ShipmentCorrectSearchFilters) => void;
};

export function ShipmentCorrectSearchPanel({ onSearch }: Props) {
  const [draft, setDraft] = useAtom(shipmentCorrectSearchDraftAtom);
  const searchEnabled = isShipmentCorrectSearchEnabled();

  return (
    <section className="shipmentCorrectSearchRow" aria-label="検索条件">
      <div className="searchField shipmentNameWithSearch">
        <span className="searchFieldLabel">直送先名</span>
        <div className="shipmentNameWithSearchControls">
          <input
            className="searchControl searchControlShipmentName"
            type="text"
            value={draft.shipmentName}
            onChange={(e) => setDraft((p) => ({ ...p, shipmentName: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch({ ...draft });
            }}
            aria-label="直送先名"
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
