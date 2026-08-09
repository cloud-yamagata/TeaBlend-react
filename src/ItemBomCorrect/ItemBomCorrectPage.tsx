/**
 * 商品原料対照表メンテナンス（ItemBomCorrect MainWindow 相当）
 * 一覧行選択＋原料 ZOOM（仕上品仕入の商品名ZOOM相当）で登録/変更/削除
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  TrItemMasterZoomModal,
  type TrItemZoomFilterParams
} from "../components/TrItemMasterZoomModal";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import {
  masterDataLoadingAtom,
  itemBomCorrectMasterErrorAtom
} from "../repository/masterData";
import { deleteTrItemBom, upsertTrItemBom } from "../repositories/itemBomCorrectRepository";
import { ItemBomCorrectMantineTable } from "./ItemBomCorrectMantineTable";
import { refreshItemBomCorrectMasterAtom } from "./refreshItemBomCorrectMaster";
import { itemBomCorrectListAtom } from "./store";
import type { ItemBomCorrectRow } from "./types";
import "./styles.css";
import "./itemBomCorrectTable.css";

export default function ItemBomCorrectPage() {
  const rows = useAtomValue(itemBomCorrectListAtom);
  const loading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(itemBomCorrectMasterErrorAtom);
  const refreshMaster = useSetAtom(refreshItemBomCorrectMasterAtom);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [materialItemNo, setMaterialItemNo] = useState("");
  const [materialItemName, setMaterialItemName] = useState("");
  const [materialZoomOpen, setMaterialZoomOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const materialZoomFilterParams = useMemo<TrItemZoomFilterParams>(
    () => ({ systemClass: "2" }),
    []
  );

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const selectedMaterialNo = useMemo(() => {
    const n = Number(materialItemNo.trim());
    return Number.isFinite(n) && materialItemNo.trim() !== "" ? n : null;
  }, [materialItemNo]);

  const hasMaterial = selectedMaterialNo != null && materialItemName.trim() !== "";

  const canAct = selectedRow != null && !busy;

  const handleRowSelect = useCallback((row: ItemBomCorrectRow) => {
    setSelectedRowId(row.id);
    setActionError("");
  }, []);

  const handleRegist = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("登録する商品を一覧から選択してください。");
      return;
    }
    if (selectedRow.childItemNo != null) {
      setActionError("指定された商品に対し商品原料対照表は既に登録済みです。");
      return;
    }
    if (!hasMaterial || selectedMaterialNo == null) {
      setActionError("指定された原料茶は登録できません。");
      return;
    }

    const msg = `商品名 : ${selectedRow.itemName}\n原料名 : ${materialItemName.trim()}\n\nとして商品原料対照表を登録します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await upsertTrItemBom({
        parent_item_no: selectedRow.itemNo,
        child_item_no: selectedMaterialNo
      });
      await refreshMaster();
      window.alert("商品原料対照表マスタの登録が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する商品を一覧から選択してください。");
      return;
    }
    if (selectedRow.childItemNo == null) {
      setActionError("指定された商品に対し商品原料対照表は未登録です。");
      return;
    }
    if (!hasMaterial || selectedMaterialNo == null) {
      setActionError("指定された原料茶は登録できません。");
      return;
    }

    const msg = `商品名 : ${selectedRow.itemName}\n旧原料 : ${selectedRow.useItemName}\n新原料 : ${materialItemName.trim()}\n\nとして商品原料対照表を変更します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await upsertTrItemBom({
        parent_item_no: selectedRow.itemNo,
        child_item_no: selectedMaterialNo
      });
      await refreshMaster();
      window.alert("商品原料対照表マスタの更新が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("削除する商品を一覧から選択してください。");
      return;
    }
    if (selectedRow.childItemNo == null) {
      setActionError("指定された商品に対し商品原料対照表は未登録です。");
      return;
    }

    const msg = `商品名 : ${selectedRow.itemName}\n原料名 : ${selectedRow.useItemName}\n\nの商品原料対照表を削除します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await deleteTrItemBom(selectedRow.itemNo);
      await refreshMaster();
      window.alert("商品原料対照表マスタの削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page itemBomCorrectPage">
      <header className="toolbar">
        <h1 className="title">商品原料対照表メンテナンス</h1>
        <p className="itemBomCorrectHint">一覧 {rows.length.toLocaleString("ja-JP")} 件（商品区分=1）</p>
      </header>

      {loading ? <p className="status">マスタ読み込み中...</p> : null}
      {masterError ? <p className="status error">{masterError}</p> : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <nav className="itemBomCorrectMenuRow" aria-label="操作メニュー">
        <button
          type="button"
          className="itemBomCorrectMenuItem"
          disabled={!canAct}
          onClick={() => void handleRegist()}
          title={canAct ? "選択行に原料茶を登録" : "一覧から商品を選択してください"}
        >
          登録
        </button>
        <button
          type="button"
          className="itemBomCorrectMenuItem"
          disabled={!canAct}
          onClick={() => void handleEdit()}
          title={canAct ? "選択行の原料茶を変更" : "一覧から商品を選択してください"}
        >
          変更
        </button>
        <button
          type="button"
          className="itemBomCorrectMenuItem"
          disabled={!canAct}
          onClick={() => void handleDelete()}
          title={canAct ? "選択行の対照を削除" : "一覧から商品を選択してください"}
        >
          削除
        </button>
      </nav>

      <section className="itemBomMaterialZoomRow" aria-label="原料選択">
        <div className="searchFieldItemZoomGroup itemBomMaterialZoomGroup">
          <label className="searchField">
            <span className="searchFieldLabel">商品No</span>
            <input
              className="searchControl searchControlItemNo searchControlReadonly"
              type="text"
              value={materialItemNo}
              readOnly
              tabIndex={-1}
              placeholder="（ZOOMで選択）"
              aria-label="商品No"
              title="原料ZOOMで選択してください"
            />
          </label>
          <div className="searchField itemBomNameWithZoom">
            <span className="searchFieldLabel">商品名</span>
            <div className="itemBomNameWithZoomControls">
              <input
                className="searchControl searchControlItemName searchControlReadonly"
                type="text"
                value={materialItemName}
                readOnly
                tabIndex={-1}
                placeholder="（原料を選択してください）"
                aria-label="商品名"
                title="原料ZOOMで選択してください"
              />
              <button type="button" className="zoomOpenButton" onClick={() => setMaterialZoomOpen(true)}>
                原料名
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="tableWrap">
        <MantineZoomProvider>
          <ItemBomCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
          />
        </MantineZoomProvider>
      </section>

      <TrItemMasterZoomModal
        open={materialZoomOpen}
        onClose={() => setMaterialZoomOpen(false)}
        initialCode={materialItemNo}
        initialName={materialItemName}
        filterParams={materialZoomFilterParams}
        onSelect={(code, name) => {
          setMaterialItemNo(code.trim());
          setMaterialItemName(name.trim());
          setActionError("");
          setMaterialZoomOpen(false);
        }}
        onClear={() => {
          setMaterialItemNo("");
          setMaterialItemName("");
          setMaterialZoomOpen(false);
        }}
      />
    </main>
  );
}
