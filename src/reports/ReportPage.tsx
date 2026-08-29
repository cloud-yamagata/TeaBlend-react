/**
 * 【処理概要】
 *   メニューから `screenKey` で開く動的レポート画面。YAML 定義に従いフィルタ・グリッド・Excel を表示。
 *
 * 【パラメータ仕様】
 *   - `reportId` … `registry` の ID と一致（ルート param の `screenKey`）
 *
 * 【メンテナンス】
 *   一部レポートは `ITEM_FILTER_REPORT_IDS` で API へ送る `item_name` を `%` に補正（後方互換 SQL 向け）。
 */
import { useMemo, useState } from "react";
import { getReportDef } from "./registry";
import ReportFilters, { buildDefaultFilterValues, type ReportFilterValues } from "./components/ReportFilters";
import ReportExtractPanel from "./components/ReportExtractPanel";
import ReportGrid from "./components/ReportGrid";
import ReportToolbar from "./components/ReportToolbar";
import {
  applyReportExtract,
  buildDefaultExtractValues,
  type ReportExtractValues
} from "./applyReportExtract";
import { downloadReportExcel, runReport } from "./reportApi";
import "../MonthlyPlan/styles.css";
import "./components/reportGrid.css";

type Props = {
  reportId: string;
};

const ITEM_FILTER_REPORT_IDS = new Set<string>([
  "LotBulkTeaStockList",
  "Factory2LotStockList",
  "Factory2LotStockTransition",
  "Factory3BulkTeaTransition",
  "UsuallLotUusedAadoptedList",
  "BulkTeaYearOnYearUsage",
  "BulkTeaYearOnYearProduction",
  "MonthlySalesPlan"
]);

export default function ReportPage({ reportId }: Props) {
  const def = useMemo(() => getReportDef(reportId), [reportId]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<ReportFilterValues>(() => {
    const d = getReportDef(reportId);
    return d ? buildDefaultFilterValues(d.filters) : {};
  });
  const [extractValues, setExtractValues] = useState<ReportExtractValues>(() => {
    const d = getReportDef(reportId);
    return d ? buildDefaultExtractValues(d.extract) : {};
  });

  if (!def) {
    return (
      <main className="page">
        <header className="toolbar">
          <h1 className="title">各種レポート</h1>
        </header>
        <section className="card">
          <p className="status error">レポート定義が見つかりません: {reportId}</p>
        </section>
      </main>
    );
  }

  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      params[key] = value;
    }

    // 既存SQL互換のため、対象レポートはitem_name空欄を全件検索'%'に補正する。
    if (ITEM_FILTER_REPORT_IDS.has(def.reportId)) {
      const raw = typeof params.item_name === "string" ? params.item_name : "";
      const trimmed = raw.trim();
      const itemNo = typeof params.item_no === "string" ? params.item_no.trim() : "";
      params.item_no = itemNo;
      // 商品NO入力時は商品名条件を無効化して、商品NO直入力の運用を優先する。
      params.item_name = itemNo !== "" ? "%" : (trimmed === "" ? "%" : trimmed);
    }

    return params;
  }, [def.reportId, filters]);

  const displayedRows = useMemo(
    () => applyReportExtract(rows, def.extract, extractValues),
    [rows, def.extract, extractValues]
  );

  const extractOnlyLayout = def.reportId === "MonthlySalesPlan";

  const gridEmptyMessage =
    rows.length > 0 && displayedRows.length === 0
      ? "抽出条件に一致するデータがありません"
      : "表示するデータがありません。条件を指定して実行してください。";

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setRows([]);
    try {
      const res = await runReport(def.reportId, apiParams);
      const nextRows = res.rows ?? [];
      if (ITEM_FILTER_REPORT_IDS.has(def.reportId)) {
        const itemNo = typeof filters.item_no === "string" ? filters.item_no.trim() : "";
        if (itemNo !== "") {
          setRows(nextRows.filter((row) => String(row.item_no ?? "").trim() === itemNo));
          return;
        }
      }
      setRows(nextRows);
    } catch (e) {
      setRows([]);
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("404")) {
        setError(`レポートIDがAPIに未登録です: ${def.reportId}`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = async () => {
    setLoading(true);
    setError("");
    try {
      await downloadReportExcel(def.reportId, apiParams, `${def.title}.xlsx`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("404")) {
        setError(`レポートIDがAPIに未登録です: ${def.reportId}`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">{def.title}</h1>
      </header>

      {loading && <p className="status">処理中...</p>}
      {error && <p className="status error">{error}</p>}

      {!extractOnlyLayout ? (
        <ReportFilters filters={def.filters} values={filters} onChange={setFilters} onSubmit={() => void handleRun()} disabled={loading} />
      ) : null}
      {!extractOnlyLayout ? <ReportToolbar onExcel={() => void handleExcel()} disabled={loading} /> : null}
      {def.extract.length > 0 ? (
        <ReportExtractPanel
          extract={def.extract}
          values={extractValues}
          onChange={setExtractValues}
          onClear={() => setExtractValues(buildDefaultExtractValues(def.extract))}
          fetchedCount={rows.length}
          shownCount={displayedRows.length}
          fieldsDisabled={loading || rows.length === 0}
          actionsDisabled={loading}
          excelDisabled={loading || rows.length === 0}
          collapsible={extractOnlyLayout}
          onRun={extractOnlyLayout ? () => void handleRun() : undefined}
          onExcel={extractOnlyLayout ? () => void handleExcel() : undefined}
        />
      ) : null}
      <ReportGrid def={def} rows={displayedRows} emptyMessage={gridEmptyMessage} />
    </main>
  );
}

