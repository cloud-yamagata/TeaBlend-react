/**
 * 仕入受入情報一覧（旧 PurchaseReceive MainWindow.xaml）
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  purchaseTtransferMasterErrorAtom
} from "../repository/masterData";
import { buildPurchaseReceiveList } from "./buildPurchaseReceiveList";
import { PurchaseReceiveMantineTable } from "./PurchaseReceiveMantineTable";
import { PurchaseReceiveSubModal } from "./PurchaseReceiveSubModal";
import {
  filterPurchaseReceiveRows,
  isPurchaseReceiveSearchEnabled
} from "./purchaseReceiveSearchCriteria";
import type { PurchaseReceiveAppliedSearchCriteria, PurchaseReceiveRow, PurchaseReceiveStatusFilter } from "./types";
import { PURCHASE_RECEIVE_MAX_ROWS } from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./purchaseReceiveTable.css";

const defaultStatusFilter = (): PurchaseReceiveStatusFilter => ({
  mi: false,
  zan: false,
  kan: false,
  go: false
});

const purchaseReceiveRowsAtom = atom((get) => buildPurchaseReceiveList(get(masterEntityCacheAtom)));

const resolveKeywords = (k1: string, k2: string, k3: string): string[] => {
  const keywords: string[] = [];
  if (k1.trim()) keywords.push(k1.trim());
  if (k2.trim()) keywords.push(k2.trim());
  if (k3.trim()) keywords.push(k3.trim());
  return keywords;
};

export default function PurchaseReceivePage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(purchaseTtransferMasterErrorAtom);
  const allRows = useAtomValue(purchaseReceiveRowsAtom);

  const [year, setYear] = useState(getDefaultMakeYear);
  const [keyword1, setKeyword1] = useState("");
  const [keyword2, setKeyword2] = useState("");
  const [keyword3, setKeyword3] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseReceiveStatusFilter>(defaultStatusFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<PurchaseReceiveAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0, truncated: false };
    }
    return filterPurchaseReceiveRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isPurchaseReceiveSearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const selectedRow = useMemo(
    () => (selectedRowId != null ? (filterResult.rows.find((r) => r.id === selectedRowId) ?? null) : null),
    [filterResult.rows, selectedRowId]
  );

  const canOpenReceiveList = selectedRow != null && selectedRow.status !== "未";

  const handleSearch = () => {
    if (!searchEnabled) return;

    const criteria: PurchaseReceiveAppliedSearchCriteria = {
      year: normalizeMakeYearFromForm(year),
      keywords: resolveKeywords(keyword1, keyword2, keyword3),
      purchaseDate: purchaseDate.trim() || null,
      statusFilter: { ...statusFilter }
    };

    const result = filterPurchaseReceiveRows(allRows, criteria);
    setAppliedCriteria(criteria);
    setSelectedRowId(null);
    setSearchMessage(
      result.totalCount === 0
        ? "対象データがありません"
        : result.truncated
          ? `対象データ：${result.totalCount.toLocaleString("ja-JP")}件。${PURCHASE_RECEIVE_MAX_ROWS}件以内になるよう、条件を絞ってください`
          : null
    );
  };

  const handleRowSelect = useCallback((row: PurchaseReceiveRow) => {
    setSelectedRowId(row.id);
  }, []);

  const handleOpenReceiveList = useCallback(() => {
    if (!canOpenReceiveList) return;
    setSubModalOpen(true);
  }, [canOpenReceiveList]);

  return (
    <main className="page purchaseReceivePage">
      <header className="toolbar">
        <h1 className="title">仕入受入情報一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="purchaseReceiveHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="purchaseReceiveHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件${
                filterResult.totalCount !== filterResult.rows.length
                  ? `（該当 ${filterResult.totalCount.toLocaleString("ja-JP")} 件）`
                  : ""
              }（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="purchaseReceiveHint warn">{searchMessage}</p> : null}

      <section className="purchaseReceiveToolbarRow purchaseReceiveToolbarRowMenu" aria-label="操作メニュー">
        <div className="purchaseReceiveMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={hasSelection ? "受入登録（未実装）" : "行を選択してください"}
          >
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!canOpenReceiveList}
            title={
              !hasSelection
                ? "行を選択してください"
                : selectedRow?.status === "未"
                  ? "残量状況が対象外です"
                  : "受入実績一覧"
            }
            onClick={handleOpenReceiveList}
          >
            受入一覧
          </button>
          <button type="button" className="factory2DarkButton" disabled title="未実装">
            Excel
          </button>
        </div>
      </section>

      <section className="purchaseReceiveToolbarRow purchaseReceiveToolbarRowSearch" aria-label="検索条件">
        <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
        <div className="purchaseReceiveMakeYearWrap">
          <Factory2MakeYearSpinner value={year} onChange={setYear} />
        </div>

        <span className="factory2FieldLabel factory2FieldLabelCompact">キーワード</span>
        <input
          className="purchaseReceiveKeywordInput"
          type="text"
          value={keyword1}
          onChange={(e) => setKeyword1(e.target.value)}
          aria-label="キーワード1"
          autoComplete="off"
        />
        <input
          className="purchaseReceiveKeywordInput"
          type="text"
          value={keyword2}
          onChange={(e) => setKeyword2(e.target.value)}
          aria-label="キーワード2"
          autoComplete="off"
        />
        <input
          className="purchaseReceiveKeywordInput"
          type="text"
          value={keyword3}
          onChange={(e) => setKeyword3(e.target.value)}
          aria-label="キーワード3"
          autoComplete="off"
        />

        <span className="factory2FieldLabel factory2FieldLabelCompact">仕入日</span>
        <input
          className="factory2TextInput date factory2DateCompact"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          aria-label="仕入日"
        />

        <fieldset className="purchaseReceiveFilterGroup">
          <legend>残量状況</legend>
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

      <PurchaseReceiveSubModal
        open={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        contextRow={selectedRow}
      />

      <section className="tableWrap purchaseReceiveTableWrap">
        <MantineZoomProvider>
          <PurchaseReceiveMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>
    </main>
  );
}
