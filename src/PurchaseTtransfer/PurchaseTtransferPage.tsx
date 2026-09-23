/**
 * 仕入実績情報一覧（旧 PurchaseTtransfer MainWindow.xaml）
 * 一覧は bootstrap 済みマスタ（te_purchase_tea × te_purchase_transfer 集計）から構築。
 */
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { Factory2MakeYearSpinner } from "../Factory2LotManufacture/Factory2MakeYearSpinner";
import { getDefaultMakeYear, normalizeMakeYearFromForm } from "../Factory2LotManufacture/factory2MakeYear";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterEntityCacheAtom,
  masterMaterialsAtom,
  purchaseTtransferMasterErrorAtom
} from "../repository/masterData";
import { buildPurchaseTtransferList } from "./buildPurchaseTtransferList";
import {
  filterPurchaseTtransferRows,
  isPurchaseTtransferSearchEnabled
} from "./purchaseTtransferSearchCriteria";
import { PurchaseResaleListModal } from "../PurchaseResaleList/PurchaseResaleListModal";
import { PurchaseCsvImportModal } from "./PurchaseCsvImportModal";
import { PurchaseResaleReportModal } from "./PurchaseResaleReportModal";
import { PurchaseTransferEditModal } from "./PurchaseTransferEditModal";
import { PurchaseTtransferEditModal, type PurchaseTtransferEditModalMode } from "./PurchaseTtransferEditModal";
import { PurchaseTtransferMantineTable } from "./PurchaseTtransferMantineTable";
import { exportPurchaseTeaListExcel } from "./exportPurchaseTeaListExcel";
import { materialRegistPurchaseTea } from "../repositories/purchaseTeaRepository";
import { refreshPurchaseMaterialsAtom } from "./refreshPurchaseMaterials";
import { refreshPurchaseTeaMasterAtom } from "./refreshPurchaseTeaMaster";
import type {
  PurchaseTtransferAppliedSearchCriteria,
  PurchaseTtransferMaterialFilter,
  PurchaseTtransferRow,
  PurchaseTtransferStatusFilter,
  PurchaseTtransferTargetFilter
} from "./types";
import "../MonthlyPlan/styles.css";
import "../Factory2LotManufacture/styles.css";
import "./styles.css";
import "./purchaseTtransferTable.css";

const defaultStatusFilter = (): PurchaseTtransferStatusFilter => ({
  mi: false,
  zan: false,
  kan: false,
  go: false
});

const defaultMaterialFilter = (): PurchaseTtransferMaterialFilter => ({
  mi: false,
  sumi: false
});

const defaultTargetFilter = (): PurchaseTtransferTargetFilter => ({
  ari: false,
  nashi: false
});

/** マスタキャッシュから一覧行を構築（画面再描画のたびに再計算しない） */
const purchaseTtransferRowsAtom = atom((get) =>
  buildPurchaseTtransferList(get(masterEntityCacheAtom), get(masterMaterialsAtom))
);

