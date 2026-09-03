/**
 * 転売先マスタメンテナンス（ResaleCorrect MainWindow 相当）
 * UI は直送先マスタメンテナンス（ShipmentCorrect）をベースにする
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  resaleCorrectMasterErrorAtom
} from "../repository/masterData";
import { deleteTrResale } from "../repositories/resaleCorrectRepository";
import { ResaleCorrectEditModal } from "./ResaleCorrectEditModal";
import { ResaleCorrectMantineTable } from "./ResaleCorrectMantineTable";
import { ResaleCorrectSearchPanel } from "./ResaleCorrectSearchPanel";
import { refreshResaleCorrectMasterAtom } from "./refreshResaleCorrectMaster";
import {
  filteredResaleCorrectListAtom,
  resaleCorrectListAtom,
  resaleCorrectSearchAppliedFiltersAtom,
  resaleCorrectSearchDraftAtom,
  resaleCorrectSearchExecutedAtom
} from "./store";
import {
  createEmptyResaleCorrectEditForm,
  rowToCreateEditForm,
  rowToEditForm,
  type ResaleCorrectEditForm,
  type ResaleCorrectEditMode,
  type ResaleCorrectRow,
  type ResaleCorrectSearchFilters
} from "./types";
import "./styles.css";
import "./resaleCorrectTable.css";

export default function ResaleCorrectPage() {
  const allRows = useAtomValue(resaleCorrectListAtom);
  const rows = useAtomValue(filteredResaleCorrectListAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(resaleCorrectMasterErrorAtom);
  const setAppliedFilters = useSetAtom(resaleCorrectSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(resaleCorrectSearchExecutedAtom);
  const setDraft = useSetAtom(resaleCorrectSearchDraftAtom);
  const searchExecuted = useAtomValue(resaleCorrectSearchExecutedAtom);
  const refreshMaster = useSetAtom(refreshResaleCorrectMasterAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<ResaleCorrectEditMode>("create");
  const [editForm, setEditForm] = useState<ResaleCorrectEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canChange = searchExecuted && selectedRow != null;
  const canDelete = searchExecuted && selectedRow != null;

  const existingResaleNames = useMemo(() => new Set(allRows.map((r) => r.resale)), [allRows]);

  const handleSearch = (filters: ResaleCorrectSearchFilters) => {
    const next: ResaleCorrectSearchFilters = {
      resaleName: filters.resaleName
    };
    setDraft(next);
    setAppliedFilters(next);
    setSearchExecuted(true);
    setSelectedRowId(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: ResaleCorrectRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    setEditMode("create");
    setEditForm(selectedRow ? rowToCreateEditForm(selectedRow) : createEmptyResaleCorrectEditForm());
    setEditOpen(true);
  };

  const openChange = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する転売先を一覧から選択してください。");
      return;
    }
    setEditMode("update");
    setEditForm(rowToEditForm(selectedRow));
    setEditOpen(true);
  };

  const handleDelete = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("削除する転売先を一覧から選択してください。");
      return;
    }
    if (!window.confirm("削除してもいいですか")) return;
    try {
      await deleteTrResale(selectedRow.resale);
      await refreshMaster();
      setSelectedRowId(null);
      window.alert("転売先マスタの削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page resaleCorrectPage">
      <header className="toolbar">
        <h1 className="title">転売先マスタメンテナンス</h1>
        <p className="resaleCorrectHint">
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

      <nav className="resaleCorrectMenuRow" aria-label="登録メニュー">
        <button type="button" className="resaleCorrectMenuItem" onClick={openRegister} title="転売先マスタを新規登録">
          登録
        </button>
        <button
          type="button"
          className="resaleCorrectMenuItem"
          disabled={!canChange}
          onClick={openChange}
          title={
            canChange
              ? "選択行の転売先マスタを変更"
              : searchExecuted
                ? "変更する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          変更
        </button>
        <button
          type="button"
          className="resaleCorrectMenuItem"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          title={
            canDelete
              ? "選択行の転売先マスタを削除"
              : searchExecuted
                ? "削除する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          削除
        </button>
      </nav>

      <ResaleCorrectSearchPanel onSearch={handleSearch} />

      <section className="tableWrap">
        <MantineZoomProvider>
          <ResaleCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <ResaleCorrectEditModal
          open={editOpen}
          mode={editMode}
          initialForm={editForm}
          existingResaleNames={existingResaleNames}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
        />
      ) : null}
    </main>
  );
}
