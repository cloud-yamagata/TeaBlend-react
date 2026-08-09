/**
 * 第2工場入出庫実績（旧 StoreTransferFa2 MainWindow.xaml）
 * 変更: 入出庫情報編集（EditWindow EditType=2）
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  storeTransferFa2MasterErrorAtom
} from "../repository/masterData";
import { buildStoreTransferFa2List } from "./buildStoreTransferFa2List";
import { isAdjustableRow } from "./storeTransferFa2Display";
import {
  buildStoreTransferFa2SearchCriteria,
  filterStoreTransferFa2Rows,
  isStoreTransferFa2SearchEnabled
} from "./storeTransferFa2SearchCriteria";
import { StoreTransferFa2EditModal } from "./StoreTransferFa2EditModal";
import { StoreTransferFa2MantineTable } from "./StoreTransferFa2MantineTable";
import type {
  StoreTransferFa2AppliedSearchCriteria,
  StoreTransferFa2ProcessFilter,
  StoreTransferFa2ResultTypeFilter,
  StoreTransferFa2Row,
  StoreTransferFa2TransferTypeFilter
} from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./storeTransferFa2Table.css";

const defaultProcessFilter = (): StoreTransferFa2ProcessFilter => ({
  "01": false,
  "02": false,
  "03": false,
  "04": false,
  "05": false
});

const defaultTransferTypeFilter = (): StoreTransferFa2TransferTypeFilter => ({
  "1": false,
  "2": false,
  "3": false
});

const defaultResultTypeFilter = (): StoreTransferFa2ResultTypeFilter => ({
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false,
  "8": false
});

const storeTransferFa2RowsAtom = atom((get) => buildStoreTransferFa2List(get(masterEntityCacheAtom)));

const formatSearchMessage = (totalCount: number): string | null =>
  totalCount === 0 ? "対象データがありません" : null;

export default function StoreTransferFa2Page() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(storeTransferFa2MasterErrorAtom);
  const allRows = useAtomValue(storeTransferFa2RowsAtom);

  const [year, setYear] = useState(getDefaultMakeYear);
  const [lotName, setLotName] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [processFilter, setProcessFilter] = useState<StoreTransferFa2ProcessFilter>(defaultProcessFilter);
  const [transferTypeFilter, setTransferTypeFilter] =
    useState<StoreTransferFa2TransferTypeFilter>(defaultTransferTypeFilter);
  const [resultTypeFilter, setResultTypeFilter] = useState<StoreTransferFa2ResultTypeFilter>(defaultResultTypeFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<StoreTransferFa2AppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "update">("update");
  const [actionError, setActionError] = useState("");

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0 };
    }
    return filterStoreTransferFa2Rows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isStoreTransferFa2SearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const selectedRow = useMemo(
    () => (selectedRowId != null ? (filterResult.rows.find((r) => r.id === selectedRowId) ?? null) : null),
    [filterResult.rows, selectedRowId]
  );

  const canAdjust = selectedRow != null && isAdjustableRow(selectedRow.transferType, selectedRow.resultType);

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria = buildStoreTransferFa2SearchCriteria(
      normalizeMakeYearFromForm(year),
      lotName,
      transferDate,
      processFilter,
      transferTypeFilter,
      resultTypeFilter
    );

    const result = filterStoreTransferFa2Rows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(formatSearchMessage(result.totalCount));
    setActionError("");
    setEditOpen(false);
  };

  const handleRowSelect = useCallback((row: StoreTransferFa2Row) => {
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
    <main className="page storeTransferFa2Page">
      <header className="toolbar">
        <h1 className="title">入出庫情報メンテナンス</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="storeTransferFa2Hint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="storeTransferFa2Hint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length} 件（マスタ ${allRows.length} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="storeTransferFa2SearchMessage">{searchMessage}</p> : null}
      {actionError ? (
        <p className="storeTransferFa2SearchMessage" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="storeTransferFa2ToolbarRow storeTransferFa2ToolbarRowMenu" aria-label="操作メニュー">
        <div className="storeTransferFa2MenuActions">
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

      <section className="storeTransferFa2SearchPanel" aria-label="検索条件">
        <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
        <div className="storeTransferFa2MakeYearWrap">
          <Factory2MakeYearSpinner value={year} onChange={setYear} />
        </div>

        <span className="factory2FieldLabel factory2FieldLabelCompact">ロット名</span>
        <input
          className="storeTransferFa2LotNameInput"
          type="text"
          value={lotName}
          onChange={(e) => setLotName(e.target.value)}
          aria-label="ロット名"
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

        <fieldset className="storeTransferFa2FilterGroup">
          <legend>工程</legend>
          <label>
            <input
              type="checkbox"
              checked={processFilter["01"]}
              onChange={(e) => setProcessFilter((p) => ({ ...p, "01": e.target.checked }))}
            />
            荒茶原料
          </label>
          <label>
            <input
              type="checkbox"
              checked={processFilter["02"]}
              onChange={(e) => setProcessFilter((p) => ({ ...p, "02": e.target.checked }))}
            />
            荒茶配合
          </label>
          <label>
            <input
              type="checkbox"
              checked={processFilter["03"]}
              onChange={(e) => setProcessFilter((p) => ({ ...p, "03": e.target.checked }))}
            />
            仕上
          </label>
          <label>
            <input
              type="checkbox"
              checked={processFilter["04"]}
              onChange={(e) => setProcessFilter((p) => ({ ...p, "04": e.target.checked }))}
            />
            火入
          </label>
          <label>
            <input
              type="checkbox"
              checked={processFilter["05"]}
              onChange={(e) => setProcessFilter((p) => ({ ...p, "05": e.target.checked }))}
            />
            仕上配合
          </label>
        </fieldset>

        <fieldset className="storeTransferFa2FilterGroup">
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

        <fieldset className="storeTransferFa2FilterGroup storeTransferFa2FilterGroupResult">
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
          className="factory2DarkButton storeTransferFa2SearchButton"
          disabled={!searchEnabled || loading}
          onClick={handleSearch}
          title={searchEnabled ? "検索条件で一覧を表示" : "年度を指定してください"}
        >
          検索
        </button>
      </section>

      <section className="tableWrap storeTransferFa2TableWrap">
        <MantineZoomProvider>
          <StoreTransferFa2MantineTable
            rows={filterResult.rows}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && (editMode === "create" || selectedRow) ? (
        <StoreTransferFa2EditModal
          open={editOpen}
          mode={editMode}
          targetRow={editMode === "update" ? selectedRow : null}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </main>
  );
}
