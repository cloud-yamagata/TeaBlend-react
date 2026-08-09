/**
 * 振分実績一覧の共通 UI（ページ・モーダル共用）
 */
import { atom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TrConstantZoomModal } from "../components/TrConstantZoomModal";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterTrConstantsAtom,
  purchaseTtransferMasterErrorAtom
} from "../repository/masterData";
import type { PurchaseTtransferRow } from "../PurchaseTtransfer/types";
import { buildPurchaseResaleList } from "./buildPurchaseResaleList";
import { exportPurchaseResaleListExcel } from "./exportPurchaseResaleListExcel";
import {
  PurchaseResaleListSearchPanel,
  type PurchaseResaleListSearchDraft
} from "./PurchaseResaleListSearchPanel";
import { PurchaseResaleListMantineTable } from "./purchaseResaleListMantineTable";
import { PurchaseResaleListToolbar } from "./PurchaseResaleListToolbar";
import {
  filterPurchaseResaleListRows,
  filterPurchaseResaleListRowsAll,
  isPurchaseResaleListSearchEnabled
} from "./purchaseResaleListSearch";
import type { PurchaseResaleListAppliedSearch, PurchaseResaleListRow } from "./types";
import { PURCHASE_RESALE_LIST_MAX_ROWS, defaultPurchaseResaleListTeaLifeFilter } from "./types";

const purchaseResaleListRowsAtom = atom((get) => buildPurchaseResaleList(get(masterEntityCacheAtom)));

type Props = {
  /** 仕入実績情報一覧から開いたときの選択行 */
  contextRow?: PurchaseTtransferRow | null;
  /** true のとき表示開始時に初期検索を実行 */
  autoSearchOnMount?: boolean;
  tableWrapClassName?: string;
};

const resolveInitialYear = (contextRow?: PurchaseTtransferRow | null): string => {
  if (contextRow?.year != null) {
    const year = contextRow.year;
    return String(year >= 100 ? year % 100 : year).padStart(2, "0");
  }
  return getDefaultMakeYear();
};

const defaultDraft = (contextRow?: PurchaseTtransferRow | null): PurchaseResaleListSearchDraft => ({
  year: resolveInitialYear(contextRow),
  transfer: "",
  teaLifeFilter: defaultPurchaseResaleListTeaLifeFilter(),
  purchaseDate: "",
  limitToContext: contextRow != null
});

const applySearchMessage = (totalCount: number, truncated: boolean): string | null => {
  if (totalCount === 0) return "対象データがありません";
  if (truncated) {
    return `対象データ：${totalCount.toLocaleString("ja-JP")}件。${PURCHASE_RESALE_LIST_MAX_ROWS}件以内になるよう、条件を絞ってください`;
  }
  return null;
};

