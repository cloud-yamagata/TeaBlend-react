/**
 * レポート共通アクションバー
 * - default … 実行 / Excel出力 / 抽出クリア
 * - extractOnly … 抽出のみ（仕上茶ボタン右横用）
 */
type Props = {
  onClear?: () => void;
  onRun?: () => void;
  onExtract?: () => void;
  onExcel?: () => void;
  runDisabled?: boolean;
  extractDisabled?: boolean;
  excelDisabled?: boolean;
  clearDisabled?: boolean;
  /** inline … 抽出パネル内 / searchPanel … 検索パネル右端 / toolbar … ヘッダ */
  placement?: "inline" | "searchPanel" | "toolbar";
  /** extractOnly … 抽出ボタンのみ */
  variant?: "default" | "extractOnly";
};

export default function ReportActionBar({
  onRun,
  onExtract,
  onExcel,
  onClear,
  runDisabled,
  extractDisabled,
  excelDisabled,
  clearDisabled,
  placement = "inline",
  variant = "default"
}: Props) {
  if (variant === "extractOnly") {
    if (!onExtract) return null;
    return (
      <button
        type="button"
        className="searchSubmitButton reportSearchPanelSubmit"
        onClick={onExtract}
        disabled={extractDisabled}
      >
        抽出
      </button>
    );
  }

  const className =
    placement === "toolbar"
      ? "searchActions reportExtractActions reportToolbarActions"
      : placement === "searchPanel"
        ? "searchActions reportExtractActions reportSearchPanelActions"
        : "searchActions reportExtractActions reportFilterActions";

  return (
    <div className={className}>
      {onRun ? (
        <button
          className="searchSubmitButton reportSearchPanelSubmit"
          type="button"
          onClick={onRun}
          disabled={runDisabled}
        >
          実行
        </button>
      ) : null}
      {onExcel ? (
        <button className="actionButton" type="button" onClick={onExcel} disabled={excelDisabled}>
          Excel出力
        </button>
      ) : null}
      {onClear ? (
        <button className="actionButton" type="button" onClick={onClear} disabled={clearDisabled}>
          抽出クリア
        </button>
      ) : null}
    </div>
  );
}
