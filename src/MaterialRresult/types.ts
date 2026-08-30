/**
 * 原料実績情報一覧の1行（旧 MaterialRresult MainWindow DataGrid 列）
 */
export type MaterialRresultRow = {
  id: string;
  /** 原料チェック操作可否（is_chk_usable） */
  isMaterialSelectable: boolean;
  /** te_material が存在するか */
  hasMaterial: boolean;
  year: number | null;
  purchase: string;
  purchaseDate: string | null;
  productNo: string;
  teaRank: string;
  rank: string;
  teaType: string;
  teaLife: string;
  organicClass: string;
  producer: string;
  materialName: string;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  purchaseWeight: number | null;
  /** 確定: 完 / 未 */
  status: string;
  remarks: string;
};

/** 格付フィルタ（A=有機茶 / B=無農薬 / C=一般茶）… すべて未チェック = A,B,C 全部 */
export type MaterialRresultOrganicFilter = {
  a: boolean;
  b: boolean;
  c: boolean;
};

/** 検索ボタン押下時に確定する条件 */
export type MaterialRresultAppliedSearchCriteria = {
  year: string | null;
  keywords: string[];
  purchaseDate: string | null;
  organicFilter: MaterialRresultOrganicFilter;
  /** 原料登録可能な行のみ */
  materialUsableOnly: boolean;
};

export function materialRresultRowId(
  year: number,
  purchase: string,
  productNo: string,
  purchaseDate: string,
  teaRank: string,
  rank: string
): string {
  return `${year}|${purchase}|${productNo}|${purchaseDate}|${teaRank}|${rank}`;
}
