/**
 * 第1工場生産実績情報一覧（旧 Factory1Rresult MainWindow.xaml）
 * 検索エリアは仕入実績情報一覧（年度スピナー＋単一検索）に合わせる。
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  factory1RresultMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterMaterialsAtom
} from "../repository/masterData";
import { buildFactory1RresultList } from "./buildFactory1RresultList";
import {
  Factory1RresultEditModal,
  type Factory1RresultEditModalMode
} from "./Factory1RresultEditModal";
import { Factory1RresultMantineTable } from "./Factory1RresultMantineTable";
import {
  filterFactory1RresultRows,
  isFactory1RresultSearchEnabled
} from "./factory1RresultSearchCriteria";
import type {
  Factory1RresultAppliedSearchCriteria,
  Factory1RresultRow,
  Factory1RresultStatusFilter
} from "./types";
import { FACTORY1_RRESULT_MAX_ROWS } from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./factory1RresultTable.css";

const defaultStatusFilter = (): Factory1RresultStatusFilter => ({
  mi: false,
  zan: false,
  kan: false,
  go: false
});

const factory1RresultRowsAtom = atom((get) =>
  buildFactory1RresultList(get(masterEntityCacheAtom), get(masterMaterialsAtom))
);

const resolveKeywords = (k1: string, k2: string, k3: string): string[] => {
  const keywords: string[] = [];
  if (k1.trim()) keywords.push(k1.trim());
  if (k2.trim()) keywords.push(k2.trim());
  if (k3.trim()) keywords.push(k3.trim());
  return keywords;
};

export default function Factory1RresultPage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(factory1RresultMasterErrorAtom);
  const allRows = useAtomValue(factory1RresultRowsAtom);

  const [year, setYear] = useState(getDefaultMakeYear);
  const [keyword1, setKeyword1] = useState("");
  const [keyword2, setKeyword2] = useState("");
  const [keyword3, setKeyword3] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<Factory1RresultStatusFilter>(defaultStatusFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<Factory1RresultAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [bulkTransferSelectedIds, setBulkTransferSelectedIds] = useState<Set<string>>(() => new Set());
  const [materialSelectedIds, setMaterialSelectedIds] = useState<Set<string>>(() => new Set());
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<Factory1RresultEditModalMode>("create");
  const [editCopyRow, setEditCopyRow] = useState<Factory1RresultRow | null>(null);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0, truncated: false };
    }
    return filterFactory1RresultRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isFactory1RresultSearchEnabled(year);
  const hasSelection = selectedRowId != null;
  const hasBulkTransferSelection = bulkTransferSelectedIds.size > 0;
  const hasMaterialSelection = materialSelectedIds.size > 0;

  const selectedRow = useMemo(
    () =>
      selectedRowId != null
        ? (filterResult.rows.find((r) => r.id === selectedRowId) ?? null)
        : null,
    [filterResult.rows, selectedRowId]
  );

  /** 完了かつ原料登録不可 → 参照のみ（EditType=9） */
  const isLockedRow =
    selectedRow != null && selectedRow.status === "完" && !selectedRow.isMaterialSelectable;

  const handleSearch = () => {
    if (!searchEnabled) return;
    const normalizedYear = normalizeMakeYearFromForm(year);
    if (!normalizedYear) {
      window.alert("半角数値で入力してください。");
      return;
    }
    setYear(normalizedYear);

    const criteria: Factory1RresultAppliedSearchCriteria = {
      year: normalizedYear,
      keywords: resolveKeywords(keyword1, keyword2, keyword3),
      workDate: workDate.trim() || null,
      statusFilter: { ...statusFilter },
      materialUsableOnly: false
    };

    const result = filterFactory1RresultRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setBulkTransferSelectedIds(new Set());
    setMaterialSelectedIds(new Set());
    setSearchMessage(
      result.totalCount === 0
        ? "対象データがありません"
        : result.truncated
          ? `対象データ：${result.totalCount.toLocaleString("ja-JP")}件。${FACTORY1_RRESULT_MAX_ROWS}件以内になるよう、条件を絞ってください`
          : null
    );
  };

  const handleBulkTransferToggle = useCallback((row: Factory1RresultRow) => {
    if (!row.isBulkTransferSelectable) return;
    setBulkTransferSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const handleMaterialToggle = useCallback((row: Factory1RresultRow) => {
    if (!row.isMaterialSelectable) return;
    setMaterialSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const handleRowSelect = useCallback((row: Factory1RresultRow) => {
    setSelectedRowId(row.id);
  }, []);

  const handleOpenRegister = useCallback(() => {
    setEditMode("create");
    setEditCopyRow(selectedRow);
    setEditOpen(true);
  }, [selectedRow]);

  const handleOpenEdit = useCallback(() => {
    if (!selectedRow) return;
    setEditMode(isLockedRow ? "locked" : "update");
    setEditCopyRow(null);
    setEditOpen(true);
  }, [selectedRow, isLockedRow]);

  const handleOpenDelete = useCallback(() => {
    if (!selectedRow) return;
    setEditMode(isLockedRow ? "locked" : "delete");
    setEditCopyRow(null);
    setEditOpen(true);
  }, [selectedRow, isLockedRow]);

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
    setEditCopyRow(null);
    setEditMode("create");
  }, []);

  return (
    <main className="page factory1RresultPage">
      <header className="toolbar">
        <h1 className="title">第1工場生産実績情報一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="factory1RresultHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="factory1RresultHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件${
                filterResult.totalCount !== filterResult.rows.length
                  ? `（該当 ${filterResult.totalCount.toLocaleString("ja-JP")} 件）`
                  : ""
              }（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="factory1RresultHint warn">{searchMessage}</p> : null}

      <section className="factory1RresultToolbarRow factory1RresultToolbarRowMenu" aria-label="操作メニュー">
        <div className="factory1RresultMenuActions">
          <button type="button" className="factory2DarkButton" onClick={handleOpenRegister}>
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={hasSelection ? (isLockedRow ? "確定済のため参照のみ" : "選択行を変更") : "行を選択してください"}
            onClick={handleOpenEdit}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={hasSelection ? (isLockedRow ? "確定済のため参照のみ" : "選択行を削除") : "行を選択してください"}
            onClick={handleOpenDelete}
          >
            削除
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasBulkTransferSelection}
            title={hasBulkTransferSelection ? "一括変更（未実装）" : "一括変更対象を選択してください"}
          >
            一括変更
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasBulkTransferSelection}
            title={hasBulkTransferSelection ? "一括受入（未実装）" : "一括受入対象を選択してください"}
          >
            一括受入
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasSelection}
            title={hasSelection ? "原料受入（未実装）" : "行を選択してください"}
          >
            原料受入
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasMaterialSelection}
            title={hasMaterialSelection ? "原料登録（未実装）" : "原料対象を選択してください"}
          >
            原料登録
          </button>
          <button type="button" className="factory2DarkButton wide" disabled title="未実装">
            製造実績リスト
          </button>
        </div>
      </section>

      <section className="factory1RresultToolbarRow factory1RresultToolbarRowSearch" aria-label="検索条件">
        <span className="factory1RresultFieldLabel">年度</span>
        <div className="factory1RresultMakeYearWrap">
          <Factory2MakeYearSpinner value={year} onChange={setYear} />
        </div>

        <span className="factory1RresultFieldLabel">キーワード</span>
        <input
          className="factory1RresultKeywordInput"
          type="text"
          value={keyword1}
          onChange={(e) => setKeyword1(e.target.value)}
          aria-label="キーワード1"
          autoComplete="off"
        />
        <input
          className="factory1RresultKeywordInput"
          type="text"
          value={keyword2}
          onChange={(e) => setKeyword2(e.target.value)}
          aria-label="キーワード2"
          autoComplete="off"
        />
        <input
          className="factory1RresultKeywordInput"
          type="text"
          value={keyword3}
          onChange={(e) => setKeyword3(e.target.value)}
          aria-label="キーワード3"
          autoComplete="off"
        />

        <span className="factory1RresultFieldLabel">生産日</span>
        <input
          className="factory1RresultDateInput"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          aria-label="生産日"
        />

        <div className="factory1RresultStatusGroup" role="group" aria-label="残量状況">
          <label>
            <input
              type="checkbox"
              checked={statusFilter.mi}
              onChange={(e) => setStatusFilter((p) => ({ ...p, mi: e.target.checked }))}
            />
            未
          </label>
          <label>
            <input
              type="checkbox"
              checked={statusFilter.zan}
              onChange={(e) => setStatusFilter((p) => ({ ...p, zan: e.target.checked }))}
            />
            残
          </label>
          <label>
            <input
              type="checkbox"
              checked={statusFilter.kan}
              onChange={(e) => setStatusFilter((p) => ({ ...p, kan: e.target.checked }))}
            />
            完
          </label>
          <label>
            <input
              type="checkbox"
              checked={statusFilter.go}
              onChange={(e) => setStatusFilter((p) => ({ ...p, go: e.target.checked }))}
            />
            誤
          </label>
        </div>
        <button
          type="button"
          className="factory2DarkButton"
          disabled={!searchEnabled || loading}
          onClick={handleSearch}
          title={searchEnabled ? "検索条件で一覧を表示" : "年度を指定してください"}
        >
          検索
        </button>
      </section>

      <Factory1RresultEditModal
        open={editOpen}
        onClose={handleCloseEdit}
        mode={editMode}
        initialYear={year}
        targetRow={selectedRow}
        copySourceRow={editCopyRow}
      />

      <section className="tableWrap factory1RresultTableWrap">
        <MantineZoomProvider>
          <div className="factory1RresultTableInner">
            <Factory1RresultMantineTable
              rows={filterResult.rows}
              selectedRowId={selectedRowId}
              onRowSelect={handleRowSelect}
              bulkTransferSelectedIds={bulkTransferSelectedIds}
              onBulkTransferToggle={handleBulkTransferToggle}
              materialSelectedIds={materialSelectedIds}
              onMaterialToggle={handleMaterialToggle}
              searchExecuted={searchExecuted}
            />
          </div>
        </MantineZoomProvider>
      </section>
    </main>
  );
}
