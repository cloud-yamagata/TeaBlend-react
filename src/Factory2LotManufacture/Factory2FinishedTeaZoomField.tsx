/**
 * 仕上茶 ZOOM 用：読取専用テキスト＋「仕上茶」ボタン（検索条件・登録メニューで共用）
 */
const ITEM_NAME_PLACEHOLDER = "（通称名を選択してください）";

type Props = {
  value: string;
  onOpenZoom: () => void;
  /** true のとき行内の余白をテキスト欄で埋める（2段目検索条件向け） */
  fillRemaining?: boolean;
};

export function Factory2FinishedTeaZoomField({ value, onOpenZoom, fillRemaining = false }: Props) {
  const groupClass = fillRemaining
    ? "factory2ItemNameZoomGroup factory2ItemNameZoomGroupFill"
    : "factory2ItemNameZoomGroup factory2ItemNameZoomGroupMenu";

  return (
    <div className={groupClass}>
      <input
        className="factory2ItemNameReadonly"
        type="text"
        readOnly
        value={value}
        placeholder={ITEM_NAME_PLACEHOLDER}
        aria-label="通称名"
      />
      <button type="button" className="zoomOpenButton factory2ZoomOpenButton" onClick={onOpenZoom}>
        仕上茶
      </button>
    </div>
  );
}

export { ITEM_NAME_PLACEHOLDER };
