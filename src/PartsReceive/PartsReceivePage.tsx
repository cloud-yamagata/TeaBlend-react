/**
 * 仕上品受入登録（PartsReceive MainWindow.xaml 相当）
 *
 * 検索: ロット別仕上茶在庫一覧（fetchOnce）と同型
 *   - 実行 … API から条件なし全件取得
 *   - 抽出 … キャッシュをクライアント側で絞り込み
 *   - 抽出クリア … 条件リセット＋全件表示
 */
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { fetchPartsReceiveStocks } from "../repositories/partsReceiveRepository";
import ReportActionBar from "../reports/components/ReportActionBar";
import ReportFilters, { buildDefaultFilterValues, type ReportFilterValues } from "../reports/components/ReportFilters";
import { PartsReceiveEditModal } from "./PartsReceiveEditModal";
import { PartsReceiveMantineTable } from "./PartsReceiveMantineTable";
import { filterPartsReceiveRows, mapPartsReceiveStockDto } from "./filterPartsReceiveRows";
import { PARTS_RECEIVE_FILTER_DEFS } from "./partsReceiveFilterDefs";
import { partsReceiveRowToEditForm, type PartsReceiveEditForm, type PartsReceiveRow } from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "../BlendLot/styles.css";
import "../reports/components/reportGrid.css";
import "../MaterialPurchase/materialPurchaseEditModal.css";

export default function PartsReceivePage() {
  const [cachedRows, setCachedRows] = useState<PartsReceiveRow[]>([]);
  const [rows, setRows] = useState<PartsReceiveRow[]>([]);
  const [filters, setFilters] = useState<ReportFilterValues>(() =>
    buildDefaultFilterValues(PARTS_RECEIVE_FILTER_DEFS)
  );
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<PartsReceiveEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const cacheReady = cachedRows.length > 0;
  const postRunEnabled = searchExecuted && !loading;

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canReceive = searchExecuted && selectedRow != null;

  const reloadMaster = useCallback(async (): Promise<PartsReceiveRow[] | null> => {
    setLoading(true);
    setLoadError("");
    try {
      const dtos = await fetchPartsReceiveStocks();
      const nextRows = dtos
        .map(mapPartsReceiveStockDto)
        .filter((r) => r.factory2Stock > 0 || r.factory3Stock > 0);
      setCachedRows(nextRows);
      return nextRows;
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setLoadError(`在庫一覧の取得に失敗しました: ${detail}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** 実行 … 条件なしで API 全件取得 */
  const handleRun = async () => {
    setSelectedRowId(null);
    setActionError("");
    const nextRows = await reloadMaster();
    if (nextRows == null) return;
    setRows(nextRows);
    setSearchExecuted(true);
  };

  /** 抽出 … キャッシュを条件で絞り込み */
  const handleExtract = () => {
    if (!cacheReady) return;
    setSelectedRowId(null);
    setActionError("");
    setRows(filterPartsReceiveRows(cachedRows, filters, PARTS_RECEIVE_FILTER_DEFS));
  };

  /** 抽出クリア … 条件なし＋全件表示 */
  const handleClearExtract = () => {
    if (!cacheReady) return;
    setFilters(buildDefaultFilterValues(PARTS_RECEIVE_FILTER_DEFS));
    setRows(cachedRows);
    setSelectedRowId(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: PartsReceiveRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openReceive = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("受入する仕上茶を一覧から選択してください。");
      return;
    }
    setEditForm(partsReceiveRowToEditForm(selectedRow));
    setEditOpen(true);
  };

  const handleReceived = async () => {
    setSelectedRowId(null);
    const nextRows = await reloadMaster();
    if (nextRows == null) return;
    if (searchExecuted) {
      setRows(filterPartsReceiveRows(nextRows, filters, PARTS_RECEIVE_FILTER_DEFS));
    } else {
      setRows(nextRows);
    }
  };

  const tableEmptyMessage =
    searchExecuted && rows.length === 0
      ? cacheReady
        ? "抽出条件に一致するデータがありません"
        : "表示するデータがありません。"
      : "「実行」でマスタを取得します。条件指定後は「抽出」で絞り込んでください。";

  return (
    <main className="page blendLotPage">
      <header className="toolbar">
        <h1 className="title">仕上品受入登録</h1>
      </header>

      {loading ? <p className="status">処理中...</p> : null}
      {loadError ? <p className="status error">{loadError}</p> : null}
      {!loading && !loadError ? (
        <p className="blendLotHint">
          {searchExecuted
            ? `一覧 ${rows.length.toLocaleString("ja-JP")} 件（マスタ ${cachedRows.length.toLocaleString("ja-JP")} 件）`
            : "「実行」でマスタを取得します。条件指定後は「抽出」で絞り込んでください。"}
        </p>
      ) : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="blendLotToolbarRow blendLotToolbarRowMenu" aria-label="受入メニュー">
        <div className="blendLotMenuActions">
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canReceive}
            onClick={openReceive}
            title={
              canReceive
                ? "選択行の仕上茶を受入"
                : searchExecuted
                  ? "受入する明細行を選択してください"
                  : "実行後に明細行を選択してください"
            }
          >
            受入
          </button>
        </div>
      </section>

      <ReportFilters
        filters={PARTS_RECEIVE_FILTER_DEFS}
        values={filters}
        onChange={setFilters}
        onSubmit={() => void handleRun()}
        disabled={loading}
        layout="blendLot"
        hideSubmit
        afterZoomAction={
          <ReportActionBar
            variant="extractOnly"
            onExtract={handleExtract}
            extractDisabled={!postRunEnabled || !cacheReady}
          />
        }
        actionBar={
          <ReportActionBar
            placement="searchPanel"
            onRun={() => void handleRun()}
            onClear={handleClearExtract}
            runDisabled={loading}
            clearDisabled={!postRunEnabled || !cacheReady}
          />
        }
      />

      <section className="tableWrap blendLotTableWrap">
        <MantineZoomProvider>
          <PartsReceiveMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
            emptyMessage={tableEmptyMessage}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <PartsReceiveEditModal
          open={editOpen}
          initialForm={editForm}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
          onReceived={() => {
            void handleReceived();
          }}
        />
      ) : null}
    </main>
  );
}
