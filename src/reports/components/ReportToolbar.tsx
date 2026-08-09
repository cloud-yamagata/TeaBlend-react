/**
 * 【処理概要】
 *   レポート画面上部のツールバー（現状は Excel 出力ボタンのみ）。
 *
 * 【パラメータ仕様】
 *   - `onExcel` … `reportApi.downloadReportExcel` を呼ぶコールバックを親から渡す
 *   - `disabled` … 実行中は無効化
 */
type Props = {
  onExcel: () => void;
  disabled?: boolean;
};

export default function ReportToolbar({ onExcel, disabled }: Props) {
  return (
    <div className="listToolbar">
      <button className="actionButton" type="button" onClick={onExcel} disabled={disabled}>
        Excel出力
      </button>
    </div>
  );
}

