/**
 * 販売計画商品マスタメンテナンス
 * UI は商品マスタメンテナンス（ItemCorrect）をベースにする
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  salesPlanItemCorrectMasterErrorAtom
} from "../repository/masterData";
import { deleteTrSalesPlanItem } from "../repositories/salesPlanItemCorrectRepository";
import { SalesPlanItemCorrectEditModal } from "./SalesPlanItemCorrectEditModal";
import { SalesPlanItemCorrectMantineTable } from "./SalesPlanItemCorrectMantineTable";
import { SalesPlanItemCorrectSearchPanel } from "./SalesPlanItemCorrectSearchPanel";
import { refreshSalesPlanItemCorrectMasterAtom } from "./refreshSalesPlanItemCorrectMaster";
import {
  filteredSalesPlanItemCorrectListAtom,
  salesPlanItemCorrectListAtom,
  salesPlanItemCorrectSearchAppliedFiltersAtom,
  salesPlanItemCorrectSearchDraftAtom,
  salesPlanItemCorrectSearchExecutedAtom
} from "./store";
import {
  createEmptySalesPlanItemCorrectEditForm,
  rowToCreateEditForm,
  rowToEditForm,
  type SalesPlanItemCorrectEditForm,
  type SalesPlanItemCorrectEditMode,
  type SalesPlanItemCorrectRow,
  type SalesPlanItemCorrectSearchFilters
} from "./types";
import "./styles.css";
import "./salesPlanItemCorrectTable.css";

export default function SalesPlanItemCorrectPage() {
  const allRows = useAtomValue(salesPlanItemCorrectListAtom);
  const rows = useAtomValue(filteredSalesPlanItemCorrectListAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(salesPlanItemCorrectMasterErrorAtom);
  const setAppliedFilters = useSetAtom(salesPlanItemCorrectSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(salesPlanItemCorrectSearchExecutedAtom);
  const setDraft = useSetAtom(salesPlanItemCorrectSearchDraftAtom);
  const searchExecuted = useAtomValue(salesPlanItemCorrectSearchExecutedAtom);
  const refreshMaster = useSetAtom(refreshSalesPlanItemCorrectMasterAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<SalesPlanItemCorrectEditMode>("create");
  const [editForm, setEditForm] = useState<SalesPlanItemCorrectEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canChange = searchExecuted && selectedRow != null;
  const canDelete = searchExecuted && selectedRow != null;

  const existingItemNos = useMemo(() => new Set(allRows.map((r) => r.itemNo)), [allRows]);

  const handleSearch = (filters: SalesPlanItemCorrectSearchFilters) => {
    const next: SalesPlanItemCorrectSearchFilters = { itemName: filters.itemName };
    setDraft(next);
    setAppliedFilters(next);
    setSearchExecuted(true);
    setSelectedRowId(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: SalesPlanItemCorrectRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    setEditMode("create");
    setEditForm(
      selectedRow ? rowToCreateEditForm(selectedRow) : createEmptySalesPlanItemCorrectEditForm()
    );
    setEditOpen(true);
  };

  const openChange = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する商品を一覧から選択してください。");
      return;
    }
    setEditMode("update");
    setEditForm(rowToEditForm(selectedRow));
    setEditOpen(true);
  };

  const handleDelete = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("削除する商品を一覧から選択してください。");
      return;
    }
    if (!window.confirm("削除してもいいですか")) return;
    try {
      await deleteTrSalesPlanItem(selectedRow.itemNo);
      await refreshMaster();
      setSelectedRowId(null);
      window.alert("販売計画商品マスタの削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page salesPlanItemCorrectPage">
      <header className="toolbar">
        <h1 className="title">販売計画商品マスタメンテナンス</h1>
        <p className="salesPlanItemCorrectHint">
          {searchExecuted
            ? `一覧 ${rows.length.toLocaleString("ja-JP")} 件（マスタ ${allRows.length.toLocaleString("ja-JP")} 件）`
            : `マスタ ${allRows.length.toLocaleString("ja-JP")} 件`}
        </p>
      </header>

      {loading ? <p className="status">マスタ読み込み中...</p> : null}
      {masterError ? <p className="status error">{masterError}</p> : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <nav className="salesPlanItemCorrectMenuRow" aria-label="登録メニュー">
        <button
          type="button"
          className="salesPlanItemCorrectMenuItem"
          onClick={openRegister}
          title="販売計画商品マスタを新規登録"
        >
          登録
        </button>
        <button
          type="button"
          className="salesPlanItemCorrectMenuItem"
          disabled={!canChange}
          onClick={openChange}
          title={
            canChange
              ? "選択行の販売計画商品マスタを変更"
              : searchExecuted
                ? "変更する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          変更
        </button>
        <button
          type="button"
          className="salesPlanItemCorrectMenuItem"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          title={
            canDelete
              ? "選択行の販売計画商品マスタを削除"
              : searchExecuted
                ? "削除する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          削除
        </button>
      </nav>

      <SalesPlanItemCorrectSearchPanel onSearch={handleSearch} />

      <section className="tableWrap">
        <MantineZoomProvider>
          <SalesPlanItemCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <SalesPlanItemCorrectEditModal
          open={editOpen}
          mode={editMode}
          initialForm={editForm}
          existingItemNos={existingItemNos}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
        />
      ) : null}
    </main>
  );
}
