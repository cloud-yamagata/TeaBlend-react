/**
 * 商品原料対照表メンテナンス（ItemBomCorrect）型
 */
export type ItemBomCorrectRow = {
  id: string;
  itemNo: number;
  organicClass: string;
  itemName: string;
  childItemNo: number | null;
  useOrganicClass: string;
  useItemName: string;
};
