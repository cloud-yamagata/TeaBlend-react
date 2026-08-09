/**
 * 【処理概要】
 *   `tr_constant` のうち指定 `const_field` に一致する行を一覧し、名称だけ選ばせる軽量 ZOOM。
 *
 * 【パラメータ仕様】
 *   - `constField` … API の `const_field` クエリにそのまま渡す（例: `purchase`, `producer`）
 *   - `constants` … 渡せば API を呼ばずメモリフィルタ（原料一覧画面は bootstrap 済み定数を再利用）
 *   - `onSelect(constValue, constName)` … 親 inputs へ反映。名称だけ使う画面も多い
 *   - `onClear` … 指定時はフッターに「削除」（選択解除）を表示
 *
 * 【メンテナンス】
 *   表示対象は `trConstantZoomFilter.ts` の display 判定とソートに従う。
 */
import { useEffect, useState } from "react";
import type { TrConstant } from "../MaterialList/types";
import { fetchTrConstants } from "../repositories/constantRepository";
import { compareTrConstantZoomSort, trConstantPassesDisplayActive } from "./trConstantZoomFilter";
import "./masterZoomModal.css";

function filterByConstField(rows: TrConstant[], constField: string): TrConstant[] {
  const f = constField.trim();
  return rows.filter((r) => (r.constField ?? "").trim() === f);
}

function toDisplayRows(list: TrConstant[]): { id: string; constValue: string; constName: string }[] {
  return list
    .filter((r) => trConstantPassesDisplayActive(r))
    .sort(compareTrConstantZoomSort)
    .map((r, idx) => ({
      id: `${r.constField}-${r.constValue}-${idx}`,
      constValue: String(r.constValue ?? ""),
      constName: String(r.constName ?? "")
    }));
}

export type TrConstantZoomModalProps = {
  open: boolean;
  onClose: () => void;
  /** 呼び元入力へ反映（名称入力補助のため主に constName を利用） */
  onSelect: (constValue: string, constName: string) => void;
  /** 指定時はフッターに「削除」（選択解除） */
  onClear?: () => void;
  /** tr_constant.const_field（例: purchase / producer） */
  constField: string;
  /** モーダル見出し */
  title?: string;
  /**
   * 事前取得済み定数（repository のマスタ）。指定時はオープン時に API を呼ばない。
   * 未指定時のみ GET /tr_constant/?const_field= で取得する。
   */
  constants?: TrConstant[];
};

/**
 * システム定数の入力補助用 ZOOM。
 * 商品マスター ZOOM（MasterZoomModal）とは別系統で、検索条件なし・名称一覧＋選択のみ。
 */
export function TrConstantZoomModal({
  open,
  onClose,
  onSelect,
  onClear,
  constField,
  title = "システム定数",
  constants
}: TrConstantZoomModalProps) {
  const [rows, setRows] = useState<{ id: string; constValue: string; constName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoadError(null);

    const field = constField.trim();

    if (constants !== undefined) {
      const list = filterByConstField(constants, field);
      if (!cancelled) {
        setRows(toDisplayRows(list));
      }
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setRows([]);

    void fetchTrConstants(field)
      .then((data) => {
        if (!cancelled) {
          setRows(toDisplayRows(data));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "取得に失敗しました");
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, constField, constants]);

  if (!open) {
    return null;
  }

  const handleSelect = (row: { constValue: string; constName: string }) => {
    onSelect(row.constValue, row.constName);
    onClose();
  };

  return (
    <div className="zoomModalOverlay" role="presentation" onClick={onClose}>
      <section
        className="zoomModalPanel zoomModalPanelNamePick"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trConstantZoomTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="zoomModalHeader">
          <h2 id="trConstantZoomTitle" className="zoomModalTitle">
            {title}
          </h2>
        </header>

        {loadError && (
          <p className="zoomModalSearchError" role="alert">
            {loadError}
          </p>
        )}

        <div className="zoomModalTableWrap">
          <table className="zoomModalTable">
            <thead>
              <tr>
                <th className="zoomModalTh zoomModalThSelect">選択</th>
                <th className="zoomModalTh zoomModalThNameOnly">名称</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="zoomModalTd zoomModalTdEmpty" colSpan={2}>
                    読み込み中…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="zoomModalTd zoomModalTdEmpty" colSpan={2}>
                    表示できる定数がありません。
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
                    <td className="zoomModalTd zoomModalTdNameOnly">{row.constName}</td>
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
