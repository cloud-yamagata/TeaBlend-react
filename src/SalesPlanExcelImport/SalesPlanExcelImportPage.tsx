/**
 * 販売計画 Excel 取込画面
 */
import { useCallback, useMemo, useRef, useState, type DragEvent } from "react";
import {
  previewSalesPlanExcelImport,
  registerSalesPlanExcelImport,
  type SalesPlanImportErrorEntry,
  type SalesPlanImportPreview,
  type SalesPlanImportRegisterResult
} from "../repositories/salesPlanExcelImportRepository";
import "../PurchaseTtransfer/purchaseCsvImport.css";
import "./salesPlanExcelImport.css";

type Phase = "drop" | "preview" | "registering" | "done";

function errorCodeLabel(code: string): string {
  if (code === "link_not_found") return "リンク未登録";
  if (code === "bom_not_found") return "BOM未登録";
  return code;
}

function formatErrorLocation(entry: SalesPlanImportErrorEntry): string {
  const parts: string[] = [];
  if (entry.item_no != null) parts.push(`商品NO=${entry.item_no}`);
  if (entry.excel_column) parts.push(`Excel列=${entry.excel_column}`);
  if (entry.qty != null) parts.push(`数量=${entry.qty.toLocaleString("ja-JP")}`);
  return parts.join(" / ");
}

