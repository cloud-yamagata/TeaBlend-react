/**
 * 仕入実績情報一覧（旧 PurchaseTtransfer MainWindow.xaml）
 * 一覧は bootstrap 済みマスタ（te_purchase_tea × te_purchase_transfer 集計）から構築。
 */
import { atom, useAtomValue } from "jotai";
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
import { PurchaseTransferEditModal } from "./PurchaseTransferEditModal";
import { PurchaseTtransferEditModal, type PurchaseTtransferEditModalMode } from "./PurchaseTtransferEditModal";
import { PurchaseTtransferMantineTable } from "./PurchaseTtransferMantineTable";
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
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [transferListOpen, setTransferListOpen] = useState(false);

  const rows = useMemo(() => {
    if (!appliedCriteria) return [];
    return filterPurchaseTtransferRows(allRows, appliedCriteria);
  }, [allRows, appliedCriteria]);

  const searchExecuted = appliedCriteria != null;
  const searchEnabled = isPurchaseTtransferSearchEnabled(year);
  const hasSelection = selectedRowId != null;

  const selectedRow = useMemo(
    () => (selectedRowId != null ? (rows.find((r) => r.id === selectedRowId) ?? null) : null),
    [rows, selectedRowId]
  );

  /** 振分実績（te_purchase_transfer）が無い行のみ変更・削除可 */
  const canModifySelectedRow = selectedRow != null && !selectedRow.hasTransfer;

  const hasBulkUpdateSelection = bulkUpdateSelectedIds.size > 0;

  const bulkTransferRows = useMemo(
    () => allRows.filter((row) => bulkUpdateSelectedIds.has(row.id)),
    [allRows, bulkUpdateSelectedIds]
  );

  const modifyDisabledTitle = !hasSelection
    ? "行を選択してください"
    : selectedRow?.hasTransfer
      ? "振分実績があるため操作できません"
      : undefined;

  const handleSearch = () => {
    if (!searchEnabled) return;
    setAppliedCriteria({
      year: normalizeMakeYearFromForm(year),
      purchaseDate: purchaseDate.trim() || null,
      statusFilter: { ...statusFilter },
      materialFilter: { ...materialFilter },
      targetFilter: { ...targetFilter }
    });
    setSelectedRowId(null);
    setBulkUpdateSelectedIds(new Set());
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
    const selected =
      selectedRowId != null ? (rows.find((r) => r.id === selectedRowId) ?? null) : null;
    setEditMode("create");
    setEditCopyRow(selected);
    setEditOpen(true);
  }, [rows, selectedRowId]);

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
            ? `一覧 ${rows.length} 件（マスタ ${allRows.length} 件）`
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
            disabled={!canModifySelectedRow}
            title={modifyDisabledTitle ?? "選択行を変更"}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={!canModifySelectedRow}
            title={modifyDisabledTitle ?? "選択行を削除"}
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
          <button type="button" className="factory2DarkButton wide" disabled={!hasSelection} title="行を選択してください">
            原料登録
          </button>
          <button type="button" className="factory2DarkButton wide" disabled title="未実装">
            仕入リスト
          </button>
          <button type="button" className="factory2DarkButton wide" disabled title="未実装">
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
        <span className="factory2FieldLabel factory2FieldLabelCompact">年度</span>
        <div className="purchaseTtransferMakeYearWrap">
          <Factory2MakeYearSpinner value={year} onChange={setYear} />
        </div>

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
          title={searchEnabled ? "検索条件で一覧を表示" : "年度を指定してください"}
        >
          検索
        </button>
      </section>

      <PurchaseTransferEditModal
        open={bulkTransferOpen}
        onClose={handleCloseBulkTransfer}
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
        copySourceRow={editCopyRow}
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

      <section className="tableWrap purchaseTtransferTableWrap">
        <MantineZoomProvider>
          <PurchaseTtransferMantineTable
            rows={rows}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            bulkUpdateSelectedIds={bulkUpdateSelectedIds}
            onBulkUpdateToggle={handleBulkUpdateToggle}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>
    </main>
  );
}
