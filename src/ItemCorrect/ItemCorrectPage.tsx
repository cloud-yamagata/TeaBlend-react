/**
 * 商品マスタメンテナンス（ItemCorrect MainWindow 相当）
 * UI は仕上品仕入登録（MaterialPurchase）をベースにする
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  masterTrItemsAtom,
  itemCorrectMasterErrorAtom
} from "../repository/masterData";
import { deleteTrItem, refreshTrItems } from "../repositories/itemCorrectRepository";
import { ItemCorrectEditModal } from "./ItemCorrectEditModal";
import { ItemCorrectMantineTable } from "./ItemCorrectMantineTable";
import { ItemCorrectSearchPanel } from "./ItemCorrectSearchPanel";
import {
  filteredItemCorrectListAtom,
  itemCorrectListAtom,
  itemCorrectSearchAppliedFiltersAtom,
  itemCorrectSearchDraftAtom,
  itemCorrectSearchExecutedAtom
} from "./store";
import {
  createEmptyItemCorrectEditForm,
  rowToCreateEditForm,
  rowToEditForm,
  type ItemCorrectEditForm,
  type ItemCorrectEditMode,
  type ItemCorrectRow,
  type ItemCorrectSearchFilters
} from "./types";
import "./styles.css";
import "./itemCorrectTable.css";

export default function ItemCorrectPage() {
  const allRows = useAtomValue(itemCorrectListAtom);
  const rows = useAtomValue(filteredItemCorrectListAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(itemCorrectMasterErrorAtom);
  const setAppliedFilters = useSetAtom(itemCorrectSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(itemCorrectSearchExecutedAtom);
  const setDraft = useSetAtom(itemCorrectSearchDraftAtom);
  const searchExecuted = useAtomValue(itemCorrectSearchExecutedAtom);
  const setTrItems = useSetAtom(masterTrItemsAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<ItemCorrectEditMode>("create");
  const [editForm, setEditForm] = useState<ItemCorrectEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canChange = searchExecuted && selectedRow != null;
  const canDelete = searchExecuted && selectedRow != null;

  const existingItemNos = useMemo(() => new Set(allRows.map((r) => r.itemNo)), [allRows]);
  const existingItemNames = useMemo(
    () => new Set(allRows.map((r) => r.itemName.trim()).filter(Boolean)),
    [allRows]
  );

  const handleSearch = (filters: ItemCorrectSearchFilters) => {
    const next: ItemCorrectSearchFilters = {
      itemName: filters.itemName,
      systemClassCheck: { ...filters.systemClassCheck },
      organicClassCheck: { ...filters.organicClassCheck },
      itemGroupCheck: { ...filters.itemGroupCheck }
    };
    setDraft(next);
    setAppliedFilters(next);
    setSearchExecuted(true);
    setSelectedRowId(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: ItemCorrectRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    setEditMode("create");
    setEditForm(selectedRow ? rowToCreateEditForm(selectedRow) : createEmptyItemCorrectEditForm());
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
      await deleteTrItem(selectedRow.itemNo);
      setTrItems(await refreshTrItems());
      setSelectedRowId(null);
      window.alert("商品マスタの削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page itemCorrectPage">
      <header className="toolbar">
        <h1 className="title">商品マスタメンテナンス</h1>
        <p className="itemCorrectHint">
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

      <nav className="itemCorrectMenuRow" aria-label="登録メニュー">
        <button type="button" className="itemCorrectMenuItem" onClick={openRegister} title="商品マスタを新規登録">
          登録
        </button>
        <button
          type="button"
          className="itemCorrectMenuItem"
          disabled={!canChange}
          onClick={openChange}
          title={
            canChange
              ? "選択行の商品マスタを変更"
              : searchExecuted
                ? "変更する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          変更
        </button>
        <button
          type="button"
          className="itemCorrectMenuItem"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          title={
            canDelete
              ? "選択行の商品マスタを削除"
              : searchExecuted
                ? "削除する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          削除
        </button>
      </nav>

      <ItemCorrectSearchPanel onSearch={handleSearch} />

      <section className="tableWrap">
        <MantineZoomProvider>
          <ItemCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <ItemCorrectEditModal
          open={editOpen}
          mode={editMode}
          initialForm={editForm}
          existingItemNos={existingItemNos}
          existingItemNames={
            editMode === "update" && selectedRow
              ? new Set([...existingItemNames].filter((n) => n !== selectedRow.itemName.trim()))
              : existingItemNames
          }
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
        />
      ) : null}
    </main>
  );
}
