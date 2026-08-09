/**
 * 配合個別情報登録（旧 BlendCategorys MainWindow）
 */
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  blendCategoryMasterErrorAtom,
  masterDataLoadingAtom,
  masterEntityCacheAtom
} from "../repository/masterData";
import { buildBlendCategoryList } from "./buildBlendCategoryList";
import { buildBlendCategoryEditForm } from "./buildBlendCategoryEditForm";
import { BlendCategorysEditModal } from "./BlendCategorysEditModal";
import { BlendCategorysMantineTable } from "./BlendCategorysMantineTable";
import {
  filterBlendCategoryRows,
  isBlendCategorySearchEnabled
} from "./filterBlendCategoryRows";
import type {
  BlendCategoryAppliedSearchCriteria,
  BlendCategoryOrganicCheck,
  BlendCategoryRow
} from "./types";
import {
  blendCategoryLotStatusRadioAtom,
  blendCategoryMutationErrorAtom,
  blendCategorySearchAppliedCriteriaAtom,
  blendCategorySearchLotNameAtom,
  blendCategorySearchOrganicCheckAtom,
  blendCategorySearchWorkDateAtom,
  blendCategoryYearAtom
} from "./store";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./blendCategorysTable.css";

export default function BlendCategorysPage() {
  const cache = useAtomValue(masterEntityCacheAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(blendCategoryMasterErrorAtom);
  const mutationError = useAtomValue(blendCategoryMutationErrorAtom);

  const [year, setYear] = useAtom(blendCategoryYearAtom);
  const [lotStatusRadio, setLotStatusRadio] = useAtom(blendCategoryLotStatusRadioAtom);
  const [workDate, setWorkDate] = useAtom(blendCategorySearchWorkDateAtom);
  const [lotNameQuery, setLotNameQuery] = useAtom(blendCategorySearchLotNameAtom);
  const [organicCheck, setOrganicCheck] = useAtom(blendCategorySearchOrganicCheckAtom);
  const [appliedCriteria, setAppliedCriteria] = useAtom(blendCategorySearchAppliedCriteriaAtom);

  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReturnType<typeof buildBlendCategoryEditForm> | null>(
    null
  );

  const allRows = useMemo(() => buildBlendCategoryList(cache), [cache]);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterBlendCategoryRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isBlendCategorySearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria: BlendCategoryAppliedSearchCriteria = {
      year: normalizeMakeYearFromForm(year),
      lotStatusRadio,
      workDate: workDate.trim() || null,
      lotNameQuery: lotNameQuery.trim(),
      organicCheck: { ...organicCheck }
    };

    const result = filterBlendCategoryRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(result.totalCount === 0 ? "対象データがありません" : null);
  };

  const handleRowSelect = useCallback((row: BlendCategoryRow) => {
    setSelectedRowId(row.id);
  }, []);

  const selectedRow = useMemo((): BlendCategoryRow | null => {
    if (!selectedRowId) return null;
    return filterResult.rows.find((row) => row.id === selectedRowId) ?? null;
  }, [selectedRowId, filterResult.rows]);

  const openEditModal = () => {
    if (!selectedRow) return;
    setEditForm(buildBlendCategoryEditForm(cache, selectedRow));
  };

  return (
    <main className="page blendCategoryPage">
      <header className="toolbar">
        <h1 className="title">配合製造実績一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {mutationError ? <p className="error">{mutationError}</p> : null}
      {loading ? <p className="blendCategoryHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="blendCategoryHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="blendCategoryHint warn">{searchMessage}</p> : null}

      <section className="blendCategoryToolbarRow blendCategoryToolbarRowMenu" aria-label="登録メニュー">
        <div className="blendCategoryMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            onClick={openEditModal}
            title={hasSelection ? "配合個別情報登録画面を開く" : "行を1件選択してください"}
          >
            登録
          </button>
        </div>
      </section>

      <section className="blendCategoryToolbarRow blendCategoryToolbarRowSearch" aria-label="検索条件">
        <div className="blendCategorySearchField">
          <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
          <div className="blendCategoryMakeYearWrap">
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </div>

        <fieldset className="blendCategoryGroupBox">
          <legend>状態</legend>
          <label className="blendCategoryRadioLabel">
            <input
              type="radio"
              name="lotStatusRadio"
              checked={lotStatusRadio === "all"}
              onChange={() => setLotStatusRadio("all")}
            />
            ALL
          </label>
          <label className="blendCategoryRadioLabel">
            <input
              type="radio"
              name="lotStatusRadio"
              checked={lotStatusRadio === "active"}
              onChange={() => setLotStatusRadio("active")}
            />
            仕掛
          </label>
          <label className="blendCategoryRadioLabel">
            <input
              type="radio"
              name="lotStatusRadio"
              checked={lotStatusRadio === "complete"}
              onChange={() => setLotStatusRadio("complete")}
            />
            完了
          </label>
          <label className="blendCategoryRadioLabel">
            <input
              type="radio"
              name="lotStatusRadio"
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
          className="blendCategoryNameInput"
          type="text"
          value={lotNameQuery}
          onChange={(e) => setLotNameQuery(e.target.value)}
          placeholder="名称"
          aria-label="名称"
          autoComplete="off"
        />

        <fieldset className="blendCategoryGroupBox">
          <legend>有機</legend>
          <label className="blendCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.organic}
              onChange={(e) =>
                setOrganicCheck((p: BlendCategoryOrganicCheck) => ({ ...p, organic: e.target.checked }))
              }
            />
            有機
          </label>
          <label className="blendCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.pesticideFree}
              onChange={(e) =>
                setOrganicCheck((p: BlendCategoryOrganicCheck) => ({
                  ...p,
                  pesticideFree: e.target.checked
                }))
              }
            />
            無農薬
          </label>
          <label className="blendCategoryCheckLabel">
            <input
              type="checkbox"
              checked={organicCheck.general}
              onChange={(e) =>
                setOrganicCheck((p: BlendCategoryOrganicCheck) => ({ ...p, general: e.target.checked }))
              }
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

      <section className="tableWrap blendCategoryTableWrap">
        <MantineZoomProvider>
          <BlendCategorysMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editForm ? (
        <BlendCategorysEditModal
          key={`blend-edit-${editForm.lotNo}`}
          form={editForm}
          onClose={() => setEditForm(null)}
        />
      ) : null}
    </main>
  );
}
