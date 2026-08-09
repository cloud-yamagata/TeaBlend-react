/**
 * 【処理概要】
 *   商品マスタ ZOOM に渡す「固定絞り込み」パラメータ。未指定のキーは検索条件に含めない。
 *
 * 【パラメータ仕様】
 *   - `systemClass` … tr_item.system_class
 *   - `organicClass` … organic_class（文字列一致）
 *   - `itemGroupNo` … item_group_no（数値一致）
 */
export type TrItemZoomFilterParams = {
  /** system_class */
  systemClass?: string | null;
  /** organic_class */
  organicClass?: string | null;
  /** item_group_no */
  itemGroupNo?: number | null;
};
