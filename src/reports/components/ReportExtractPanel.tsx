/**
 * レポート実行後の一覧抽出 UI（キャッシュ上の絞り込み。API は呼ばない）。
 * 一部レポートでは実行・Excel 出力ボタンもここに配置する。
 */
import { useState } from "react";
import type { ReportExtractDef } from "../registry";
import type { ReportExtractValues } from "../applyReportExtract";
import ReportActionBar from "./ReportActionBar";

type Props = {
  extract: ReportExtractDef[];
  values: ReportExtractValues;
  onChange: (next: ReportExtractValues) => void;
  onClear: () => void;
  fetchedCount: number;
  shownCount: number;
  fieldsDisabled?: boolean;
  actionsDisabled?: boolean;
  excelDisabled?: boolean;
  collapsible?: boolean;
  onRun?: () => void;
  onExcel?: () => void;
};

export default function ReportExtractPanel({
  extract,
  values,
  onChange,
  onClear,
  fetchedCount,
  shownCount,
  fieldsDisabled,
  actionsDisabled,
  excelDisabled,
  collapsible = false,
  onRun,
  onExcel
}: Props) {
  const excelButtonDisabled = excelDisabled ?? actionsDisabled;
  const [panelOpen, setPanelOpen] = useState(true);

  if (extract.length === 0) return null;

  const panelClassName = collapsible
    ? "searchPanel reportExtractPanel reportExtractPanelCollapsible"
    : "searchPanel reportExtractPanel";

  return (
    <section className={panelClassName} aria-label="一覧抽出">
      {collapsible ? (
        <button
          type="button"
          className="searchPanelToggle"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        >
          一覧抽出
          <span className="searchPanelToggleIcon">{panelOpen ? " ▼" : " ▶"}</span>
        </button>
      ) : (
        <div className="searchPanelToggle" aria-hidden>
          一覧抽出
          <span className="searchPanelToggleIcon">実行結果を画面上で絞り込みます</span>
        </div>
      )}
      {(!collapsible || panelOpen) && (
        <div className="searchPanelBody">
          <div className="searchFields">
            {extract.map((e) => {
              if (e.type === "yearMonth") {
                return (
                  <label key={e.key} className="searchField">
                    <span className="searchFieldLabel">{e.label}</span>
                    <input
                      className="searchControl"
                      type="month"
                      value={values[e.key] ?? ""}
                      disabled={fieldsDisabled}
                      onChange={(ev) => onChange({ ...values, [e.key]: ev.target.value })}
                      aria-label={e.label}
                    />
                  </label>
                );
              }

              if (e.type === "weather") {
                return (
                  <label key={e.key} className="searchField">
                    <span className="searchFieldLabel">{e.label}</span>
                    <select
                      className="searchControl"
                      value={values[e.key] ?? ""}
                      disabled={fieldsDisabled}
                      onChange={(ev) => onChange({ ...values, [e.key]: ev.target.value })}
                      aria-label={e.label}
                    >
                      <option value="">すべて</option>
                      <option value="sun">晴れ</option>
                      <option value="rain">雨</option>
                    </select>
                  </label>
                );
              }

              return (
                <label key={e.key} className="searchField">
                  <span className="searchFieldLabel">{e.label}</span>
                  <input
                    className="searchControl searchControlItemName"
                    type="text"
                    value={values[e.key] ?? ""}
                    disabled={fieldsDisabled}
                    onChange={(ev) => onChange({ ...values, [e.key]: ev.target.value })}
                    autoComplete="off"
                    aria-label={e.label}
                  />
                </label>
              );
            })}
            <ReportActionBar
              onRun={onRun}
              onExcel={onExcel}
              onClear={onClear}
              runDisabled={actionsDisabled}
              excelDisabled={excelButtonDisabled}
              clearDisabled={fieldsDisabled}
            />
          </div>
          <p className="reportExtractHint">
            表示 {shownCount.toLocaleString("ja-JP")} 件 / 取得 {fetchedCount.toLocaleString("ja-JP")} 件
          </p>
        </div>
      )}
    </section>
  );
}