export default function SalesPlanExcelImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("drop");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SalesPlanImportPreview | null>(null);
  const [registerResult, setRegisterResult] = useState<SalesPlanImportRegisterResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"errors" | "sales" | "product">("sales");
  const [errorsOnly, setErrorsOnly] = useState(false);

  const resetState = useCallback(() => {
    setPhase("drop");
    setDragOver(false);
    setFile(null);
    setPreview(null);
    setRegisterResult(null);
    setError("");
    setStatus("");
    setActiveTab("sales");
    setErrorsOnly(false);
  }, []);

  const processFile = useCallback(async (nextFile: File) => {
    setError("");
    setStatus("Excel を解析しています…");
    try {
      const result = await previewSalesPlanExcelImport(nextFile);
      setFile(nextFile);
      setPreview(result);
      setRegisterResult(null);
      setPhase("preview");
      const s = result.summary;
      const hasErrors = !s.can_register;
      setActiveTab(
        hasErrors ? "errors" : s.link_not_found > 0 ? "sales" : s.bom_not_found > 0 ? "product" : "sales"
      );
      setErrorsOnly(hasErrors);
      setStatus(
        `${result.year}年${result.month}月 / 販売計画 ${s.ok_sales_rows}/${s.total_sales_rows} 件 / ` +
          `製造計画 ${s.ok_product_rows}/${s.total_product_rows} 件` +
          (hasErrors ? ` / エラー ${result.errors.length} 件` : "")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("drop");
      setStatus("");
    }
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const next = event.dataTransfer.files[0];
      if (!next) return;
      if (!/\.(xlsx|xlsm)$/i.test(next.name)) {
        setError("Excel ファイル（.xlsx）をドロップしてください。");
        return;
      }
      void processFile(next);
    },
    [processFile]
  );

  const onRegister = useCallback(async () => {
    if (!file || !preview?.summary.can_register) return;
    setPhase("registering");
    setError("");
    setStatus("登録中…");
    try {
      const result = await registerSalesPlanExcelImport(file);
      setRegisterResult(result);
      setPhase("done");
      setStatus(
        `${result.year}年${result.month}月を登録しました（販売計画 ${result.sales_count} 件 / 製造計画 ${result.product_count} 件）`
      );
    } catch (err) {
      setPhase("preview");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [file, preview?.summary.can_register]);

  const salesRows = preview?.sales_rows ?? [];
  const productRows = preview?.product_rows ?? [];
  const errorRows = preview?.errors ?? [];
  const filteredSalesRows = errorsOnly ? salesRows.filter((r) => r.status !== "ok") : salesRows;
  const filteredProductRows = errorsOnly ? productRows.filter((r) => r.status !== "ok") : productRows;
  const previewSalesRows = filteredSalesRows.slice(0, 80);
  const previewProductRows = filteredProductRows.slice(0, 120);

  const canSubmitRegister = Boolean(file && preview?.summary.can_register) && phase !== "registering";
  const isRegistered = phase === "done" && registerResult != null;

  const tabCaption = useMemo(() => {
    if (isRegistered) {
      if (activeTab === "errors") return "登録前に検出したエラー内容を表示しています。";
      if (activeTab === "sales") {
        return `登録済みの販売計画を表示しています（${registerResult.sales_count} 件）。タブ切替は確認のみで、追加登録は不要です。`;
      }
      return `登録済みの製造計画を表示しています（内訳 ${productRows.length} 行 → DB ${registerResult.product_count} 件）。タブ切替は確認のみです。`;
    }
    if (activeTab === "errors") return "エラーを解消してから登録してください。";
    if (activeTab === "sales") {
      return "販売計画のプレビューです。登録すると対象年月の te_monthly_sales_plan を Excel 内容で差し替えます。";
    }
    return "製造計画のプレビューです。登録すると対象年月の te_monthly_product_plan を Excel 内容で差し替えます（内訳から合算）。";
  }, [activeTab, isRegistered, productRows.length, registerResult]);

  const registrationStatusLabel = useMemo(() => {
    if (isRegistered) return "登録済み";
    if (preview?.summary.can_register) return "未登録";
    return "不可（エラーあり）";
  }, [isRegistered, preview?.summary.can_register]);

  const errorHints = useMemo(() => {
    const hints: string[] = [];
    if (preview?.summary.link_not_found) {
      hints.push("tr_sales_link_name に sales_item_name を登録するか、sql/seed_tr_sales_link_name.sql を実行してください。");
    }
    if (preview?.summary.bom_not_found) {
      hints.push("商品原料対照表メンテナンスで target_key の parent_item_no（親商品NO）を登録してください。");
    }
    return hints;
  }, [preview?.summary.bom_not_found, preview?.summary.link_not_found]);

  return (
    <main className="page salesPlanExcelImportPage">
      <header className="toolbar">
        <h1 className="title">販売計画 Excel 取込</h1>
      </header>

      <p className="salesPlanExcelImportLead">
        販売計画表 Excel をドロップすると、B1 の年月を読み取り、
        <code>te_monthly_sales_plan</code> と <code>te_monthly_product_plan</code> を同時に登録します。
        D〜I 列はその月の内訳として取り込みます。
      </p>
      <p className="salesPlanExcelImportWarn">
        登録処理により、対象年月のデータは、すべて削除して差し替えます（既に登録済みの年月でも、Excel に含まれない商品は、削除されます）。但し エラー商品がある場合は、取り込み処理は、取り消されます。
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
          <p className="purchaseCsvImportDropTitle">Excel ファイルをここにドロップ</p>
          <p className="purchaseCsvImportDropSub">または</p>
          <button type="button" className="factory2DarkButton" onClick={() => fileInputRef.current?.click()}>
            ファイルを選択
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="purchaseCsvImportFileInput"
            onChange={(e) => {
              const next = e.target.files?.[0];
              if (next) void processFile(next);
              e.target.value = "";
            }}
          />
        </div>
      ) : null}

      {preview ? (
        <dl className="purchaseCsvImportMeta salesPlanExcelImportMeta">
          <div>
            <dt>対象年月</dt>
            <dd>
              {preview.year}年{preview.month}月
            </dd>
          </div>
          <div>
            <dt>ファイル</dt>
            <dd>{preview.file_name}</dd>
          </div>
          <div>
            <dt>登録状態</dt>
            <dd>
              <span
                className={
                  isRegistered
                    ? "salesPlanExcelImportStatusBadge isRegistered"
                    : preview.summary.can_register
                      ? "salesPlanExcelImportStatusBadge isPending"
                      : "salesPlanExcelImportStatusBadge isBlocked"
                }
              >
                {registrationStatusLabel}
              </span>
            </dd>
          </div>
          {(preview.summary.duplicate_item_nos?.length ?? 0) > 0 ? (
            <div>
              <dt>商品NO合算</dt>
              <dd>
                Excel {preview.summary.ok_sales_rows} 行 → 登録 {preview.summary.merged_sales_rows} 行（
                {preview.summary.duplicate_item_nos.join("、")}）
              </dd>
            </div>
          ) : null}
          {errorRows.length > 0 ? (
            <div>
              <dt>エラー</dt>
              <dd>{errorRows.length} 件</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {errorHints.length > 0 ? (
        <ul className="salesPlanExcelImportHints">
          {errorHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      ) : null}

      {phase === "done" && registerResult ? (
        <div className="salesPlanExcelImportDoneCard" role="status">
          <p className="salesPlanExcelImportDoneTitle">登録が完了しました</p>
          <p className="salesPlanExcelImportDoneBody">
            {registerResult.year}年{registerResult.month}月の販売計画 {registerResult.sales_count} 件 /
            製造計画 {registerResult.product_count} 件を登録しました。下のタブで内容を確認できます。
          </p>
        </div>
      ) : null}

      {status && phase !== "done" ? <p className="purchaseCsvImportStatus">{status}</p> : null}
      {error ? <p className="purchaseCsvImportError">{error}</p> : null}

      {phase === "preview" || phase === "done" || phase === "registering" ? (
        <>
          <div className="salesPlanExcelImportTabBar">
            <div className="salesPlanExcelImportTabs" role="tablist" aria-label="取込プレビュー">
              {errorRows.length > 0 ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "errors"}
                  className={activeTab === "errors" ? "isActive isErrorTab" : "isErrorTab"}
                  onClick={() => setActiveTab("errors")}
                >
                  エラー一覧（{errorRows.length}）
                </button>
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "sales"}
                className={activeTab === "sales" ? "isActive" : ""}
                onClick={() => setActiveTab("sales")}
              >
                販売計画（{salesRows.length}）{isRegistered ? " ✓" : ""}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "product"}
                className={activeTab === "product" ? "isActive" : ""}
                onClick={() => setActiveTab("product")}
              >
                製造計画（{productRows.length}）{isRegistered ? " ✓" : ""}
              </button>
            </div>
            {preview && !preview.summary.can_register && activeTab !== "errors" ? (
              <label className="salesPlanExcelImportErrorsOnly">
                <input
                  type="checkbox"
                  checked={errorsOnly}
                  onChange={(e) => setErrorsOnly(e.target.checked)}
                />
                エラーのみ表示
              </label>
            ) : null}
          </div>

          <p className="salesPlanExcelImportTabCaption">{tabCaption}</p>

          <div className="purchaseCsvImportPreviewWrap">
            <div role="tabpanel" hidden={activeTab !== "errors"} className="salesPlanExcelImportTabPanel">
              {activeTab === "errors" ? (
              <table className="purchaseCsvImportPreview salesPlanExcelImportErrorTable">
                <thead>
                  <tr>
                    <th>エラーコード</th>
                    <th>販売商品名</th>
                    <th>対象（Excel/商品）</th>
                    <th>参照テーブル</th>
                    <th>対象キー</th>
                    <th>内容</th>
                  </tr>
                </thead>
                <tbody>
                  {errorRows.map((entry, idx) => (
                    <tr key={`${entry.error_code}-${entry.target_key}-${entry.excel_column ?? ""}-${idx}`}>
                      <td>
                        <code className="salesPlanExcelImportCode">{entry.error_code}</code>
                        <span className="salesPlanExcelImportCodeLabel">{errorCodeLabel(entry.error_code)}</span>
                      </td>
                      <td>{entry.sales_item_name}</td>
                      <td>
                        <code>{formatErrorLocation(entry) || "—"}</code>
                      </td>
                      <td>
                        <code>{entry.target_table}</code>
                      </td>
                      <td>
                        <code>{entry.target_key}</code>
                      </td>
                      <td>{entry.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : null}
            </div>

            <div role="tabpanel" hidden={activeTab !== "sales"} className="salesPlanExcelImportTabPanel">
              {activeTab === "sales" ? (
              <table className="purchaseCsvImportPreview">
                <thead>
                  <tr>
                    <th>販売商品名</th>
                    <th>商品NO</th>
                    <th>商品名</th>
                    <th>販売数</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {previewSalesRows.map((row, idx) => (
                    <tr key={`${row.sales_item_name}-${idx}`} className={row.status !== "ok" ? "isError" : ""}>
                      <td>{row.sales_item_name}</td>
                      <td>{row.item_no ?? ""}</td>
                      <td>{row.item_name}</td>
                      <td>{row.sales_size.toLocaleString("ja-JP")}</td>
                      <td>
                        {row.status !== "ok" ? (
                          <code className="salesPlanExcelImportCode">{row.status}</code>
                        ) : null}{" "}
                        {row.message || (row.status === "ok" ? "OK" : "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : null}
            </div>

            <div role="tabpanel" hidden={activeTab !== "product"} className="salesPlanExcelImportTabPanel">
              {activeTab === "product" ? (
              <table className="purchaseCsvImportPreview">
                <thead>
                  <tr>
                    <th>販売商品名</th>
                    <th>列</th>
                    <th>数量</th>
                    <th>商品NO</th>
                    <th>仕上茶NO</th>
                    <th>仕上茶名</th>
                    <th>必要量</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {previewProductRows.map((row, idx) => (
                    <tr key={`${row.sales_item_name}-${row.column}-${idx}`} className={row.status !== "ok" ? "isError" : ""}>
                      <td>{row.sales_item_name}</td>
                      <td>{row.column}</td>
                      <td>{row.qty.toLocaleString("ja-JP")}</td>
                      <td>{row.item_no ?? ""}</td>
                      <td>{row.bulk_no ?? ""}</td>
                      <td>{row.item_name}</td>
                      <td>{row.need_size.toLocaleString("ja-JP")}</td>
                      <td>
                        {row.status !== "ok" ? (
                          <code className="salesPlanExcelImportCode">{row.status}</code>
                        ) : null}{" "}
                        {row.message || (row.status === "ok" ? "OK" : "")}
                        {row.status === "bom_not_found" && row.item_no != null ? (
                          <div className="salesPlanExcelImportRowKey">
                            <code>tr_item_bom.parent_item_no={row.item_no}</code>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : null}
            </div>
          </div>

          <div className="purchaseCsvImportActions salesPlanExcelImportActions">
            {isRegistered ? (
              <>
                <span className="salesPlanExcelImportRegisteredBadge" aria-live="polite">
                  登録済み
                </span>
                <button
                  type="button"
                  className="factory2DarkButton salesPlanExcelImportSecondaryAction"
                  disabled={!canSubmitRegister}
                  onClick={() => void onRegister()}
                >
                  差し替え再登録
                </button>
              </>
            ) : (
              <button
                type="button"
                className="factory2DarkButton wide"
                disabled={!canSubmitRegister}
                onClick={() => void onRegister()}
              >
                登録（対象年月を差し替え）
              </button>
            )}
            <button type="button" className="factory2DarkButton" onClick={resetState}>
              別ファイル
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
