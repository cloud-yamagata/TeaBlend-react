/**
 * システム定数メンテナンス（TrConstantCorrect MainWindow 相当）
 */
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { fetchTrConstants } from "../repositories/constantRepository";
import { deleteTrConstant, upsertTrConstant } from "../repositories/trConstantCorrectRepository";
import {
  TR_CONSTANT_FIELD_DEFINITIONS,
  constFieldLabel
} from "./constFieldDefinitions";
import { refreshTrConstantCorrectMasterAtom } from "./refreshTrConstantCorrectMaster";
import { TrConstantCorrectMantineTable } from "./TrConstantCorrectMantineTable";
import {
  createEmptyTrConstantEditForm,
  rowToTrConstantEditForm,
  toTrConstantCorrectRow,
  type TrConstantCorrectRow,
  type TrConstantEditForm
} from "./types";
import "./styles.css";
import "./trConstantCorrectTable.css";

function parseDisplayOrder(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function editFormToUpsertBody(constField: string, form: TrConstantEditForm) {
  return {
    const_field: constField,
    const_value: form.constValue.trim(),
    const_name: form.constName.trim(),
    display_order: parseDisplayOrder(form.displayOrder),
    display: form.display
  };
}

export default function TrConstantCorrectPage() {
  const refreshMaster = useSetAtom(refreshTrConstantCorrectMasterAtom);

  const [constField, setConstField] = useState("");
  const [rows, setRows] = useState<TrConstantCorrectRow[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TrConstantEditForm>(createEmptyTrConstantEditForm);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedRow = useMemo(
    () => (selectedRowId == null ? null : (rows.find((r) => r.id === selectedRowId) ?? null)),
    [rows, selectedRowId]
  );

  const canAct = constField !== "" && listLoaded && !busy;
  const hasValidInput =
    editForm.constValue.trim() !== "" &&
    editForm.constName.trim() !== "" &&
    (editForm.displayOrder.trim() === "" || parseDisplayOrder(editForm.displayOrder) != null);

  const loadRows = useCallback(async (field: string) => {
    setLoadingList(true);
    setActionError("");
    try {
      const fetched = await fetchTrConstants(field);
      setRows(fetched.map((row) => toTrConstantCorrectRow({ ...row, constField: field })));
      setListLoaded(true);
      setSelectedRowId(null);
      setEditForm(createEmptyTrConstantEditForm());
    } catch (e) {
      setRows([]);
      setListLoaded(false);
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingList(false);
    }
  }, []);

  const handleConstFieldChange = (nextField: string) => {
    setConstField(nextField);
    setRows([]);
    setListLoaded(false);
    setSelectedRowId(null);
    setEditForm(createEmptyTrConstantEditForm());
    setActionError("");
  };

  const handleShowList = () => {
    if (!constField) {
      setActionError("定数項目を選択してください。");
      return;
    }
    void loadRows(constField);
  };

  const handleRowSelect = useCallback((row: TrConstantCorrectRow) => {
    setSelectedRowId(row.id);
    setEditForm(rowToTrConstantEditForm(row));
    setActionError("");
  }, []);

  const patchForm = (partial: Partial<TrConstantEditForm>) => {
    setEditForm((prev) => ({ ...prev, ...partial }));
  };

  const handleRegist = async () => {
    setActionError("");
    if (!constField) {
      setActionError("定数項目を選択してください。");
      return;
    }
    if (!hasValidInput) {
      setActionError("定数値・定数名を入力してください。表示順は数値で入力してください。");
      return;
    }
    const constValue = editForm.constValue.trim();
    if (rows.some((r) => r.constValue === constValue)) {
      setActionError("指定された定数値は既に登録済みです。");
      return;
    }

    const msg = `定数項目 : ${constFieldLabel(constField)}\n定数値 : ${constValue}\n定数名 : ${editForm.constName.trim()}\n\nとしてシステム定数を登録します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await upsertTrConstant(editFormToUpsertBody(constField, editForm));
      await refreshMaster();
      await loadRows(constField);
      window.alert("システム定数の登録が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("変更する定数を一覧から選択してください。");
      return;
    }
    if (!hasValidInput) {
      setActionError("定数値・定数名を入力してください。表示順は数値で入力してください。");
      return;
    }
    if (editForm.constValue.trim() !== selectedRow.constValue) {
      setActionError("定数値は変更できません。削除してから再登録してください。");
      return;
    }

    const msg = `定数値 : ${selectedRow.constValue}\n旧定数名 : ${selectedRow.constName}\n新定数名 : ${editForm.constName.trim()}\n\nとしてシステム定数を変更します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await upsertTrConstant(editFormToUpsertBody(constField, editForm));
      await refreshMaster();
      await loadRows(constField);
      window.alert("システム定数の更新が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionError("");
    if (!selectedRow) {
      setActionError("削除する定数を一覧から選択してください。");
      return;
    }

    const msg = `定数値 : ${selectedRow.constValue}\n定数名 : ${selectedRow.constName}\n\nのシステム定数を削除します。\nよろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      await deleteTrConstant({
        const_field: constField,
        const_value: selectedRow.constValue
      });
      await refreshMaster();
      await loadRows(constField);
      window.alert("システム定数の削除が正常に処理されました");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page trConstantCorrectPage">
      <header className="toolbar">
        <h1 className="title">システム定数メンテナンス</h1>
        <p className="trConstantCorrectHint">
          {listLoaded
            ? `${constFieldLabel(constField)} ${rows.length.toLocaleString("ja-JP")} 件`
            : "定数項目を選択して一覧を表示してください"}
        </p>
      </header>

      {loadingList ? <p className="status">読み込み中...</p> : null}
      {actionError ? (
        <p className="status error" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="trConstantCorrectFieldRow" aria-label="定数項目選択">
        <label className="searchField">
          <span className="searchFieldLabel">定数項目</span>
          <select
            className="searchControl trConstantCorrectFieldSelect"
            value={constField}
            onChange={(e) => handleConstFieldChange(e.target.value)}
            aria-label="定数項目"
          >
            <option value="">（選択してください）</option>
            {TR_CONSTANT_FIELD_DEFINITIONS.map((def) => (
              <option key={def.constField} value={def.constField}>
                {def.label}（{def.constField}）
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="factory2DarkButton"
          disabled={!constField || loadingList || busy}
          onClick={handleShowList}
        >
          表示
        </button>
      </section>

      <nav className="trConstantCorrectMenuRow" aria-label="操作メニュー">
        <button
          type="button"
          className="trConstantCorrectMenuItem"
          disabled={!canAct || !hasValidInput}
          onClick={() => void handleRegist()}
          title={canAct ? "入力内容を新規登録" : "定数項目を選択して一覧を表示してください"}
        >
          登録
        </button>
        <button
          type="button"
          className="trConstantCorrectMenuItem"
          disabled={!canAct || selectedRow == null || !hasValidInput}
          onClick={() => void handleEdit()}
          title={selectedRow ? "選択行を変更" : "一覧から定数を選択してください"}
        >
          変更
        </button>
        <button
          type="button"
          className="trConstantCorrectMenuItem"
          disabled={!canAct || selectedRow == null}
          onClick={() => void handleDelete()}
          title={selectedRow ? "選択行を削除" : "一覧から定数を選択してください"}
        >
          削除
        </button>
      </nav>

      <section className="trConstantCorrectInputRow" aria-label="定数入力">
        <label className="searchField">
          <span className="searchFieldLabel">定数値</span>
          <input
            className="searchControl trConstantCorrectValueInput"
            type="text"
            value={editForm.constValue}
            readOnly={selectedRow != null}
            onChange={(e) => patchForm({ constValue: e.target.value })}
            placeholder="定数値"
            autoComplete="off"
            aria-label="定数値"
          />
        </label>
        <label className="searchField">
          <span className="searchFieldLabel">定数名</span>
          <input
            className="searchControl trConstantCorrectNameInput"
            type="text"
            value={editForm.constName}
            onChange={(e) => patchForm({ constName: e.target.value })}
            placeholder="定数名"
            autoComplete="off"
            aria-label="定数名"
          />
        </label>
        <label className="searchField">
          <span className="searchFieldLabel">表示順</span>
          <input
            className="searchControl trConstantCorrectOrderInput"
            type="text"
            inputMode="numeric"
            value={editForm.displayOrder}
            onChange={(e) => patchForm({ displayOrder: e.target.value })}
            placeholder="任意"
            autoComplete="off"
            aria-label="表示順"
          />
        </label>
        <label className="trConstantCorrectDisplayCheck">
          <input
            type="checkbox"
            checked={editForm.display}
            onChange={(e) => patchForm({ display: e.target.checked })}
          />
          表示
        </label>
        <button
          type="button"
          className="factory2DarkButton trConstantCorrectClearButton"
          disabled={busy}
          onClick={() => {
            setSelectedRowId(null);
            setEditForm(createEmptyTrConstantEditForm());
            setActionError("");
          }}
        >
          入力クリア
        </button>
      </section>

      <section className="tableWrap">
        <MantineZoomProvider>
          <TrConstantCorrectMantineTable
            rows={rows}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            listLoaded={listLoaded}
          />
        </MantineZoomProvider>
      </section>
    </main>
  );
}
