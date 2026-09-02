/**
 * 第3工場入出庫情報メンテナンス（te_store_transfer・store_no=3）
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  storeTransferMasterErrorAtom
} from "../repository/masterData";
import { buildStoreTransferList } from "./buildStoreTransferList";
import { isAdjustableRow } from "./storeTransferDisplay";
import {
  buildStoreTransferSearchCriteria,
  filterStoreTransferRows,
  isStoreTransferSearchEnabled
} from "./storeTransferSearchCriteria";
import { StoreTransferEditModal } from "./StoreTransferEditModal";
import { StoreTransferMantineTable } from "./StoreTransferMantineTable";
import type {
  StoreTransferAppliedSearchCriteria,
  StoreTransferResultTypeFilter,
  StoreTransferRow,
  StoreTransferTransferTypeFilter
} from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./storeTransferTable.css";

const defaultTransferTypeFilter = (): StoreTransferTransferTypeFilter => ({
  "1": false,
  "2": false,
  "3": false
});

const defaultResultTypeFilter = (): StoreTransferResultTypeFilter => ({
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false,
  "8": false
});

const storeTransferRowsAtom = atom((get) => buildStoreTransferList(get(masterEntityCacheAtom)));

const formatSearchMessage = (totalCount: number): string | null =>
  totalCount === 0 ? "対象データがありません" : null;

export default function StoreTransferPage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(storeTransferMasterErrorAtom);
  const allRows = useAtomValue(storeTransferRowsAtom);

  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);
  const [year, setYear] = useState(getDefaultMakeYear);
  const [lotNo, setLotNo] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferTypeFilter, setTransferTypeFilter] =
    useState<StoreTransferTransferTypeFilter>(defaultTransferTypeFilter);
  const [resultTypeFilter, setResultTypeFilter] = useState<StoreTransferResultTypeFilter>(defaultResultTypeFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<StoreTransferAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "update">("update");
  const [actionError, setActionError] = useState("");

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterStoreTransferRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isStoreTransferSearchEnabled({
    yearFilterEnabled,
    year,
    lotNo,
    transferDate,
    transferTypeFilter,
    resultTypeFilter
  });
  const hasSelection = selectedRowId != null;

  const selectedRow = useMemo(
    () => (selectedRowId != null ? (filterResult.rows.find((r) => r.id === selectedRowId) ?? null) : null),
    [filterResult.rows, selectedRowId]
  );

  const canAdjust = selectedRow != null && isAdjustableRow(selectedRow.transferType, selectedRow.resultType);

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria = buildStoreTransferSearchCriteria(
      yearFilterEnabled ? normalizeMakeYearFromForm(year) : null,
      lotNo,
      transferDate,
      transferTypeFilter,
      resultTypeFilter
    );

    const result = filterStoreTransferRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(formatSearchMessage(result.totalCount));
    setActionError("");
    setEditOpen(false);
  };

  const handleRowSelect = useCallback((row: StoreTransferRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    setEditMode("create");
    setEditOpen(true);
  };

  const openChange = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する入出庫情報を一覧から選択してください。");
      return;
    }
    setEditMode("update");
    setEditOpen(true);
  };

  return (
    <main className="page storeTransferPage">
      <header className="toolbar">
        <h1 className="title">第3工場入出庫情報メンテナンス</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="storeTransferHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="storeTransferHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length} 件（マスタ ${allRows.length} 件${
                appliedCriteria?.year == null ? "・全年度" : `・年度 ${appliedCriteria.year}`
              }）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="storeTransferSearchMessage">{searchMessage}</p> : null}
      {actionError ? (
        <p className="storeTransferSearchMessage" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="storeTransferToolbarRow storeTransferToolbarRowMenu" aria-label="操作メニュー">
        <div className="storeTransferMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            onClick={openRegister}
            title="入出庫情報を新規登録"
          >
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            onClick={openChange}
            title={hasSelection ? "選択行を変更" : "行を選択してください"}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={hasSelection ? "選択行を削除" : "行を選択してください"}
          >
            削除
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!canAdjust}
            title={
              !hasSelection
                ? "行を選択してください"
                : canAdjust
                  ? "入庫調整を登録"
                  : "指定された実績は調整対象外です"
            }
          >
            入庫調整
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!canAdjust}
            title={
              !hasSelection
                ? "行を選択してください"
                : canAdjust
                  ? "出庫調整を登録"
                  : "指定された実績は調整対象外です"
            }
          >
            出庫調整
          </button>
        </div>
      </section>

      <section className="storeTransferSearchPanel" aria-label="検索条件">
        <fieldset className="storeTransferFilterGroup storeTransferSearchYearGroup">
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
            className={`storeTransferMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!yearFilterEnabled}
          >
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </fieldset>

        <span className="factory2FieldLabel factory2FieldLabelCompact">ロットNO</span>
        <input
          className="storeTransferLotNoInput"
          type="text"
          value={lotNo}
          onChange={(e) => setLotNo(e.target.value)}
          aria-label="ロットNO"
          autoComplete="off"
        />

        <span className="factory2FieldLabel factory2FieldLabelCompact">移動日</span>
        <input
          className="factory2TextInput date factory2DateCompact"
          type="date"
          value={transferDate}
          onChange={(e) => setTransferDate(e.target.value)}
          aria-label="移動日"
        />

        <fieldset className="storeTransferFilterGroup">
          <legend>移動種別</legend>
          <label>
            <input
              type="checkbox"
              checked={transferTypeFilter["1"]}
              onChange={(e) => setTransferTypeFilter((p) => ({ ...p, "1": e.target.checked }))}
            />
            入庫
          </label>
          <label>
            <input
              type="checkbox"
              checked={transferTypeFilter["2"]}
              onChange={(e) => setTransferTypeFilter((p) => ({ ...p, "2": e.target.checked }))}
            />
            出庫
          </label>
          <label>
            <input
              type="checkbox"
              checked={transferTypeFilter["3"]}
              onChange={(e) => setTransferTypeFilter((p) => ({ ...p, "3": e.target.checked }))}
            />
            移動
          </label>
        </fieldset>

        <fieldset className="storeTransferFilterGroup storeTransferFilterGroupResult">
          <legend>実績種別</legend>
          {(
            [
              ["1", "生産"],
              ["2", "使用"],
              ["3", "受入"],
              ["4", "入荷"],
              ["5", "出荷"],
              ["8", "調整"]
            ] as const
          ).map(([code, label]) => (
            <label key={code}>
              <input
                type="checkbox"
                checked={resultTypeFilter[code]}
                onChange={(e) =>
                  setResultTypeFilter((p) => ({ ...p, [code]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className="factory2DarkButton storeTransferSearchButton"
          disabled={!searchEnabled || loading}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、ロットNO・移動日・区分のいずれかを指定してください"
          }
        >
          検索
        </button>
      </section>

      <section className="tableWrap storeTransferTableWrap">
        <MantineZoomProvider>
          <StoreTransferMantineTable
            rows={filterResult.rows}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && (editMode === "create" || selectedRow) ? (
        <StoreTransferEditModal
          open={editOpen}
          mode={editMode}
          targetRow={editMode === "update" ? selectedRow : null}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </main>
  );
}
