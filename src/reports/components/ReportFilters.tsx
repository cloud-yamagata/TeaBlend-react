/**
 * 【処理概要】
 *   レポート定義のフィルタ UI。`text` / `date` / `itemZoom` / `makeYear` を描画。
 *
 * 【レイアウト】
 *   - default … 折りたたみ可能な縦型 searchPanel
 *   - blendLot … ブレンドロット登録と同型の横並び検索パネル
 */
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Factory2MakeYearSpinner } from "../../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear } from "../../Factory2LotManufacture/factory2MakeYear";
import type { ReportFilterDef, ReportFilterLayout } from "../registry";
import { reportCheckGroupOptionKey, reportMakeYearEnabledKey } from "../registry";
import { TrItemMasterZoomModal, type TrItemZoomFilterParams } from "../../components/TrItemMasterZoomModal";
import "../../Factory2LotManufacture/factory2LotEditModal.css";

export type ReportFilterValues = Record<string, string>;

export function buildDefaultFilterValues(filters: ReportFilterDef[]): ReportFilterValues {
  const out: ReportFilterValues = {};
  for (const f of filters) {
    if (f.type === "makeYear") {
      out[f.key] = f.default ?? getDefaultMakeYear();
      out[reportMakeYearEnabledKey(f.key)] = "0";
    } else if (f.type === "checkGroup") {
      for (const opt of f.options ?? []) {
        out[reportCheckGroupOptionKey(f.key, opt.key)] = "0";
      }
    } else {
      out[f.key] = f.default ?? "";
    }
  }
  return out;
}

type Props = {
  filters: ReportFilterDef[];
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  onSubmit: () => void;
  disabled?: boolean;
  layout?: ReportFilterLayout;
  hideSubmit?: boolean;
  /** blendLot: 仕上茶（itemZoom）ボタンの直後 */
  afterZoomAction?: ReactNode;
  /** blendLot: 検索パネル右端 */
  actionBar?: ReactNode;
};

function MakeYearFieldset({
  f,
  values,
  onChange,
  disabled
}: {
  f: ReportFilterDef;
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  disabled?: boolean;
}) {
  const enabledKey = reportMakeYearEnabledKey(f.key);
  const enabled = (values[enabledKey] ?? "0") === "1";
  return (
    <fieldset className="blendLotSearchGroupBox blendLotSearchYearGroup">
      <legend>{f.label}</legend>
      <label className="factory2CheckLabel">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, [enabledKey]: e.target.checked ? "1" : "0" })}
          aria-label="年度で絞り込む"
        />
      </label>
      <div
        className={`blendLotMakeYearWrap${enabled ? "" : " isDisabled"}`}
        aria-disabled={!enabled}
      >
        <Factory2MakeYearSpinner
          value={values[f.key] ?? getDefaultMakeYear()}
          onChange={(next) => onChange({ ...values, [f.key]: next })}
        />
      </div>
    </fieldset>
  );
}

function CheckGroupFieldset({
  f,
  values,
  onChange,
  disabled
}: {
  f: ReportFilterDef;
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="blendLotSearchGroupBox">
      <legend>{f.label}</legend>
      {(f.options ?? []).map((opt) => {
        const valueKey = reportCheckGroupOptionKey(f.key, opt.key);
        return (
          <label key={opt.key} className="factory2CheckLabel">
            <input
              type="checkbox"
              checked={(values[valueKey] ?? "0") === "1"}
              disabled={disabled}
              onChange={(e) => onChange({ ...values, [valueKey]: e.target.checked ? "1" : "0" })}
            />
            {opt.label}
          </label>
        );
      })}
    </fieldset>
  );
}

