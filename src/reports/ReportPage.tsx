/**
 * 【処理概要】
 *   メニューから `screenKey` で開く動的レポート画面。YAML 定義に従いフィルタ・グリッド・Excel を表示。
 *
 * 【パラメータ仕様】
 *   - `reportId` … `registry` の ID と一致（ルート param の `screenKey`）
 *
 * 【メンテナンス】
 *   一部レポートは `ITEM_FILTER_REPORT_IDS` で API へ送る `item_name` を `%` に補正（後方互換 SQL 向け）。
 *   `fetchOnce` レポートは「実行」で全件取得、「抽出」でキャッシュ絞り込み（条件変更では一覧を変えない）。
 */
import { useEffect, useMemo, useState } from "react";
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { getReportDef, reportMakeYearEnabledKey, type ReportFilterDef } from "./registry";
import ReportFilters, { buildDefaultFilterValues, type ReportFilterValues } from "./components/ReportFilters";
import ReportActionBar from "./components/ReportActionBar";
import ReportExtractPanel from "./components/ReportExtractPanel";
import ReportGrid from "./components/ReportGrid";
import ReportToolbar from "./components/ReportToolbar";
import {
  applyReportExtract,
  buildDefaultExtractValues,
  type ReportExtractValues
} from "./applyReportExtract";
import {
  filterRowsByCheckGroup,
  stripCheckGroupParams
} from "./applyReportCheckGroupFilter";
import { filterLotBulkTeaStockListRows } from "./filterLotBulkTeaStockListRows";
import { downloadReportExcel, runReport } from "./reportApi";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "../BlendLot/styles.css";
import "./components/reportGrid.css";

type Props = {
  reportId: string;
};

const ITEM_FILTER_REPORT_IDS = new Set<string>([
  "Factory2LotStockList",
  "Factory2LotStockTransition",
  "Factory3BulkTeaTransition",
  "UsuallLotUusedAadoptedList",
  "BulkTeaYearOnYearUsage",
  "BulkTeaYearOnYearProduction",
  "MonthlySalesPlan"
]);

function applyFetchOnceClientFilter(
  reportId: string,
  allRows: Record<string, unknown>[],
  filters: ReportFilterValues,
  filterDefs: ReportFilterDef[]
): Record<string, unknown>[] {
  if (reportId === "LotBulkTeaStockList") {
    return filterLotBulkTeaStockListRows(allRows, filters, filterDefs);
  }
  return allRows;
}

