/**
 * 火入個別情報登録（旧 FirepanCategorys MainWindow）
 */
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  firepanCategoryMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom
} from "../repository/masterData";
import { buildFirepanCategoryList } from "./buildFirepanCategoryList";
import { buildFirepanCategoryEditForm } from "./buildFirepanCategoryEditForm";
import { FirepanCategorysEditModal } from "./FirepanCategorysEditModal";
import { FirepanCategorysMantineTable } from "./FirepanCategorysMantineTable";
import {
  filterFirepanCategoryRows,
  isFirepanCategorySearchEnabled
} from "./filterFirepanCategoryRows";
import type { FirepanCategoryAppliedSearchCriteria, FirepanCategoryRow } from "./types";
import {
  firepanCategoryLotStatusRadioAtom,
  firepanCategoryMutationErrorAtom,
  firepanCategorySearchAppliedCriteriaAtom,
  firepanCategorySearchLotNameAtom,
  firepanCategorySearchOrganicCheckAtom,
  firepanCategorySearchWorkDateAtom,
  firepanCategoryYearAtom
} from "./store";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./firepanCategorysTable.css";

export default function FirepanCategorysPage() {
  const cache = useAtomValue(masterEntityCacheAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(firepanCategoryMasterErrorAtom);
  const mutationError = useAtomValue(firepanCategoryMutationErrorAtom);

  const [year, setYear] = useAtom(firepanCategoryYearAtom);
  const [lotStatusRadio, setLotStatusRadio] = useAtom(firepanCategoryLotStatusRadioAtom);
  const [workDate, setWorkDate] = useAtom(firepanCategorySearchWorkDateAtom);
  const [lotNameQuery, setLotNameQuery] = useAtom(firepanCategorySearchLotNameAtom);
  const [organicCheck, setOrganicCheck] = useAtom(firepanCategorySearchOrganicCheckAtom);
  const [appliedCriteria, setAppliedCriteria] = useAtom(firepanCategorySearchAppliedCriteriaAtom);

  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReturnType<typeof buildFirepanCategoryEditForm> | null>(
    null
  );

  const allRows = useMemo(() => buildFirepanCategoryList(cache), [cache]);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterFirepanCategoryRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isFirepanCategorySearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria: FirepanCategoryAppliedSearchCriteria = {
      year: normalizeMakeYearFromForm(year),
      lotStatusRadio,
      workDate: workDate.trim() || null,
      lotNameQuery: lotNameQuery.trim(),
      organicCheck: { ...organicCheck }
    };

    const result = filterFirepanCategoryRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(result.totalCount === 0 ? "対象データがありません" : null);
  };

  const handleRowSelect = useCallback((row: FirepanCategoryRow) => {
    setSelectedRowId(row.id);
  }, []);

  const selectedRow = useMemo((): FirepanCategoryRow | null => {
    if (!selectedRowId) return null;
    return filterResult.rows.find((row) => row.id === selectedRowId) ?? null;
  }, [selectedRowId, filterResult.rows]);

  const openEditModal = () => {
    if (!selectedRow) return;
    setEditForm(buildFirepanCategoryEditForm(cache, selectedRow));
  };

  return (
    <main className="page firepanCategoryPage">
      <header className="toolbar">
        <h1 className="title">火入製造実績一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {mutationError ? <p className="error">{mutationError}</p> : null}
      {loading ? <p className="firepanCategoryHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="firepanCategoryHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="firepanCategoryHint warn">{searchMessage}</p> : null}

      <section className="firepanCategoryToolbarRow firepanCategoryToolbarRowMenu" aria-label="登録メニュー">
        <div className="firepanCategoryMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            onClick={openEditModal}
            title={hasSelection ? "火入個別情報登録画面を開く" : "行を1件選択してください"}
          >
            登録
          </button>
        </div>
      </section>

      <section className="firepanCategoryToolbarRow firepanCategoryToolbarRowSearch" aria-label="検索条件">
        <div className="firepanCategorySearchField">
          <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
          <div className="firepanCategoryMakeYearWrap">
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </div>

        <fieldset className="firepanCategoryGroupBox">
          <legend>状態</legend>
          <label className="firepanCategoryRadioLabel">
            <input
              type="radio"
              name="firepanLotStatusRadio"
              checked={lotStatusRadio === "all"}
              onChange={() => setLotStatusRadio("all")}
            />
            ALL
          </label>
          <label className="firepanCategoryRadioLabel">
            <input
              type="radio"
              name="firepanLotStatusRadio"
              checked={lotStatusRadio === "active"}
              onChange={() => setLotStatusRadio("active")}
            />
            仕掛
          </label>
          <label className="firepanCategoryRadioLabel">
            <input
              type="radio"
              name="firepanLotStatusRadio"
              checked={lotStatusRadio === "complete"}
              onChange={() => setLotStatusRadio("complete")}
            />
            完了
          </label>
          <label className="firepanCategoryRadioLabel">
            <input
              type="radio"
              name="firepanLotStatusRadio"
              checked={lotStatusRadio === "confirm"}
              onChange={() => setLotStatusRadio("confirm")}
            />
            確定
          </label>
        </fieldset>

        <span className="factory2FieldLabel factory2FieldLabelCompact">製造日</span>
        <input
          className="factory2TextInput date factory2DateCompact"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          aria-label="製造日"
        />

        <input
          className="firepanCategoryNameInput"
          type="text"
          value={lotNameQuery}
          onChange={(e) => setLotNameQuery(e.target.value)}
          placeholder="名称"
          aria-label="名称"
          autoComplete="off"
        />

        <fieldset className="firepanCategoryGroupBox">
          <legend>有機</legend>
          <label className="firepanCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.organic}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, organic: e.target.checked }))}
            />
            有機
          </label>
          <label className="firepanCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.pesticideFree}
              onChange={(e) =>
                setOrganicCheck((p) => ({ ...p, pesticideFree: e.target.checked }))
              }
            />
            無農薬
          </label>
          <label className="firepanCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.general}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, general: e.target.checked }))}
            />
            一般
          </label>
        </fieldset>

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

      <section className="tableWrap firepanCategoryTableWrap">
        <MantineZoomProvider>
          <FirepanCategorysMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editForm ? (
        <FirepanCategorysEditModal
          key={`firepan-edit-${editForm.lotNo}`}
          form={editForm}
          onClose={() => setEditForm(null)}
        />
      ) : null}
    </main>
  );
}
