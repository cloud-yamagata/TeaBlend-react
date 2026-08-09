/**
 * 【処理概要】
 *   レポート定義のフィルタ UI。`text` / `date` / `itemZoom`（商品 ZOOM）を横並びで描画。
 *
 * 【パラメータ仕様】
 *   - `filters` … YAML 由来の定義配列
 *   - `values` / `onChange` … 制御コンポーネント。キーは `ReportFilterDef.key`
 *   - `onSubmit` … 親で `runReport` を起動
 *
 * 【メンテナンス】
 *   `itemZoom` は `TrItemMasterZoomModal` で `systemClass: "2"` 固定。変えたい場合は props 化を検討。
 */
import { useMemo, useState } from "react";
import type { ReportFilterDef } from "../registry";
import { TrItemMasterZoomModal, type TrItemZoomFilterParams } from "../../components/TrItemMasterZoomModal";

export type ReportFilterValues = Record<string, string>;

export function buildDefaultFilterValues(filters: ReportFilterDef[]): ReportFilterValues {
  const out: ReportFilterValues = {};
  for (const f of filters) {
    out[f.key] = f.default ?? "";
  }
  return out;
}

type Props = {
  filters: ReportFilterDef[];
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function ReportFilters({ filters, values, onChange, onSubmit, disabled }: Props) {
  const hasFilters = filters.length > 0;
  const fields = useMemo(() => filters, [filters]);
  const [itemZoomOpenKey, setItemZoomOpenKey] = useState<string | null>(null);
  if (!hasFilters) return null;

  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  return (
    <section className="searchPanel">
      <button type="button" className="searchPanelToggle" aria-expanded>
        検索条件
        <span className="searchPanelToggleIcon"> ▼</span>
      </button>
      <div className="searchPanelBody">
        <div className="searchFields">
          {fields.map((f) => {
            if (f.type === "date") {
              return (
                <label key={f.key} className="searchField">
                  <span className="searchFieldLabel">{f.label}</span>
                  <input
                    className="searchControl"
                    type="date"
                    placeholder={f.placeholder ?? ""}
                    value={values[f.key] ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                  />
                </label>
              );
            }

            if (f.type === "itemZoom") {
              return (
                <div key={f.key} className="searchFieldItemZoomGroup">
                  <label className="searchField">
                    <span className="searchFieldLabel">{f.label}</span>
                    <input
                      className="searchControl searchControlItemName"
                      type="text"
                      placeholder={f.placeholder ?? ""}
                      value={values[f.key] ?? ""}
                      disabled={disabled}
                      onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                      autoComplete="off"
                    />
                  </label>
                  <div className="searchField searchFieldZoomButtonWrap">
                    <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
                    <button type="button" className="zoomOpenButton" onClick={() => setItemZoomOpenKey(f.key)} disabled={disabled}>
                      商品名
                    </button>
                  </div>
                  <TrItemMasterZoomModal
                    open={itemZoomOpenKey === f.key}
                    onClose={() => setItemZoomOpenKey(null)}
                    initialCode={f.zoomCodeKey ? values[f.zoomCodeKey] ?? "" : ""}
                    initialName={values[f.key] ?? ""}
                    filterParams={trItemZoomFilterParams}
                    onSelect={(code, name) => {
                      const next = { ...values, [f.key]: name };
                      if (f.zoomCodeKey) {
                        next[f.zoomCodeKey] = code;
                      }
                      onChange(next);
                    }}
                  />
                </div>
              );
            }

            return (
              <label key={f.key} className="searchField">
                <span className="searchFieldLabel">{f.label}</span>
                <input
                  className="searchControl searchControlWide"
                  type="text"
                  placeholder={f.placeholder ?? ""}
                  value={values[f.key] ?? ""}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                  autoComplete="off"
                />
              </label>
            );
          })}
          <div className="searchActions">
            <button className="searchSubmitButton" type="button" onClick={onSubmit} disabled={disabled}>
              実行
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

