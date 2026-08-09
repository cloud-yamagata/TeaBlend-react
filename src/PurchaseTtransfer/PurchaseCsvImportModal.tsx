/**
 * 仕入実績 CSV 取込モーダル（宮崎入札 CSV → 確認 → 登録）
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { EditModalOverlay } from "../components/modal";
import { masterEntityCacheAtom } from "../repository/masterData";
import {
  diffPurchaseCsvImport,
  downloadPurchaseCheckCsv,
  toPurchaseTeaUpsertBody
} from "./comparePurchaseCsvImport";
import { parseMiyazakiAuctionCsv, readCsvFileAsText } from "./parseMiyazakiAuctionCsv";
import type { PurchaseCsvImportDiff, PurchaseCsvParseMeta } from "./purchaseCsvImportTypes";
import { refreshPurchaseTeaMasterAtom } from "./refreshPurchaseTeaMaster";
import { upsertPurchaseTea } from "../repositories/purchaseTeaRepository";
import "./purchaseCsvImport.css";

type Phase = "drop" | "preview" | "registering" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  filterYear: string;
};

export function PurchaseCsvImportModal({ open, onClose, filterYear }: Props) {
  const cache = useAtomValue(masterEntityCacheAtom);
  const refreshPurchaseTea = useSetAtom(refreshPurchaseTeaMasterAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("drop");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [meta, setMeta] = useState<PurchaseCsvParseMeta | null>(null);
  const [diffs, setDiffs] = useState<PurchaseCsvImportDiff[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [registerProgress, setRegisterProgress] = useState({ done: 0, total: 0 });

  const resetState = useCallback(() => {
    setPhase("drop");
    setDragOver(false);
    setFileName("");
    setMeta(null);
    setDiffs([]);
    setError("");
    setStatus("");
    setRegisterProgress({ done: 0, total: 0 });
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setStatus("CSV を読み込んでいます…");
      try {
        const text = await readCsvFileAsText(file);
        const parsed = parseMiyazakiAuctionCsv(text);
        const nextDiffs = diffPurchaseCsvImport(parsed.rows, cache.te_purchase_tea, filterYear);
        setFileName(file.name);
        setMeta(parsed.meta);
        setDiffs(nextDiffs);
        setPhase("preview");
        if (nextDiffs.length === 0) {
          setStatus("取り込み対象の仕入実績はありません（新規・差分なし）。");
        } else {
          const newCount = nextDiffs.filter((d) => d.kind === "new").length;
          const changedCount = nextDiffs.filter((d) => d.kind === "changed").length;
          setStatus(`新規 ${newCount} 件 / 差分 ${changedCount} 件（CSV ${parsed.meta.rowCount} 行・年度 ${filterYear}）`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("drop");
        setStatus("");
      }
    },
    [cache.te_purchase_tea, filterYear]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (!file) return;
      if (!/\.csv$/i.test(file.name)) {
        setError("CSV ファイルをドロップしてください。");
        return;
      }
      void processFile(file);
    },
    [processFile]
  );

  const onRegister = useCallback(async () => {
    if (diffs.length === 0) return;
    setPhase("registering");
    setError("");
    setRegisterProgress({ done: 0, total: diffs.length });
    try {
      for (let i = 0; i < diffs.length; i += 1) {
        await upsertPurchaseTea(toPurchaseTeaUpsertBody(diffs[i].row));
        setRegisterProgress({ done: i + 1, total: diffs.length });
      }
      await refreshPurchaseTea();
      setPhase("done");
      setStatus(`${diffs.length} 件を登録しました。`);
    } catch (err) {
      setPhase("preview");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [diffs, refreshPurchaseTea]);

  if (!open) return null;

  const previewRows = diffs.slice(0, 50);

  return (
    <EditModalOverlay mode="view" onClose={handleClose} className="purchaseCsvImportOverlay">
      <div
        className="purchaseCsvImportModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchaseCsvImportTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="purchaseCsvImportHeader">
          <h2 id="purchaseCsvImportTitle">CSV 取込（宮崎入札）</h2>
          <button type="button" className="purchaseCsvImportClose" onClick={handleClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <p className="purchaseCsvImportHint">
          宮崎入札の商社別買取一覧表 CSV をドロップしてください。年度 {filterYear} の行のみ取り込み対象です。
        </p>

        {phase === "drop" ? (
          <div
            className={`purchaseCsvImportDropZone${dragOver ? " isDragOver" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <p className="purchaseCsvImportDropTitle">CSV ファイルをここにドロップ</p>
            <p className="purchaseCsvImportDropSub">または</p>
            <button
              type="button"
              className="factory2DarkButton"
              onClick={() => fileInputRef.current?.click()}
            >
              ファイルを選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="purchaseCsvImportFileInput"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processFile(file);
                e.target.value = "";
              }}
            />
          </div>
        ) : null}

        {meta ? (
          <dl className="purchaseCsvImportMeta">
            <div>
              <dt>商社</dt>
              <dd>{meta.purchase || "—"}</dd>
            </div>
            <div>
              <dt>入札会日</dt>
              <dd>{meta.auctionDateText}</dd>
            </div>
            <div>
              <dt>ファイル</dt>
              <dd>{fileName}</dd>
            </div>
          </dl>
        ) : null}

        {status ? <p className="purchaseCsvImportStatus">{status}</p> : null}
        {error ? <p className="purchaseCsvImportError">{error}</p> : null}

        {phase === "preview" || phase === "done" ? (
          <>
            {diffs.length > 0 ? (
              <div className="purchaseCsvImportPreviewWrap">
                <table className="purchaseCsvImportPreview">
                  <thead>
                    <tr>
                      <th>区分</th>
                      <th>入札NO</th>
                      <th>仕入先</th>
                      <th>生産者</th>
                      <th>梱包</th>
                      <th>差分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((diff) => (
                      <tr key={`${diff.row.bidNo}-${diff.kind}`}>
                        <td>{diff.kind === "new" ? "新規" : "差分"}</td>
                        <td>{diff.row.bidNo}</td>
                        <td>{diff.row.purchase}</td>
                        <td>{diff.row.producer}</td>
                        <td>
                          {diff.row.unitWeight}×{diff.row.unitNumber}
                          {diff.row.fractionNumber > 0
                            ? ` + ${diff.row.fractionWeight}×${diff.row.fractionNumber}`
                            : ""}
                        </td>
                        <td>{diff.changedFields?.join("、") ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {diffs.length > previewRows.length ? (
                  <p className="purchaseCsvImportPreviewMore">他 {diffs.length - previewRows.length} 件…</p>
                ) : null}
              </div>
            ) : null}

            <div className="purchaseCsvImportActions">
              {diffs.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="factory2DarkButton wide"
                    onClick={() => downloadPurchaseCheckCsv(diffs)}
                  >
                    確認 CSV ダウンロード
                  </button>
                  <button
                    type="button"
                    className="factory2DarkButton wide"
                    disabled={phase === "done"}
                    onClick={() => void onRegister()}
                  >
                    登録
                  </button>
                </>
              ) : null}
              <button type="button" className="factory2DarkButton" onClick={resetState}>
                別ファイル
              </button>
              <button type="button" className="factory2DarkButton" onClick={handleClose}>
                閉じる
              </button>
            </div>
          </>
        ) : null}

        {phase === "registering" ? (
          <p className="purchaseCsvImportStatus">
            登録中… {registerProgress.done} / {registerProgress.total}
          </p>
        ) : null}
      </div>
    </EditModalOverlay>
  );
}
