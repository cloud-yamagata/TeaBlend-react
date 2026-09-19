/**
 * ロット在庫一覧／ロット分割（WPF LotDivide MainWindow 相当）
 *
 * メニュー: 登録（行選択時）→ 編集モーダルで再投入／転売
 * 検索: 工程・有機・製造日・名称（クライアント側）
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  storeTransferFa2MasterErrorAtom
} from "../repository/masterData";
import { buildLotDivideList } from "./buildLotDivideList";
import { LOT_DIVIDE_ORGANIC_OPTIONS } from "./lotDivideDisplay";
import { LotDivideEditModal } from "./LotDivideEditModal";
import { LotDivideMantineTable } from "./LotDivideMantineTable";
import {
  buildLotDivideSearchCriteria,
  defaultLotDivideOrganicFilter,
  defaultLotDivideProcessFilter,
  filterLotDivideRows,
  isLotDivideSearchEnabled
} from "./lotDivideSearchCriteria";
import {
  lotDivideRowToEditForm,
  type LotDivideAppliedSearchCriteria,
  type LotDivideEditForm,
  type LotDivideOrganicFilter,
  type LotDivideProcessFilter,
  type LotDivideRow
} from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "../BlendLot/styles.css";
import "../MaterialPurchase/styles.css";

const lotDivideAllRowsAtom = atom((get) => buildLotDivideList(get(masterEntityCacheAtom)));

export default function LotDividePage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(storeTransferFa2MasterErrorAtom);
  const allRows = useAtomValue(lotDivideAllRowsAtom);

  const [processFilter, setProcessFilter] = useState<LotDivideProcessFilter>(defaultLotDivideProcessFilter);
  const [organicFilter, setOrganicFilter] = useState<LotDivideOrganicFilter>(defaultLotDivideOrganicFilter);
  const [productDate, setProductDate] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [appliedCriteria, setAppliedCriteria] = useState<LotDivideAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<LotDivideEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const filterResult = useMemo(() => {
    if (!appliedCriteria) return { rows: [] as LotDivideRow[], totalCount: 0, truncated: false };
    return filterLotDivideRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isLotDivideSearchEnabled(processFilter, organicFilter, productDate, nameQuery);
  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (filterResult.rows.find((r) => r.id === selectedRowId) ?? null)),
    [filterResult.rows, selectedRowId]
  );
  const canRegister = selectedRow != null;

  const handleSearch = () => {
    if (!searchEnabled) return;
    const criteria = buildLotDivideSearchCriteria(processFilter, organicFilter, productDate, nameQuery);
    const result = filterLotDivideRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setActionError("");
    if (result.totalCount === 0) {
      setSearchMessage("対象データがありません");
    } else if (result.truncated) {
      setSearchMessage(`対象件数が多いため先頭 ${result.rows.length} 件のみ表示します（全 ${result.totalCount} 件）`);
    } else {
      setSearchMessage(null);
    }
  };

  const handleRowSelect = useCallback((row: LotDivideRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("分割するロットを一覧から選択してください。");
      return;
    }
    setEditForm(lotDivideRowToEditForm(selectedRow));
    setEditOpen(true);
  };

  return (
    <main className="page blendLotPage">
      <header className="toolbar">
        <h1 className="title">ロット在庫一覧</h1>
      </header>

      {masterError ? <p className="status error">{masterError}</p> : null}
      {loading ? <p className="blendLotHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="blendLotHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件（在庫 ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="blendLotHint">{searchMessage}</p> : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="blendLotToolbarRow blendLotToolbarRowMenu" aria-label="操作メニュー">
        <div className="blendLotMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canRegister}
            onClick={openRegister}
            title={canRegister ? "選択ロットを分割登録" : "行を選択してください"}
          >
            登録
          </button>
        </div>
      </section>

      <section className="blendLotSearchPanel" aria-label="検索条件">
        <fieldset className="blendLotSearchGroupBox">
          <legend>工程</legend>
          {(
            [
              ["02", "荒配"],
              ["03", "仕上"],
              ["04", "火入"],
              ["05", "仕配"]
            ] as const
          ).map(([code, label]) => (
            <label key={code} className="factory2CheckLabel">
              <input
                type="checkbox"
                checked={processFilter[code]}
                onChange={(e) => setProcessFilter((p) => ({ ...p, [code]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="blendLotSearchGroupBox">
          <legend>有機</legend>
          {LOT_DIVIDE_ORGANIC_OPTIONS.map(({ code, label }) => (
            <label key={code} className="factory2CheckLabel">
              <input
                type="checkbox"
                checked={organicFilter[code]}
                onChange={(e) => setOrganicFilter((p) => ({ ...p, [code]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <span className="factory2FieldLabel factory2FieldLabelCompact">製造日</span>
        <input
          className="factory2TextInput date factory2DateCompact"
          type="date"
          value={productDate}
          onChange={(e) => setProductDate(e.target.value)}
          aria-label="製造日"
        />

        <span className="factory2FieldLabel factory2FieldLabelCompact">名称</span>
        <input
          className="blendLotSearchItemNameInput"
          type="text"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="ロット名／通称名／製造No"
          aria-label="名称"
        />

        <button
          type="button"
          className="factory2DarkButton blendLotSearchButton"
          disabled={!searchEnabled}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "工程・有機・製造日・名称のいずれかを指定してください"
          }
        >
          検索
        </button>
      </section>

      <section className="tableWrap blendLotTableWrap">
        <MantineZoomProvider>
          <LotDivideMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <LotDivideEditModal
          open={editOpen}
          initialForm={editForm}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
          onDone={() => {
            setSelectedRowId(null);
          }}
        />
      ) : null}
    </main>
  );
}
