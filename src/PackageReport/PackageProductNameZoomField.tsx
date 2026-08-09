/**
 * 商品名 ZOOM 用：商品No・商品名・「商品名」ボタン（検索条件）
 */
const PRODUCT_NAME_PLACEHOLDER = "（商品名を選択してください）";

type Props = {
  itemNo: string;
  productName: string;
  onItemNoChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onOpenZoom: () => void;
};

export function PackageProductNameZoomField({
  itemNo,
  productName,
  onItemNoChange,
  onProductNameChange,
  onOpenZoom
}: Props) {
  return (
    <div className="searchFieldItemZoomGroup packageLotItemZoomGroup">
      <label className="searchField">
        <span className="searchFieldLabel">商品No</span>
        <input
          className="searchControl searchControlItemNo"
          type="text"
          inputMode="numeric"
          value={itemNo}
          onChange={(e) => onItemNoChange(e.target.value)}
          autoComplete="off"
          aria-label="商品No"
        />
      </label>
      <label className="searchField">
        <span className="searchFieldLabel">商品名</span>
        <input
          className="searchControl searchControlItemName"
          type="text"
          value={productName}
          placeholder={PRODUCT_NAME_PLACEHOLDER}
          onChange={(e) => onProductNameChange(e.target.value)}
          autoComplete="off"
          aria-label="商品名"
        />
      </label>
      <div className="searchField searchFieldZoomButtonWrap">
        <span className="searchFieldLabel searchFieldLabelSpacer">&nbsp;</span>
        <button type="button" className="zoomOpenButton" onClick={onOpenZoom}>
          商品名
        </button>
      </div>
    </div>
  );
}

export { PRODUCT_NAME_PLACEHOLDER };
