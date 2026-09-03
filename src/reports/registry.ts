/**
 * 【処理概要】
 *   `reports/defs/*.yaml` を import し、レポート定義オブジェクトの配列とルックアップを提供。
 *
 * 【パラメータ仕様】
 *   - `getReportDef(reportId)` … 無ければ null
 *   - `hasReportDef` … メニューとルーティングの分岐に利用（`App.tsx`）
 *
 * 【メンテナンス】
 *   新レポート: (1) YAML を `defs/` に追加 (2) 本ファイルの import と `defs` 配列へ追加 (3) メニュー `screenKey` を一致
 */
import { parseSimpleYaml } from "../menu/simpleYaml";

import lotBulkTeaStockListYaml from "./defs/LotBulkTeaStockList.yaml?raw";
import factory2LotStockListYaml from "./defs/Factory2LotStockList.yaml?raw";
import factory2LotStockTransitionYaml from "./defs/Factory2LotStockTransition.yaml?raw";
import factory3BulkTeaTransitionYaml from "./defs/Factory3BulkTeaTransition.yaml?raw";
import usuallLotUsedAdoptedListYaml from "./defs/UsuallLotUusedAadoptedList.yaml?raw";
import bulkTeaYearOnYearUsageYaml from "./defs/BulkTeaYearOnYearUsage.yaml?raw";
import bulkTeaYearOnYearProductionYaml from "./defs/BulkTeaYearOnYearProduction.yaml?raw";
import monthlySalesPlanYaml from "./defs/MonthlySalesPlan.yaml?raw";

type Align = "left" | "center" | "right";

export type ReportFilterLayout = "blendLot";

export type ReportCheckGroupOption = {
  key: string;
  label: string;
  field: string;
};

export type ReportFilterDef = {
  key: string;
  label: string;
  type: "text" | "date" | "itemZoom" | "makeYear" | "checkGroup";
  default?: string;
  placeholder?: string;
  zoomCodeKey?: string;
  /** itemZoom + blendLot レイアウト時の ZOOM ボタンラベル */
  zoomButtonLabel?: string;
  /** checkGroup の選択肢 */
  options?: ReportCheckGroupOption[];
};

/** makeYear フィルタの有効フラグキー（値は "1" / "0"） */
export const reportMakeYearEnabledKey = (key: string): string => `${key}_enabled`;

/** checkGroup の各チェックキー（値は "1" / "0"） */
export const reportCheckGroupOptionKey = (groupKey: string, optionKey: string): string =>
  `${groupKey}_${optionKey}`;

export type ReportColumnDef = {
  field: string;
  header: string;
  minWidth?: number;
  flex?: number;
  align?: Align;
  format?: "ymd" | "weather";
  /** format=weather のとき、摘要があれば判定セルを強調しクリックで表示する */
  remarksField?: string;
};

export type ReportGridDef = {
  rowId: { mode: "concat"; fields: string[] };
  options?: { pageSize?: number; rowHeight?: number; headerHeight?: number };
  columns: ReportColumnDef[];
};

export type ReportExtractDef = {
  key: string;
  label: string;
  type: "text" | "yearMonth" | "weather";
  field?: string;
  yearField?: string;
  monthField?: string;
  default?: string;
};

export type ReportDef = {
  version: number;
  reportId: string;
  title: string;
  filterLayout?: ReportFilterLayout;
  /** true … 初回のみ API 全件取得、以降はフロント側で検索 */
  fetchOnce?: boolean;
  /** true … 検索パネル下に 実行 / Excel出力 / 抽出クリア を配置 */
  actionBar?: boolean;
  filters: ReportFilterDef[];
  extract: ReportExtractDef[];
  grid: ReportGridDef;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asString = (v: unknown): string | null => (typeof v === "string" ? v : v == null ? null : String(v));
const asNumber = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : v == null ? null : Number(v));

const decodeCheckGroupOption = (raw: unknown): ReportCheckGroupOption | null => {
  if (!isRecord(raw)) return null;
  const key = asString(raw.key);
  const label = asString(raw.label);
  const field = asString(raw.field);
  if (!key || !label || !field) return null;
  return { key, label, field };
};

const decodeFilter = (raw: unknown): ReportFilterDef | null => {
  if (!isRecord(raw)) return null;
  const key = asString(raw.key);
  const label = asString(raw.label);
  const type = asString(raw.type);
  if (!key || !label) return null;
  if (type === "checkGroup") {
    const optionsRaw = raw.options;
    if (!Array.isArray(optionsRaw)) return null;
    const options = optionsRaw
      .map(decodeCheckGroupOption)
      .filter((v): v is ReportCheckGroupOption => Boolean(v));
    if (options.length === 0) return null;
    return { key, label, type: "checkGroup", options };
  }
  if (type !== "text" && type !== "date" && type !== "itemZoom" && type !== "makeYear") return null;
  const def = raw.default == null ? undefined : asString(raw.default) ?? undefined;
  const placeholder = raw.placeholder == null ? undefined : asString(raw.placeholder) ?? undefined;
  const zoomCodeKey = raw.zoomCodeKey == null ? undefined : asString(raw.zoomCodeKey) ?? undefined;
  const zoomButtonLabel =
    raw.zoomButtonLabel == null ? undefined : asString(raw.zoomButtonLabel) ?? undefined;
  return { key, label, type, default: def, placeholder, zoomCodeKey, zoomButtonLabel };
};