export default function ReportPage({ reportId }: Props) {
  const def = useMemo(() => getReportDef(reportId), [reportId]);
  const [cachedRows, setCachedRows] = useState<Record<string, unknown>[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchExecuted, setSearchExecuted] = useState(false);

  const [filters, setFilters] = useState<ReportFilterValues>(() => {
    const d = getReportDef(reportId);
    return d ? buildDefaultFilterValues(d.filters) : {};
  });
  const [extractValues, setExtractValues] = useState<ReportExtractValues>(() => {
    const d = getReportDef(reportId);
    return d ? buildDefaultExtractValues(d.extract) : {};
  });

  useEffect(() => {
    const d = getReportDef(reportId);
    setCachedRows([]);
    setRows([]);
    setSearchExecuted(false);
    setError("");
    setFilters(d ? buildDefaultFilterValues(d.filters) : {});
    setExtractValues(d ? buildDefaultExtractValues(d.extract) : {});
  }, [reportId]);

  const fetchOnce = def?.fetchOnce === true;

  const apiParams = useMemo(() => {
    if (!def) return {};
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      params[key] = value;
    }

    for (const f of def.filters) {
      if (f.type === "makeYear") {
        const enabled = params[reportMakeYearEnabledKey(f.key)] === "1";
        if (!enabled) {
          params[f.key] = null;
        } else {
          const yearText = normalizeMakeYearFromForm(String(params[f.key] ?? ""));
          params[f.key] = yearText ? Number(yearText) : null;
        }
        delete params[reportMakeYearEnabledKey(f.key)];
      }
    }
    stripCheckGroupParams(params, def.filters);

    if (ITEM_FILTER_REPORT_IDS.has(def.reportId)) {
      const raw = typeof params.item_name === "string" ? params.item_name : "";
      const trimmed = raw.trim();
      const itemNo = typeof params.item_no === "string" ? params.item_no.trim() : "";
      params.item_no = itemNo;
      params.item_name = itemNo !== "" ? "%" : trimmed === "" ? "%" : trimmed;
    }

    return params;
  }, [def, filters]);

  const displayedRows = useMemo(
    () => applyReportExtract(rows, def?.extract ?? [], extractValues),
    [rows, def?.extract, extractValues]
  );

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

  const extractOnlyLayout = def.reportId === "MonthlySalesPlan";
  const useActionBar = def.actionBar === true;
  const useBlendLotLayout = def.filterLayout === "blendLot";
  const cacheReady = fetchOnce && cachedRows.length > 0;

  const gridEmptyMessage =
    searchExecuted && displayedRows.length === 0
      ? fetchOnce && cachedRows.length === 0
        ? "表示するデータがありません。"
        : "抽出条件に一致するデータがありません"
      : fetchOnce && !searchExecuted
        ? "「実行」でマスタを取得します。条件指定後は「抽出」で絞り込んでください。"
        : "表示するデータがありません。条件を指定して実行してください。";

  /** 実行 … バックエンドから条件なし全件取得。一覧は未抽出の全件を表示 */
  const handleRun = async () => {
    setLoading(true);
    setError("");

    if (!fetchOnce) {
      setRows([]);
    }
    try {
      const params = fetchOnce ? {} : apiParams;
      const res = await runReport(def.reportId, params);
      const nextRows = res.rows ?? [];

      if (fetchOnce) {
        setCachedRows(nextRows);
        setRows(nextRows);
        setSearchExecuted(true);
      } else {
        let filtered = nextRows;
        if (ITEM_FILTER_REPORT_IDS.has(def.reportId)) {
          const itemNo = typeof filters.item_no === "string" ? filters.item_no.trim() : "";
          if (itemNo !== "") {
            filtered = filtered.filter((row) => String(row.item_no ?? "").trim() === itemNo);
          }
        }
        for (const f of def.filters) {
          if (f.type === "checkGroup") {
            filtered = filterRowsByCheckGroup(filtered, f, filters);
          }
        }
        setRows(filtered);
        setSearchExecuted(true);
      }
    } catch (e) {
      if (!fetchOnce) {
        setRows([]);
      }
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

  /** 抽出 … フロントキャッシュに対して条件で絞り込み（API は呼ばない） */
  const handleExtract = () => {
    if (!fetchOnce || cachedRows.length === 0) return;
    setRows(applyFetchOnceClientFilter(def.reportId, cachedRows, filters, def.filters));
  };

  /** 抽出クリア … 検索条件なし＋実行直後と同じ全件表示 */
  const handleClearExtract = () => {
    if (!fetchOnce || cachedRows.length === 0) return;
    setFilters(buildDefaultFilterValues(def.filters));
    setRows(cachedRows);
  };

  const handleExcel = async () => {
    setLoading(true);
    setError("");
    try {
      const params = fetchOnce ? {} : apiParams;
      await downloadReportExcel(def.reportId, params, `${def.title}.xlsx`);
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

  const postRunEnabled = searchExecuted && !loading;

  return (
    <main className={`page${useBlendLotLayout ? " blendLotPage" : ""}`}>
      <header className="toolbar">
        <h1 className="title">{def.title}</h1>
      </header>

      {loading && <p className="status">処理中...</p>}
      {error && <p className="status error">{error}</p>}
      {fetchOnce && !loading && !error ? (
        <p className="blendLotHint">
          {searchExecuted
            ? `一覧 ${rows.length.toLocaleString("ja-JP")} 件（マスタ ${cachedRows.length.toLocaleString("ja-JP")} 件）`
            : "「実行」でマスタを取得します。条件指定後は「抽出」で絞り込んでください。"}
        </p>
      ) : null}

      {!extractOnlyLayout ? (
        <ReportFilters
          filters={def.filters}
          values={filters}
          onChange={setFilters}
          onSubmit={() => void handleRun()}
          disabled={loading}
          layout={def.filterLayout}
          hideSubmit={useActionBar}
          afterZoomAction={
            useActionBar ? (
              <ReportActionBar
                variant="extractOnly"
                onExtract={handleExtract}
                extractDisabled={!postRunEnabled || !cacheReady}
              />
            ) : undefined
          }
          actionBar={
            useActionBar ? (
              <ReportActionBar
                placement="searchPanel"
                onRun={() => void handleRun()}
                onExcel={() => void handleExcel()}
                onClear={handleClearExtract}
                runDisabled={loading}
                excelDisabled={!postRunEnabled || rows.length === 0}
                clearDisabled={!postRunEnabled || !cacheReady}
              />
            ) : undefined
          }
        />
      ) : null}
      {!extractOnlyLayout && !useActionBar ? (
        <ReportToolbar onExcel={() => void handleExcel()} disabled={loading} />
      ) : null}
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