export function PurchaseResaleListContent({
  contextRow = null,
  autoSearchOnMount = false,
  tableWrapClassName = "purchaseResaleListTableWrap"
}: Props) {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(purchaseTtransferMasterErrorAtom);
  const allRows = useAtomValue(purchaseResaleListRowsAtom);
  const trConstants = useAtomValue(masterTrConstantsAtom);

  const [draft, setDraft] = useState<PurchaseResaleListSearchDraft>(() => defaultDraft(contextRow));
  const [appliedCriteria, setAppliedCriteria] = useState<PurchaseResaleListAppliedSearch | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [transferZoomOpen, setTransferZoomOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  const contextPurchase = contextRow?.purchase ?? null;
  const contextBidNo = contextRow?.bidNo ?? null;

  const runSearch = useCallback(
    (nextDraft: PurchaseResaleListSearchDraft) => {
      const year = normalizeMakeYearFromForm(nextDraft.year);
      if (!year) return;

      const criteria: PurchaseResaleListAppliedSearch = {
        year,
        transfer: nextDraft.transfer.trim(),
        teaLifeFilter: { ...nextDraft.teaLifeFilter },
        purchaseDate: nextDraft.purchaseDate.trim(),
        contextPurchase: nextDraft.limitToContext ? contextPurchase : null,
        contextBidNo: nextDraft.limitToContext ? contextBidNo : null
      };

      const result = filterPurchaseResaleListRows(allRows, criteria);
      setAppliedCriteria(criteria);
      setSelectedRowId(null);
      setSearchMessage(applySearchMessage(result.totalCount, result.truncated));
    },
    [allRows, contextBidNo, contextPurchase]
  );

  useEffect(() => {
    setDraft(defaultDraft(contextRow));
    setAppliedCriteria(null);
    setSelectedRowId(null);
    setSearchMessage(null);
    setMountKey((k) => k + 1);
  }, [contextRow]);

  useEffect(() => {
    if (!autoSearchOnMount) return;
    const nextDraft = defaultDraft(contextRow);
    runSearch(nextDraft);
  }, [autoSearchOnMount, contextRow, mountKey, runSearch]);

  const filterResult = useMemo(() => {
    if (!appliedCriteria) {
      return { rows: [], totalCount: 0, truncated: false };
    }
    return filterPurchaseResaleListRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const exportRows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterPurchaseResaleListRowsAll(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isPurchaseResaleListSearchEnabled(draft.year);
  const excelDisabled = !searchExecuted || exportRows.length === 0 || loading;
  const excelTitle = !searchExecuted
    ? "検索実行後に Excel 出力できます"
    : exportRows.length === 0
      ? "出力対象データがありません"
      : filterResult.truncated
        ? `検索結果 ${exportRows.length.toLocaleString("ja-JP")} 件を出力（画面は先頭 ${filterResult.rows.length} 件）`
        : `検索結果 ${exportRows.length.toLocaleString("ja-JP")} 件を Excel 出力`;

  const handleSearch = useCallback(() => {
    runSearch(draft);
  }, [draft, runSearch]);

  const handleRowSelect = useCallback((row: PurchaseResaleListRow) => {
    setSelectedRowId(row.id);
  }, []);

  const handleExcelExport = useCallback(async () => {
    if (exportRows.length === 0) return;
    setExcelError(null);
    setExportingExcel(true);
    try {
      await exportPurchaseResaleListExcel(exportRows);
    } catch (e) {
      setExcelError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportingExcel(false);
    }
  }, [exportRows]);

  return (
    <>
      <PurchaseResaleListToolbar
        excelDisabled={excelDisabled}
        excelTitle={excelTitle}
        exporting={exportingExcel}
        onExcel={() => void handleExcelExport()}
      />

      {excelError ? <p className="purchaseResaleListHint error">{excelError}</p> : null}
      {masterError ? <p className="purchaseResaleListHint error">{masterError}</p> : null}
      {loading ? <p className="purchaseResaleListHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="purchaseResaleListHint">
          {searchExecuted
            ? `一覧 ${filterResult.rows.length.toLocaleString("ja-JP")} 件${
                filterResult.totalCount !== filterResult.rows.length
                  ? `（該当 ${filterResult.totalCount.toLocaleString("ja-JP")} 件）`
                  : ""
              }（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}
      {searchMessage ? <p className="purchaseResaleListHint warn">{searchMessage}</p> : null}

      <PurchaseResaleListSearchPanel
        draft={draft}
        onDraftChange={setDraft}
        contextPurchase={contextPurchase}
        contextBidNo={contextBidNo}
        searchEnabled={searchEnabled && !loading}
        onSearch={handleSearch}
        onOpenTransferZoom={() => setTransferZoomOpen(true)}
      />

      <section className={tableWrapClassName}>
        <MantineZoomProvider>
          <PurchaseResaleListMantineTable
            rows={filterResult.rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      <TrConstantZoomModal
        open={transferZoomOpen}
        onClose={() => setTransferZoomOpen(false)}
        constField="transfer"
        title="システム定数（振分先）"
        constants={trConstants}
        onSelect={(_code, constName) => {
          setDraft((prev) => ({ ...prev, transfer: constName }));
        }}
      />
    </>
  );
}
