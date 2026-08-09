/**
 * 振分実績一覧ツールバー（Excel 出力）
 */
type Props = {
  excelDisabled: boolean;
  excelTitle?: string;
  exporting: boolean;
  onExcel: () => void;
};

export function PurchaseResaleListToolbar({ excelDisabled, excelTitle, exporting, onExcel }: Props) {
  return (
    <section className="purchaseResaleListToolbar" aria-label="操作メニュー">
      <button
        type="button"
        className="factory2DarkButton"
        disabled={excelDisabled || exporting}
        title={excelTitle ?? "検索結果を Excel 出力"}
        onClick={onExcel}
      >
        {exporting ? "Excel出力中…" : "Excel出力"}
      </button>
    </section>
  );
}
