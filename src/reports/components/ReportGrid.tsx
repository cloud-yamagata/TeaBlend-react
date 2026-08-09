/**
 * 【処理概要】
 *   レポート結果行を Mantine Table で表示。列定義・行 ID の concat ルールは YAML の `grid` セクション。
 *
 * 【パラメータ仕様】
 *   - `def` … `ReportDef`（registry から取得済み想定）
 *   - `rows` … API `/run` の行配列
 */
import { useMemo, type CSSProperties } from "react";
import { MantineScrollTable, type MantineScrollTableColumn } from "../../components/mantine/MantineScrollTable";
import "../../components/mantine/mantineScrollTable.css";
import { listTablePagination } from "../../config/listTablePagination";
import { MantineZoomProvider } from "../../mantine/MantineZoomProvider";
import type { ReportDef } from "../registry";
import "./reportGrid.css";

type ReportRow = Record<string, unknown>;

type Props = {
  def: ReportDef;
  rows: ReportRow[];
};

const toDateText = (value: unknown): string => {
  if (value == null) return "";
  const s = typeof value === "string" ? value : String(value);
  if (s.trim() === "") return "";
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = String(Number(ymdMatch[2])).padStart(2, "0");
    const dd = String(Number(ymdMatch[3])).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return s;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

const cellText = (value: unknown, format?: "ymd"): string => {
  if (format === "ymd") return toDateText(value);
  if (value == null) return "";
  return typeof value === "number" ? String(value) : String(value);
};

const buildRowIdBase = (def: ReportDef, row: ReportRow): string => {
  const parts = def.grid.rowId.fields.map((k) => String(row[k] ?? ""));
  return parts.join("-");
};

/** YAML の concat キーが API 上重複しうるため、React 用に一意化する（2件目以降は #1, #2 …） */
const buildUniqueRowIdGetter = (def: ReportDef, rows: ReportRow[]): ((row: ReportRow) => string) => {
  const seen = new Map<string, number>();
  const idByRow = new Map<ReportRow, string>();
  for (const row of rows) {
    const base = buildRowIdBase(def, row);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    idByRow.set(row, count === 0 ? base : `${base}#${count}`);
  }
  return (row) => idByRow.get(row) ?? buildRowIdBase(def, row);
};

const buildColumns = (def: ReportDef): MantineScrollTableColumn<ReportRow>[] =>
  def.grid.columns.map((c) => ({
    key: c.field,
    label: c.header,
    align: c.align,
    sortValue: (row) => {
      const v = row[c.field];
      if (c.format === "ymd") return toDateText(v);
      if (typeof v === "number") return v;
      return v == null ? "" : String(v);
    },
    render: (row) => cellText(row[c.field], c.format)
  }));

export default function ReportGrid({ def, rows }: Props) {
  const columns = useMemo(() => buildColumns(def), [def]);
  const getRowId = useMemo(() => buildUniqueRowIdGetter(def, rows), [def, rows]);

  const minTableWidth = useMemo(() => {
    const sum = def.grid.columns.reduce((acc, c) => acc + (c.minWidth ?? 80), 0);
    return Math.max(sum, 640);
  }, [def]);

  const headerMinHeight = def.grid.options?.headerHeight ?? 40;

  const wrapStyle = {
    "--report-grid-header-min-height": `${headerMinHeight}px`
  } as CSSProperties;

  return (
    <section className="tableWrap reportGridWrap" style={wrapStyle}>
      <MantineZoomProvider>
        <MantineScrollTable
          rows={rows}
          getRowId={getRowId}
          columns={columns}
          pagination={listTablePagination.reportGrid}
          minTableWidth={minTableWidth}
          showFilter={false}
          emptyMessage="表示するデータがありません。条件を指定して実行してください。"
          striped={false}
          highlightOnHover
          className="reportGridMantineRoot"
          scrollClassName="reportGridMantineScroll mantineScrollTableScroll"
          tableClassName="reportGridMantineTable mantineScrollTable"
        />
      </MantineZoomProvider>
    </section>
  );
}
