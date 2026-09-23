/**
 * 振分実績一覧ツールバー
 */
type Props = {
  excelDisabled: boolean;
  excelTitle?: string;
  exporting: boolean;
  onExcel: () => void;
  enableTransferCrud?: boolean;
  registerDisabled?: boolean;
  registerTitle?: string;
  onRegister?: () => void;
  modifyDisabled?: boolean;
  modifyTitle?: string;
  onUpdate?: () => void;
  onDelete?: () => void;
};

export function PurchaseResaleListToolbar({
  excelDisabled,
  excelTitle,
  exporting,
  onExcel,
  enableTransferCrud = false,
  registerDisabled = true,
  registerTitle,
  onRegister,
  modifyDisabled = true,
  modifyTitle,
  onUpdate,
  onDelete
}: Props) {
  return (
    <section className="purchaseResaleListToolbar" aria-label="操作メニュー">
      {enableTransferCrud ? (
        <>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={registerDisabled}
            title={registerTitle}
            onClick={onRegister}
          >
            登録
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={modifyDisabled}
            title={modifyTitle}
            onClick={onUpdate}
          >
            変更
          </button>
          <button
            type="button"
            className="factory2DarkButton"
            disabled={modifyDisabled}
            title={modifyTitle}
            onClick={onDelete}
          >
            削除
          </button>
        </>
      ) : null}
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
