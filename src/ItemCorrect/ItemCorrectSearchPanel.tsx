/**
 * 商品マスタメンテナンス … 検索条件
 * チェックボックスグループはロット製造実績一覧（factory2GroupBox）を参考
 */
import { useAtom } from "jotai";
import { isItemCorrectSearchEnabled, itemCorrectSearchDraftAtom } from "./store";
import type { ItemCorrectSearchFilters } from "./types";
import "../Factory2LotManufacture/styles.css";

type Props = {
  onSearch: (filters: ItemCorrectSearchFilters) => void;
};

const ITEM_GROUP_SEARCH_OPTIONS = [
  { code: "1" as const, label: "商品" },
  { code: "3" as const, label: "仕上茶" },
  { code: "4" as const, label: "仕入茶" },
  { code: "5" as const, label: "委託品" },
  { code: "6" as const, label: "ブレンド" },
  { code: "7" as const, label: "委託支給" },
  { code: "9" as const, label: "卸" }
];

export function ItemCorrectSearchPanel({ onSearch }: Props) {
  const [draft, setDraft] = useAtom(itemCorrectSearchDraftAtom);
  const searchEnabled = isItemCorrectSearchEnabled();

  return (
    <section className="itemCorrectSearchRow" aria-label="検索条件">
      <label className="searchField">
        <span className="searchFieldLabel">商品名</span>
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
      </label>

      <fieldset className="factory2GroupBox">
        <legend>商品区分</legend>
        <label className="factory2CheckLabel">
          <input
            type="checkbox"
            checked={draft.systemClassCheck.product}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                systemClassCheck: { ...p.systemClassCheck, product: e.target.checked }
              }))
            }
          />
          商品
        </label>
        <label className="factory2CheckLabel">
          <input
            type="checkbox"
            checked={draft.systemClassCheck.finish}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                systemClassCheck: { ...p.systemClassCheck, finish: e.target.checked }
              }))
            }
          />
          仕上品
        </label>
      </fieldset>

      <fieldset className="factory2GroupBox">
        <legend>有機区分</legend>
        <label className="factory2CheckLabel">
          <input
            type="checkbox"
            checked={draft.organicClassCheck.organic}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                organicClassCheck: { ...p.organicClassCheck, organic: e.target.checked }
              }))
            }
          />
          有機茶
        </label>
        <label className="factory2CheckLabel">
          <input
            type="checkbox"
            checked={draft.organicClassCheck.pesticideFree}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                organicClassCheck: { ...p.organicClassCheck, pesticideFree: e.target.checked }
              }))
            }
          />
          無農薬
        </label>
        <label className="factory2CheckLabel">
          <input
            type="checkbox"
            checked={draft.organicClassCheck.general}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                organicClassCheck: { ...p.organicClassCheck, general: e.target.checked }
              }))
            }
          />
          一般茶
        </label>
      </fieldset>

      <div className="itemCorrectItemGroupWithSearch">
        <fieldset className="factory2GroupBox">
          <legend>商品分類</legend>
          {ITEM_GROUP_SEARCH_OPTIONS.map((opt) => (
            <label key={opt.code} className="factory2CheckLabel">
              <input
                type="checkbox"
                checked={draft.itemGroupCheck[opt.code]}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    itemGroupCheck: { ...p.itemGroupCheck, [opt.code]: e.target.checked }
                  }))
                }
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          className="searchSubmitButton"
          disabled={!searchEnabled}
          onClick={() => onSearch({ ...draft })}
        >
          検索
        </button>
      </div>
    </section>
  );
}
