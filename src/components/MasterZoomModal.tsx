/**
 * 【処理概要】
 *   汎用「マスタ検索」モーダル。親が `search` コールバックでデータ源（メモリ／API）を差し替える。
 *
 * 【パラメータ仕様（MasterZoomModalProps）】
 *   - `open` … 表示制御
 *   - `title` … ダイアログ見出し
 *   - `initialCode` / `initialName` … オープン時に入力欄へ複写
 *   - `onClose` / `onSelect(code, name)` … ユーザー操作
 *   - `codeSearchLabel` 等 … 列見出しのカスタム（省略時は日本語デフォルト）
 *   - `search({ code, name })` … 同期／非同期いずれも可。返却は `ZoomMasterRow[]`
 *
 * 【メンテナンス／サンプル】
 *   新しい ZOOM を足す場合: このコンポーネントをそのまま使い、`search` 内で repository を呼ぶ。
 */
import { useEffect, useState } from "react";
import "./masterZoomModal.css";

export type ZoomMasterRow = {
  id: string;
  code: string;
  name: string;
};

export type MasterZoomModalProps = {
  open: boolean;
  /** モーダル見出し（例：商品マスター） */
  title: string;
  initialCode: string;
  initialName: string;
  onClose: () => void;
  onSelect: (code: string, name: string) => void;
  /** 指定時はフッターに「削除」を表示（選択解除） */
  onClear?: () => void;
  /** 検索コード列の見出し（既定：検索コード） */
  codeSearchLabel?: string;
  /** 検索名称列の見出し（既定：検索名称） */
  nameSearchLabel?: string;
  /** 結果一覧のコード列見出し（既定：コード） */
  resultCodeHeader?: string;
  /** 結果一覧の名称列見出し（既定：名称） */
  resultNameHeader?: string;
  /**
   * 検索ボタン押下時に呼ばれる。該当マスター行を返す（未入力は全件扱いでよい）。
   * Promise を返してもよい（API 取得など）。
   */
  search: (params: { code: string; name: string }) => ZoomMasterRow[] | Promise<ZoomMasterRow[]>;
};

export function MasterZoomModal({
  open,
  title,
  initialCode,
  initialName,
  onClose,
  onSelect,
  onClear,
  codeSearchLabel = "検索コード",
  nameSearchLabel = "検索名称",
  resultCodeHeader = "コード",
  resultNameHeader = "名称",
  search
}: MasterZoomModalProps) {
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [rows, setRows] = useState<ZoomMasterRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRunning, setSearchRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setSearchCode(initialCode);
      setSearchName(initialName);
      setRows([]);
      setHasSearched(false);
      setSearchError(null);
      setSearchRunning(false);
    }
  }, [open, initialCode, initialName]);

  if (!open) {
    return null;
  }

  const handleSearchClick = () => {
    setSearchError(null);
    setSearchRunning(true);
    void Promise.resolve(search({ code: searchCode, name: searchName }))
      .then((list) => {
        setRows(list);
        setHasSearched(true);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "検索に失敗しました";
        setSearchError(msg);
        setRows([]);
        setHasSearched(true);
      })
      .finally(() => {
        setSearchRunning(false);
      });
  };

  const handleSelect = (row: ZoomMasterRow) => {
    onSelect(row.code, row.name);
    onClose();
  };

  return (
    <div className="zoomModalOverlay" role="presentation" onClick={onClose}>
      <section className="zoomModalPanel" role="dialog" aria-modal="true" aria-labelledby="zoomModalTitle" onClick={(e) => e.stopPropagation()}>
        <header className="zoomModalHeader">
          <h2 id="zoomModalTitle" className="zoomModalTitle">
            {title}
          </h2>
        </header>

        <div className="zoomModalSearchRow">
          <span className="zoomModalSearchLabel">{codeSearchLabel}</span>
          <span className="zoomModalColon">：</span>
          <input
            className="zoomModalInput"
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            autoComplete="off"
          />
          <span className="zoomModalSearchLabel">{nameSearchLabel}</span>
          <span className="zoomModalColon">：</span>
          <input
            className="zoomModalInput"
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="zoomModalSearchButton" onClick={handleSearchClick} disabled={searchRunning}>
            {searchRunning ? "検索中…" : "検索"}
          </button>
        </div>

        {searchError && (
          <p className="zoomModalSearchError" role="alert">
            {searchError}
          </p>
        )}

        <div className="zoomModalTableWrap">
          <table className="zoomModalTable">
            <thead>
              <tr>
                <th className="zoomModalTh zoomModalThSelect">選択</th>
                <th className="zoomModalTh">{resultCodeHeader}</th>
                <th className="zoomModalTh">{resultNameHeader}</th>
              </tr>
            </thead>
            <tbody>
              {!hasSearched ? (
                <tr>
                  <td className="zoomModalTd zoomModalTdEmpty" colSpan={3}>
                    検索を実行してください。
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="zoomModalTd zoomModalTdEmpty" colSpan={3}>
                    該当するデータがありません。
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="zoomModalTd zoomModalTdCenter">
                      <button type="button" className="zoomModalSelectButton" onClick={() => handleSelect(row)}>
                        選択
                      </button>
                    </td>
                    <td className="zoomModalTd">{row.code}</td>
                    <td className="zoomModalTd">{row.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="zoomModalFooter">
          {onClear ? (
            <button type="button" className="zoomModalClearButton" onClick={onClear}>
              削除
            </button>
          ) : null}
          <button type="button" className="zoomModalCloseButton" onClick={onClose}>
            閉じる
          </button>
        </footer>
      </section>
    </div>
  );
}
