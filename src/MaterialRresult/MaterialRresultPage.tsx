/**
 * 原料実績情報一覧（旧 MaterialRresult MainWindow.xaml）
 * UI は第1工場生産実績情報一覧（Factory1Rresult）をベースにする。
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterMaterialsAtom,
  materialRresultMasterErrorAtom
} from "../repository/masterData";
import { buildMaterialRresultList } from "./buildMaterialRresultList";
import {
  MaterialRresultEditModal,
  type MaterialRresultEditModalMode
} from "./MaterialRresultEditModal";
import { MaterialRresultMantineTable } from "./MaterialRresultMantineTable";
import {
  filterMaterialRresultRows,
  isMaterialRresultSearchEnabled
} from "./materialRresultSearchCriteria";
import type {
  MaterialRresultAppliedSearchCriteria,
  MaterialRresultOrganicFilter,
  MaterialRresultRow
} from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./materialRresultTable.css";

const defaultOrganicFilter = (): MaterialRresultOrganicFilter => ({
  a: false,
  b: false,
  c: false
});

const materialRresultRowsAtom = atom((get) =>
  buildMaterialRresultList(get(masterEntityCacheAtom), get(masterMaterialsAtom))
);

const resolveKeywords = (k1: string, k2: string, k3: string): string[] => {
  const keywords: string[] = [];
  if (k1.trim()) keywords.push(k1.trim());
  if (k2.trim()) keywords.push(k2.trim());
  if (k3.trim()) keywords.push(k3.trim());
  return keywords;
};

export default function MaterialRresultPage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(materialRresultMasterErrorAtom);
  const allRows = useAtomValue(materialRresultRowsAtom);

  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);
  const [year, setYear] = useState(getDefaultMakeYear);
  const [keyword1, setKeyword1] = useState("");
  const [keyword2, setKeyword2] = useState("");
  const [keyword3, setKeyword3] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [organicFilter, setOrganicFilter] = useState<MaterialRresultOrganicFilter>(defaultOrganicFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<MaterialRresultAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [materialSelectedIds, setMaterialSelectedIds] = useState<Set<string>>(() => new Set());
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<MaterialRresultEditModalMode>("create");
  const [editCopyRow, setEditCopyRow] = useState<MaterialRresultRow | null>(null);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterMaterialRresultRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isMaterialRresultSearchEnabled({
    yearFilterEnabled,
    year,
    keyword1,
    keyword2,
    keyword3,
    purchaseDate,
    organicFilter
  });
  const hasSelection = selectedRowId != null;
  const hasMaterialSelection = materialSelectedIds.size > 0;

  const selectedRow = useMemo(
    () =>
      selectedRowId != null
        ? (filterResult.rows.find((r) => r.id === selectedRowId) ?? null)
        : null,
    [filterResult.rows, selectedRowId]
  );

  /** 確定済（原料登録済み）→ 参照のみ */
  const isLockedRow = selectedRow != null && selectedRow.status === "完";

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria: MaterialRresultAppliedSearchCriteria = {
      year: yearFilterEnabled ? normalizeMakeYearFromForm(year) : null,
      keywords: resolveKeywords(keyword1, keyword2, keyword3),
      purchaseDate: purchaseDate.trim() || null,
      organicFilter: { ...organicFilter },
      materialUsableOnly: false
    };

    const result = filterMaterialRresultRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setMaterialSelectedIds(new Set());
    setSearchMessage(result.totalCount === 0 ? "対象データがありません" : null);
  };

  const handleMaterialToggle = useCallback((row: MaterialRresultRow) => {
    if (!row.isMaterialSelectable) return;
    setMaterialSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const handleRowSelect = useCallback((row: MaterialRresultRow) => {
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
    <main className="page materialRresultPage">
      <header className="toolbar">
        <h1 className="title">原料実績情報一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="materialRresultHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="materialRresultHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件${
                filterResult.totalCount !== filterResult.rows.length
                  ? `（該当 ${filterResult.totalCount.toLocaleString("ja-JP")} 件）`
                  : ""
              }（マスタ ${allRows.length.toLocaleString("ja-JP")} 件${
                appliedCriteria?.year == null ? "・全年度" : `・年度 ${appliedCriteria.year}`
              }）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="materialRresultHint warn">{searchMessage}</p> : null}

      <section className="materialRresultToolbarRow materialRresultToolbarRowMenu" aria-label="操作メニュー">
        <div className="materialRresultMenuActions">
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
            disabled={!hasMaterialSelection}
            title={hasMaterialSelection ? "原料登録（未実装）" : "原料対象を選択してください"}
          >
            原料登録
          </button>
          <button type="button" className="factory2DarkButton wide" disabled title="未実装">
            原料実績リスト
          </button>
        </div>
      </section>

      <section className="materialRresultToolbarRow materialRresultToolbarRowSearch" aria-label="検索条件">
        <fieldset className="materialRresultFilterGroup materialRresultSearchYearGroup">
          <legend>年度</legend>
          <label>
            <input
              type="checkbox"
              checked={yearFilterEnabled}
              onChange={(e) => setYearFilterEnabled(e.target.checked)}
              aria-label="年度で絞り込む"
            />
          </label>
          <div
            className={`materialRresultMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!yearFilterEnabled}
          >
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </fieldset>

        <span className="materialRresultFieldLabel">キーワード</span>
        <input
          className="materialRresultKeywordInput"
          type="text"
          value={keyword1}
          onChange={(e) => setKeyword1(e.target.value)}
          aria-label="キーワード1"
          autoComplete="off"
        />
        <input
          className="materialRresultKeywordInput"
          type="text"
          value={keyword2}
          onChange={(e) => setKeyword2(e.target.value)}
          aria-label="キーワード2"
          autoComplete="off"
        />
        <input
          className="materialRresultKeywordInput"
          type="text"
          value={keyword3}
          onChange={(e) => setKeyword3(e.target.value)}
          aria-label="キーワード3"
          autoComplete="off"
        />

        <span className="materialRresultFieldLabel">仕入日</span>
        <input
          className="materialRresultDateInput"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          aria-label="仕入日"
        />

        <div className="materialRresultOrganicGroup" role="group" aria-label="格付">
          <label>
            <input
              type="checkbox"
              checked={organicFilter.a}
              onChange={(e) => setOrganicFilter((p) => ({ ...p, a: e.target.checked }))}
            />
            有機茶
          </label>
          <label>
            <input
              type="checkbox"
              checked={organicFilter.b}
              onChange={(e) => setOrganicFilter((p) => ({ ...p, b: e.target.checked }))}
            />
            無農薬
          </label>
          <label>
            <input
              type="checkbox"
              checked={organicFilter.c}
              onChange={(e) => setOrganicFilter((p) => ({ ...p, c: e.target.checked }))}
            />
            一般茶
          </label>
        </div>

        <button
          type="button"
          className="factory2DarkButton"
          disabled={!searchEnabled || loading}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、キーワード・仕入日・格付のいずれかを指定してください"
          }
        >
          検索
        </button>
      </section>

      <MaterialRresultEditModal
        open={editOpen}
        onClose={handleCloseEdit}
        mode={editMode}
        initialYear={year}
        targetRow={selectedRow}
        copySourceRow={editCopyRow}
      />

      <section className="tableWrap materialRresultTableWrap">
        <MantineZoomProvider>
          <MaterialRresultMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            materialSelectedIds={materialSelectedIds}
            onMaterialToggle={handleMaterialToggle}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>
    </main>
  );
}