export default function PurchaseTtransferPage() {
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(purchaseTtransferMasterErrorAtom);
  const allRows = useAtomValue(purchaseTtransferRowsAtom);

  const [yearFilterEnabled, setYearFilterEnabled] = useState(true);
  const [year, setYear] = useState(getDefaultMakeYear);
  const [keyword1, setKeyword1] = useState("");
  const [keyword2, setKeyword2] = useState("");
  const [keyword3, setKeyword3] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseTtransferStatusFilter>(defaultStatusFilter);
  const [materialFilter, setMaterialFilter] = useState<PurchaseTtransferMaterialFilter>(defaultMaterialFilter);
  const [targetFilter, setTargetFilter] = useState<PurchaseTtransferTargetFilter>(defaultTargetFilter);
  const [appliedCriteria, setAppliedCriteria] = useState<PurchaseTtransferAppliedSearchCriteria | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<PurchaseTtransferEditModalMode>("create");
  const [editCopyRow, setEditCopyRow] = useState<PurchaseTtransferRow | null>(null);
  const [bulkUpdateSelectedIds, setBulkUpdateSelectedIds] = useState<Set<string>>(() => new Set());
  const [materialSelectedIds, setMaterialSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [transferListOpen, setTransferListOpen] = useState(false);
  const [resaleReportOpen, setResaleReportOpen] = useState(false);
  const [materialRegisting, setMaterialRegisting] = useState(false);

  const refreshMaterials = useSetAtom(refreshPurchaseMaterialsAtom);
  const refreshPurchaseTea = useSetAtom(refreshPurchaseTeaMasterAtom);

  const rows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterPurchaseTtransferRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isPurchaseTtransferSearchEnabled({
    yearFilterEnabled,
    year,
    purchaseDate,
    statusFilter,
    materialFilter,
    targetFilter
  });
  const hasSelection = selectedRowId != null;

  const selectedRow = useMemo(
    () => (selectedRowId != null ? (rows.find((r) => r.id === selectedRowId) ?? null) : null),
    [rows, selectedRowId]
  );

  const hasBulkUpdateSelection = bulkUpdateSelectedIds.size > 0;
  const hasMaterialSelection = materialSelectedIds.size > 0;

  const bulkTransferRows = useMemo(
    () => allRows.filter((row) => bulkUpdateSelectedIds.has(row.id)),
    [allRows, bulkUpdateSelectedIds]
  );

  const modifyDisabledTitle = hasSelection ? undefined : "行を選択してください";

  const handleSearch = () => {
    if (!searchEnabled) return;
    setAppliedCriteria({
      year: yearFilterEnabled ? normalizeMakeYearFromForm(year) : null,
      purchaseDate: purchaseDate.trim() || null,
      statusFilter: { ...statusFilter },
      materialFilter: { ...materialFilter },
      targetFilter: { ...targetFilter }
    });
    setSelectedRowId(null);
    setBulkUpdateSelectedIds(new Set());
    setMaterialSelectedIds(new Set());
  };

  const handleBulkUpdateToggle = useCallback((row: PurchaseTtransferRow) => {
    if (!row.isBulkUpdateSelectable) return;
    setBulkUpdateSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const handleRowSelect = useCallback((row: PurchaseTtransferRow) => {
    setSelectedRowId(row.id);
  }, []);

  const handleOpenRegister = useCallback(() => {
    setEditMode("create");
    setEditCopyRow(selectedRow);
    setEditOpen(true);
  }, [selectedRow]);

  const handleOpenUpdate = useCallback(() => {
    if (!selectedRow) return;
    setEditMode("update");
    setEditCopyRow(null);
    setEditOpen(true);
  }, [selectedRow]);

  const handleOpenDelete = useCallback(() => {
    if (!selectedRow) return;
    setEditMode("delete");
    setEditCopyRow(null);
    setEditOpen(true);
  }, [selectedRow]);

  const handleMaterialToggle = useCallback((row: PurchaseTtransferRow) => {
    if (!row.isMaterialSelectable) return;
    setMaterialSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const handleMaterialRegist = useCallback(async () => {
    const targets = allRows.filter((row) => materialSelectedIds.has(row.id) && row.isMaterialSelectable);
    if (targets.length === 0) {
      window.alert("原料登録の対象仕入品を選択してください");
      return;
    }
    if (!window.confirm("チェックされた仕入品を原料登録します。\n登録します。よろしいですか？")) {
      return;
    }
    setMaterialRegisting(true);
    try {
      for (const row of targets) {
        if (row.year == null) continue;
        await materialRegistPurchaseTea({
          year: row.year,
          purchase: row.purchase,
          bid_no: row.bidNo
        });
      }
      await refreshPurchaseTea();
      await refreshMaterials();
      setMaterialSelectedIds(new Set());
      window.alert("原料登録が完了しました");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    } finally {
      setMaterialRegisting(false);
    }
  }, [allRows, materialSelectedIds, refreshMaterials, refreshPurchaseTea]);

  const handleExportPurchaseList = useCallback(async () => {
    if (rows.length === 0) {
      window.alert("出力対象データがありません");
      return;
    }
    try {
      await exportPurchaseTeaListExcel(rows);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  }, [rows]);

  const handleOpenBulkUpdate = useCallback(() => {
    setEditMode("bulkUpdate");
    setEditCopyRow(null);
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
    setEditCopyRow(null);
    setEditMode("create");
  }, []);

  const handleBulkUpdateSuccess = useCallback(() => {
    setBulkUpdateSelectedIds(new Set());
  }, []);

  const handleBulkTransferSuccess = useCallback(() => {
    setBulkUpdateSelectedIds(new Set());
  }, []);

  const handleOpenBulkTransfer = useCallback(() => {
    setBulkTransferOpen(true);
  }, []);

  const handleCloseBulkTransfer = useCallback(() => {
    setBulkTransferOpen(false);
  }, []);

  const handleOpenTransferList = useCallback(() => {
    setTransferListOpen(true);
  }, []);

  const handleCloseTransferList = useCallback(() => {
    setTransferListOpen(false);
  }, []);

  return (
    <main className="page purchaseTtransferPage">
      <header className="toolbar">
        <h1 className="title">仕入実績情報一覧</h1>
      </header>

      {masterError ? <p className="error">{masterError}</p> : null}
      {loading ? <p className="purchaseTtransferHint">マスタ読込中…</p> : null}
      {!loading && !masterError ? (
        <p className="purchaseTtransferHint">
          {searchExecuted
            ? `一覧 ${rows.length} 件（マスタ ${allRows.length} 件${
                appliedCriteria?.year == null ? "・全年度" : `・年度 ${appliedCriteria.year}`
              }）`
            : "検索条件を指定して「検索」を押すと一覧を表示します"}
        </p>
      ) : null}

      <section className="purchaseTtransferToolbarRow purchaseTtransferToolbarRowMenu" aria-label="操作メニュー">
        <div className="purchaseTtransferMenuActions">
          <button type="button" className="factory2DarkButton" onClick={handleOpenRegister}>
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={modifyDisabledTitle ?? "選択行を変更"}
            onClick={handleOpenUpdate}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!hasSelection}
            title={modifyDisabledTitle ?? "選択行を削除"}
            onClick={handleOpenDelete}
          >
            削除
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasBulkUpdateSelection}
            title={hasBulkUpdateSelection ? "選択行を一括変更" : "一括変更対象を選択してください"}
            onClick={handleOpenBulkUpdate}
          >
            一括変更
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasSelection}
            title={hasSelection ? "選択行の振分実績一覧" : "行を選択してください"}
            onClick={handleOpenTransferList}
          >
            振分一覧
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasBulkUpdateSelection}
            title={hasBulkUpdateSelection ? "選択行を一括振分" : "一括振分対象を選択してください"}
            onClick={handleOpenBulkTransfer}
          >
            一括振分
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!hasMaterialSelection || materialRegisting}
            title={hasMaterialSelection ? "選択した仕入品を原料登録" : "原料対象を選択してください"}
            onClick={() => void handleMaterialRegist()}
          >
            原料登録
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={!searchExecuted || rows.length === 0 || loading}
            title={
              !searchExecuted
                ? "検索後に出力できます"
                : rows.length === 0
                  ? "出力対象データがありません"
                  : "検索結果を仕入リストとして Excel 出力"
            }
            onClick={() => void handleExportPurchaseList()}
          >
            仕入リスト
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={loading}
            title="転売リスト / 有機紐付リストを出力"
            onClick={() => setResaleReportOpen(true)}
          >
            転売リスト
          </button>
          <button
            type="button"
            className="factory2DarkButton wide"
            disabled={loading}
            onClick={() => setCsvImportOpen(true)}
            title="宮崎入札 CSV を取り込む"
          >
            CSV取込
          </button>
        </div>
      </section>

      <section className="purchaseTtransferToolbarRow purchaseTtransferToolbarRowSearch" aria-label="検索条件">
        <fieldset className="purchaseTtransferFilterGroup purchaseTtransferSearchYearGroup">
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
            className={`purchaseTtransferMakeYearWrap${yearFilterEnabled ? "" : " isDisabled"}`}
            aria-disabled={!yearFilterEnabled}
          >
            <Factory2MakeYearSpinner value={year} onChange={setYear} />
          </div>
        </fieldset>

        <span className="factory2FieldLabel factory2FieldLabelCompact">キーワード</span>
        <input
          className="purchaseTtransferKeywordInput"
          type="text"
          value={keyword1}
          onChange={(e) => setKeyword1(e.target.value)}
          aria-label="キーワード1"
          autoComplete="off"
        />
        <input
          className="purchaseTtransferKeywordInput"
          type="text"
          value={keyword2}
          onChange={(e) => setKeyword2(e.target.value)}
          aria-label="キーワード2"
          autoComplete="off"
        />
        <input
          className="purchaseTtransferKeywordInput"
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

        <fieldset className="purchaseTtransferFilterGroup">
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

        <fieldset className="purchaseTtransferFilterGroup">
          <legend>原料登録</legend>
          <label>
            <input
              type="checkbox"
              checked={materialFilter.mi}
              onChange={(e) => setMaterialFilter((p) => ({ ...p, mi: e.target.checked }))}
            />
            未
          </label>
          <label>
            <input
              type="checkbox"
              checked={materialFilter.sumi}
              onChange={(e) => setMaterialFilter((p) => ({ ...p, sumi: e.target.checked }))}
            />
            済
          </label>
        </fieldset>

        <fieldset className="purchaseTtransferFilterGroup">
          <legend>用途</legend>
          <label>
            <input
              type="checkbox"
              checked={targetFilter.ari}
              onChange={(e) => setTargetFilter((p) => ({ ...p, ari: e.target.checked }))}
            />
            有
          </label>
          <label>
            <input
              type="checkbox"
              checked={targetFilter.nashi}
              onChange={(e) => setTargetFilter((p) => ({ ...p, nashi: e.target.checked }))}
            />
            無
          </label>
        </fieldset>

        <button
          type="button"
          className="factory2DarkButton"
          disabled={!searchEnabled || loading}
          onClick={handleSearch}
          title={
            searchEnabled
              ? "検索条件で一覧を表示"
              : "年度チェックを入れるか、移動日・状態・原料登録・用途のいずれかを指定してください"
          }
        >
          検索
        </button>
      </section>

      <PurchaseTransferEditModal
        open={bulkTransferOpen}
        onClose={handleCloseBulkTransfer}
        mode="bulk"
        initialYear={year}
        bulkTransferTargetIds={bulkUpdateSelectedIds}
        bulkTransferRows={bulkTransferRows}
        onBulkTransferSuccess={handleBulkTransferSuccess}
      />

      <PurchaseTtransferEditModal
        open={editOpen}
        onClose={handleCloseEdit}
        mode={editMode}
        initialYear={year}
        copySourceRow={editMode === "create" ? editCopyRow : null}
        targetRow={editMode === "update" || editMode === "delete" ? selectedRow : null}
        bulkUpdateTargetIds={editMode === "bulkUpdate" ? bulkUpdateSelectedIds : undefined}
        onBulkUpdateSuccess={handleBulkUpdateSuccess}
      />

      <PurchaseCsvImportModal
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        filterYear={year}
      />

      <PurchaseResaleListModal
        open={transferListOpen}
        onClose={handleCloseTransferList}
        contextRow={selectedRow}
      />

      <PurchaseResaleReportModal
        open={resaleReportOpen}
        onClose={() => setResaleReportOpen(false)}
        year={year}
      />

      <section className="tableWrap purchaseTtransferTableWrap">
        <MantineZoomProvider>
          <PurchaseTtransferMantineTable
            rows={rows}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            bulkUpdateSelectedIds={bulkUpdateSelectedIds}
            onBulkUpdateToggle={handleBulkUpdateToggle}
            materialSelectedIds={materialSelectedIds}
            onMaterialToggle={handleMaterialToggle}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>
    </main>
  );
}
