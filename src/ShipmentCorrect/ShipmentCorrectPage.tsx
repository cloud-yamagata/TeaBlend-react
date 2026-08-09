/**
 * 直送先マスタメンテナンス（ShipmentCorrect MainWindow 相当）
 * UI は商品マスタメンテナンス（ItemCorrect）をベースにする
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  shipmentCorrectMasterErrorAtom
} from "../repository/masterData";
import { deleteTrDirectShipment } from "../repositories/shipmentCorrectRepository";
import { ShipmentCorrectEditModal } from "./ShipmentCorrectEditModal";
import { ShipmentCorrectMantineTable } from "./ShipmentCorrectMantineTable";
import { ShipmentCorrectSearchPanel } from "./ShipmentCorrectSearchPanel";
import { refreshShipmentCorrectMasterAtom } from "./refreshShipmentCorrectMaster";
import {
  filteredShipmentCorrectListAtom,
  shipmentCorrectListAtom,
  shipmentCorrectSearchAppliedFiltersAtom,
  shipmentCorrectSearchDraftAtom,
  shipmentCorrectSearchExecutedAtom
} from "./store";
import {
  createEmptyShipmentCorrectEditForm,
  rowToCreateEditForm,
  rowToEditForm,
  type ShipmentCorrectEditForm,
  type ShipmentCorrectEditMode,
  type ShipmentCorrectRow,
  type ShipmentCorrectSearchFilters
} from "./types";
import "./styles.css";
import "./shipmentCorrectTable.css";

export default function ShipmentCorrectPage() {
  const allRows = useAtomValue(shipmentCorrectListAtom);
  const rows = useAtomValue(filteredShipmentCorrectListAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(shipmentCorrectMasterErrorAtom);
  const setAppliedFilters = useSetAtom(shipmentCorrectSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(shipmentCorrectSearchExecutedAtom);
  const setDraft = useSetAtom(shipmentCorrectSearchDraftAtom);
  const searchExecuted = useAtomValue(shipmentCorrectSearchExecutedAtom);
  const refreshMaster = useSetAtom(refreshShipmentCorrectMasterAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<ShipmentCorrectEditMode>("create");
  const [editForm, setEditForm] = useState<ShipmentCorrectEditForm | null>(null);
  const [actionError, setActionError] = useState("");

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canChange = searchExecuted && selectedRow != null;
  const canDelete = searchExecuted && selectedRow != null;

  const existingShipmentNos = useMemo(
    () => new Set(allRows.map((r) => r.directShipmentNo)),
    [allRows]
  );

  const handleSearch = (filters: ShipmentCorrectSearchFilters) => {
    const next: ShipmentCorrectSearchFilters = {
      shipmentName: filters.shipmentName
    };
    setDraft(next);
    setAppliedFilters(next);
    setSearchExecuted(true);
    setSelectedRowId(null);
    setActionError("");
  };

  const handleRowSelect = useCallback((row: ShipmentCorrectRow) => {
    setSelectedRowId(row.id);
  }, []);

  const openRegister = () => {
    setActionError("");
    setEditMode("create");
    setEditForm(selectedRow ? rowToCreateEditForm(selectedRow) : createEmptyShipmentCorrectEditForm());
    setEditOpen(true);
  };

  const openChange = () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する直送先を一覧から選択してください。");
      return;
    }
    setEditMode("update");
    setEditForm(rowToEditForm(selectedRow));
    setEditOpen(true);
  };

  const handleDelete = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("削除する直送先を一覧から選択してください。");
      return;
    }
    if (!window.confirm("削除してもいいですか")) return;
    try {
      await deleteTrDirectShipment(selectedRow.directShipmentNo);
      await refreshMaster();
      setSelectedRowId(null);
      window.alert("直送先マスタの削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page shipmentCorrectPage">
      <header className="toolbar">
        <h1 className="title">直送先マスタメンテナンス</h1>
        <p className="shipmentCorrectHint">
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

      <nav className="shipmentCorrectMenuRow" aria-label="登録メニュー">
        <button type="button" className="shipmentCorrectMenuItem" onClick={openRegister} title="直送先マスタを新規登録">
          登録
        </button>
        <button
          type="button"
          className="shipmentCorrectMenuItem"
          disabled={!canChange}
          onClick={openChange}
          title={
            canChange
              ? "選択行の直送先マスタを変更"
              : searchExecuted
                ? "変更する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          変更
        </button>
        <button
          type="button"
          className="shipmentCorrectMenuItem"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          title={
            canDelete
              ? "選択行の直送先マスタを削除"
              : searchExecuted
                ? "削除する明細行を選択してください"
                : "検索後に明細行を選択してください"
          }
        >
          削除
        </button>
      </nav>

      <ShipmentCorrectSearchPanel onSearch={handleSearch} />

      <section className="tableWrap">
        <MantineZoomProvider>
          <ShipmentCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            searchExecuted={searchExecuted}
          />
        </MantineZoomProvider>
      </section>

      {editOpen && editForm ? (
        <ShipmentCorrectEditModal
          open={editOpen}
          mode={editMode}
          initialForm={editForm}
          existingShipmentNos={existingShipmentNos}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
        />
      ) : null}
    </main>
  );
}