function ReportFiltersBlendLot({
  filters,
  values,
  onChange,
  onSubmit,
  disabled,
  hideSubmit,
  afterZoomAction,
  actionBar
}: Props) {
  const [itemZoomOpenKey, setItemZoomOpenKey] = useState<string | null>(null);
  const trItemZoomFilterParams = useMemo<TrItemZoomFilterParams>(() => ({ systemClass: "2" }), []);

  return (
    <section className="blendLotSearchPanel" aria-label="検索条件">
      {filters.map((f) => {
        if (f.type === "makeYear") {
          return (
            <MakeYearFieldset key={f.key} f={f} values={values} onChange={onChange} disabled={disabled} />
          );
        }

        if (f.type === "checkGroup") {
          return (
            <CheckGroupFieldset key={f.key} f={f} values={values} onChange={onChange} disabled={disabled} />
          );
        }

        if (f.type === "date") {
          return (
            <Fragment key={f.key}>
              <span className="factory2FieldLabel factory2FieldLabelCompact">{f.label}</span>
              <input
                className="factory2TextInput date factory2DateCompact"
                type="date"
                value={values[f.key] ?? ""}
                disabled={disabled}
                onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                aria-label={f.label}
              />
            </Fragment>
          );
        }

        if (f.type === "itemZoom") {
          return (
            <Fragment key={f.key}>
              <span className="factory2FieldLabel factory2FieldLabelCompact">{f.label}</span>
              <input
                className="blendLotSearchItemNameInput"
                type="text"
                placeholder={f.placeholder ?? ""}
                value={values[f.key] ?? ""}
                disabled={disabled}
                onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                autoComplete="off"
                aria-label={f.label}
              />
              <button
                type="button"
                className="factory2DarkButton"
                onClick={() => setItemZoomOpenKey(f.key)}
                disabled={disabled}
              >
                {f.zoomButtonLabel ?? "商品名"}
              </button>
              {afterZoomAction}
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
                  setItemZoomOpenKey(null);
                }}
              />
            </Fragment>
          );
        }

        const inputClass =
          f.key === "item_no" ? "blendLotSearchItemNoInput" : "blendLotSearchItemNameInput";
        return (
          <Fragment key={f.key}>
            <span className="factory2FieldLabel factory2FieldLabelCompact">{f.label}</span>
            <input
              className={inputClass}
              type="text"
              inputMode={f.key === "item_no" ? "numeric" : undefined}
              placeholder={f.placeholder ?? ""}
              value={values[f.key] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
              autoComplete="off"
              aria-label={f.label}
            />
          </Fragment>
        );
      })}
      {actionBar ? <div className="blendLotSearchPanelActions">{actionBar}</div> : null}
      {!hideSubmit && !actionBar ? (
        <button
          type="button"
          className="factory2DarkButton blendLotSearchButton"
          onClick={onSubmit}
          disabled={disabled}
        >
          検索
        </button>
      ) : null}
    </section>
  );
}

function ReportFiltersDefault({ filters, values, onChange, onSubmit, disabled, hideSubmit }: Props) {
  const fields = useMemo(() => filters, [filters]);
  const [itemZoomOpenKey, setItemZoomOpenKey] = useState<string | null>(null);
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
            if (f.type === "makeYear") {
              const enabledKey = reportMakeYearEnabledKey(f.key);
              const enabled = (values[enabledKey] ?? "0") === "1";
              return (
                <fieldset key={f.key} className="reportFilterMakeYearGroup">
                  <legend>{f.label}</legend>
                  <label>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={disabled}
                      onChange={(e) => onChange({ ...values, [enabledKey]: e.target.checked ? "1" : "0" })}
                      aria-label="年度で絞り込む"
                    />
                  </label>
                  <div
                    className={`reportFilterMakeYearWrap${enabled ? "" : " isDisabled"}`}
                    aria-disabled={!enabled}
                  >
                    <Factory2MakeYearSpinner
                      value={values[f.key] ?? getDefaultMakeYear()}
                      onChange={(next) => onChange({ ...values, [f.key]: next })}
                    />
                  </div>
                </fieldset>
              );
            }

            if (f.type === "checkGroup") {
              return (
                <fieldset key={f.key} className="reportFilterMakeYearGroup">
                  <legend>{f.label}</legend>
                  {(f.options ?? []).map((opt) => {
                    const valueKey = reportCheckGroupOptionKey(f.key, opt.key);
                    return (
                      <label key={opt.key}>
                        <input
                          type="checkbox"
                          checked={(values[valueKey] ?? "0") === "1"}
                          disabled={disabled}
                          onChange={(e) =>
                            onChange({ ...values, [valueKey]: e.target.checked ? "1" : "0" })
                          }
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </fieldset>
              );
            }

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
                    <button
                      type="button"
                      className="zoomOpenButton"
                      onClick={() => setItemZoomOpenKey(f.key)}
                      disabled={disabled}
                    >
                      {f.zoomButtonLabel ?? "商品名"}
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
          {!hideSubmit ? (
            <div className="searchActions">
              <button className="searchSubmitButton" type="button" onClick={onSubmit} disabled={disabled}>
                実行
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function ReportFilters(props: Props) {
  if (props.filters.length === 0) return null;
  if (props.layout === "blendLot") {
    return <ReportFiltersBlendLot {...props} />;
  }
  return <ReportFiltersDefault {...props} />;
}
