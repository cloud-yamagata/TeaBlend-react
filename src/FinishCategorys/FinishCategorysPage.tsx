/**
 * 仕上個別情報登録（旧 FinishCategorys MainWindow）
 */
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  finishCategoryMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom
} from "../repository/masterData";
import { buildFinishCategoryList } from "./buildFinishCategoryList";
import { buildFinishCategoryEditForm } from "./buildFinishCategoryEditForm";
import { FinishCategorysEditModal } from "./FinishCategorysEditModal";
import { FinishCategorysMantineTable } from "./FinishCategorysMantineTable";
import {
  filterFinishCategoryRows,
  isFinishCategorySearchEnabled
} from "./filterFinishCategoryRows";
import type { FinishCategoryAppliedSearchCriteria, FinishCategoryRow } from "./types";
import {
  finishCategoryLotStatusRadioAtom,
  finishCategoryMutationErrorAtom,
  finishCategorySearchAppliedCriteriaAtom,
  finishCategorySearchLotNameAtom,
  finishCategorySearchOrganicCheckAtom,
  finishCategorySearchWorkDateAtom,
  finishCategoryYearAtom
} from "./store";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./finishCategorysTable.css";

export default function FinishCategorysPage() {
  const cache = useAtomValue(masterEntityCacheAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(finishCategoryMasterErrorAtom);
  const mutationError = useAtomValue(finishCategoryMutationErrorAtom);

  const [year, setYear] = useAtom(finishCategoryYearAtom);
  const [lotStatusRadio, setLotStatusRadio] = useAtom(finishCategoryLotStatusRadioAtom);
  const [workDate, setWorkDate] = useAtom(finishCategorySearchWorkDateAtom);
  const [lotNameQuery, setLotNameQuery] = useAtom(finishCategorySearchLotNameAtom);
  const [organicCheck, setOrganicCheck] = useAtom(finishCategorySearchOrganicCheckAtom);
  const [appliedCriteria, setAppliedCriteria] = useAtom(finishCategorySearchAppliedCriteriaAtom);

  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReturnType<typeof buildFinishCategoryEditForm> | null>(
    null
  );

  const allRows = useMemo(() => buildFinishCategoryList(cache), [cache]);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterFinishCategoryRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isFinishCategorySearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria: FinishCategoryAppliedSearchCriteria = {
      year: normalizeMakeYearFromForm(year),
      lotStatusRadio,
      workDate: workDate.trim() || null,
      lotNameQuery: lotNameQuery.trim(),
      organicCheck: { ...organicCheck }
    };

    const result = filterFinishCategoryRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(result.totalCount === 0 ? "対象データがありません" : null);
  };

  const handleRowSelect = useCallback((row: FinishCategoryRow) => {
    setSelectedRowId(row.id);
  }, []);

  const selectedRow = useMemo((): FinishCategoryRow | null => {
    if (!selectedRowId) return null;
    return filterResult.rows.find((row) => row.id === selectedRowId) ?? null;
  }, [selectedRowId, filterResult.rows]);

  const openEditModal = () => {
    if (!selectedRow) return;
    setEditForm(buildFinishCategoryEditForm(cache, selectedRow));
  };

  return (
    <main className="page finishCategoryPage">
      <header className="toolbar">
        <h1 className="title">仕上製造実績一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {mutationError ? <p className="error">{mutationError}</p> : null}
      {loading ? <p className="finishCategoryHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="finishCategoryHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="finishCategoryHint warn">{searchMessage}</p> : null}

      <section className="finishCategoryToolbarRow finishCategoryToolbarRowMenu" aria-label="登録メニュー">
        <div className="finishCategoryMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            onClick={openEditModal}
            title={hasSelection ? "仕上個別情報登録画面を開く" : "行を1件選択してください"}
          >
            登録
          </button>
        </div>
      </section>

      <section className="finishCategoryToolbarRow finishCategoryToolbarRowSearch" aria-label="検索条件">
        <div className="finishCategorySearchField">
          <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
          <div className="finishCategoryMakeYearWrap">
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </div>

        <fieldset className="finishCategoryGroupBox">
          <legend>状態</legend>
          <label className="finishCategoryRadioLabel">
            <input
              type="radio"
              name="finishLotStatusRadio"
              checked={lotStatusRadio === "all"}
              onChange={() => setLotStatusRadio("all")}
            />
            ALL
          </label>
          <label className="finishCategoryRadioLabel">
            <input
              type="radio"
              name="finishLotStatusRadio"
              checked={lotStatusRadio === "active"}
              onChange={() => setLotStatusRadio("active")}
            />
            仕掛
          </label>
          <label className="finishCategoryRadioLabel">
            <input
              type="radio"
              name="finishLotStatusRadio"
              checked={lotStatusRadio === "complete"}
              onChange={() => setLotStatusRadio("complete")}
            />
            完了
          </label>
          <label className="finishCategoryRadioLabel">
            <input
              type="radio"
              name="finishLotStatusRadio"
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
          className="finishCategoryNameInput"
          type="text"
          value={lotNameQuery}
          onChange={(e) => setLotNameQuery(e.target.value)}
          placeholder="名称"
          aria-label="名称"
          autoComplete="off"
        />

        <fieldset className="finishCategoryGroupBox">
          <legend>有機</legend>
          <label className="finishCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.organic}
              onChange={(e) => setOrganicCheck((p) => ({ ...p, organic: e.target.checked }))}
            />
            有機
          </label>
          <label className="finishCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.pesticideFree}
              onChange={(e) =>
                setOrganicCheck((p) => ({ ...p, pesticideFree: e.target.checked }))
              }
            />
            無農薬
          </label>
          <label className="finishCategoryCheckLabel">
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

      <section className="tableWrap finishCategoryTableWrap">
        <MantineZoomProvider>
          <FinishCategorysMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editForm ? (
        <FinishCategorysEditModal
          key={`finish-edit-${editForm.lotNo}`}
          form={editForm}
          onClose={() => setEditForm(null)}
        />
      ) : null}
    </main>
  );
}