const decodeColumn = (raw: unknown): ReportColumnDef | null => {
  if (!isRecord(raw)) return null;
  const field = asString(raw.field);
  const header = asString(raw.header);
  if (!field || !header) return null;
  const minWidth = raw.minWidth == null ? undefined : asNumber(raw.minWidth) ?? undefined;
  const flex = raw.flex == null ? undefined : asNumber(raw.flex) ?? undefined;
  const alignRaw = raw.align == null ? undefined : asString(raw.align) ?? undefined;
  const align: Align | undefined = alignRaw === "left" || alignRaw === "center" || alignRaw === "right" ? alignRaw : undefined;
  const formatRaw = raw.format == null ? undefined : asString(raw.format) ?? undefined;
  const format: "ymd" | "weather" | undefined =
    formatRaw === "ymd" || formatRaw === "weather" ? formatRaw : undefined;
  const remarksField = raw.remarksField == null ? undefined : asString(raw.remarksField) ?? undefined;
  return { field, header, minWidth: minWidth ?? undefined, flex: flex ?? undefined, align, format, remarksField };
};

const decodeExtract = (raw: unknown): ReportExtractDef | null => {
  if (!isRecord(raw)) return null;
  const key = asString(raw.key);
  const label = asString(raw.label);
  const type = asString(raw.type);
  if (!key || !label) return null;
  if (type !== "text" && type !== "yearMonth" && type !== "weather") return null;
  const field = raw.field == null ? undefined : asString(raw.field) ?? undefined;
  const yearField = raw.yearField == null ? undefined : asString(raw.yearField) ?? undefined;
  const monthField = raw.monthField == null ? undefined : asString(raw.monthField) ?? undefined;
  const def = raw.default == null ? undefined : asString(raw.default) ?? undefined;
  return { key, label, type, field, yearField, monthField, default: def };
};

const decodeReport = (yamlText: string): ReportDef => {
  const raw = parseSimpleYaml(yamlText);
  if (!isRecord(raw)) throw new Error("レポート定義YAMLの形式が不正です（ルートがオブジェクトではありません）。");
  const version = Number(raw.version);
  const reportId = asString(raw.reportId);
  const title = asString(raw.title);
  const filterLayoutRaw = asString(raw.filterLayout);
  const filterLayout: ReportFilterLayout | undefined =
    filterLayoutRaw === "blendLot" ? "blendLot" : undefined;
  const fetchOnce = raw.fetchOnce === true || raw.fetchOnce === "true";
  const actionBar = raw.actionBar === true || raw.actionBar === "true";
  const filtersRaw = raw.filters;
  const extractRaw = raw.extract;
  const gridRaw = raw.grid;
  if (!Number.isFinite(version)) throw new Error("レポート定義YAMLのversionが不正です。");
  if (!reportId || !title) throw new Error("レポート定義YAMLにreportId/titleがありません。");
  const filters = Array.isArray(filtersRaw) ? filtersRaw.map(decodeFilter).filter((v): v is ReportFilterDef => Boolean(v)) : [];
  const extract = Array.isArray(extractRaw)
    ? extractRaw.map(decodeExtract).filter((v): v is ReportExtractDef => Boolean(v))
    : [];
  if (!isRecord(gridRaw)) throw new Error("レポート定義YAMLにgridがありません。");
  const rowIdRaw = gridRaw.rowId;
  const columnsRaw = gridRaw.columns;
  if (!isRecord(rowIdRaw) || asString(rowIdRaw.mode) !== "concat" || !Array.isArray(rowIdRaw.fields)) {
    throw new Error("レポート定義YAMLのgrid.rowIdが不正です。");
  }
  const rowIdFields = rowIdRaw.fields.map(asString).filter((v): v is string => Boolean(v));
  const optionsRaw = gridRaw.options;
  const options = isRecord(optionsRaw)
    ? {
        pageSize: optionsRaw.pageSize == null ? undefined : asNumber(optionsRaw.pageSize) ?? undefined,
        rowHeight: optionsRaw.rowHeight == null ? undefined : asNumber(optionsRaw.rowHeight) ?? undefined,
        headerHeight: optionsRaw.headerHeight == null ? undefined : asNumber(optionsRaw.headerHeight) ?? undefined
      }
    : undefined;
  if (!Array.isArray(columnsRaw)) throw new Error("レポート定義YAMLのgrid.columnsが不正です。");
  const columns = columnsRaw.map(decodeColumn).filter((v): v is ReportColumnDef => Boolean(v));
  if (columns.length === 0) throw new Error("レポート定義YAMLのgrid.columnsが空です。");
  return {
    version,
    reportId,
    title,
    filterLayout,
    fetchOnce: fetchOnce || undefined,
    actionBar: actionBar || undefined,
    filters,
    extract,
    grid: { rowId: { mode: "concat", fields: rowIdFields }, options, columns }
  };
};

const defs: ReportDef[] = [
  decodeReport(lotBulkTeaStockListYaml),
  decodeReport(factory2LotStockListYaml),
  decodeReport(factory2LotStockTransitionYaml),
  decodeReport(factory3BulkTeaTransitionYaml),
  decodeReport(usuallLotUsedAdoptedListYaml),
  decodeReport(bulkTeaYearOnYearUsageYaml),
  decodeReport(bulkTeaYearOnYearProductionYaml),
  decodeReport(monthlySalesPlanYaml)
];
const defById = new Map(defs.map((d) => [d.reportId, d]));

export const getReportDef = (reportId: string): ReportDef | null => defById.get(reportId) ?? null;
export const hasReportDef = (reportId: string): boolean => defById.has(reportId);

