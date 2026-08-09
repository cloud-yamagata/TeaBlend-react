/**
 * 第1工場生産実績情報一覧の1行（旧 Factory1Rresult MainWindow DataGrid 列）
 */
export type Factory1RresultRow = {
  id: string;
  /** 一括受入対象チェック操作可否 */
  isBulkTransferSelectable: boolean;
  /** 原料チェック操作可否（is_chk_usable） */
  isMaterialSelectable: boolean;
  /** te_material が存在するか */
  hasMaterial: boolean;
  /** te_factory1_transfer が存在するか */
  hasTransfer: boolean;
  lotNo: string;
  year: number | null;
  workDate: string | null;
  variety: string;
  teaLife: string;
  grade: string;
  teaRank: string;
  fieldNo: string;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  purchaseWeight: number | null;
  status: string;
  transferQuantity: number | null;
  transferDate: string | null;
  transferUnitNumber: number | null;
  transferFractionNumber: number | null;
  target: string;
  remarks: string;
};

/** 残量状況（未/残/完/誤）… すべて未チェック = 条件なし */
export type Factory1RresultStatusFilter = {
  mi: boolean;
  zan: boolean;
  kan: boolean;
  go: boolean;
};

/** 検索ボタン押下時に確定する条件 */
export type Factory1RresultAppliedSearchCriteria = {
  year: string;
  keywords: string[];
  workDate: string | null;
  statusFilter: Factory1RresultStatusFilter;
  /** 原料登録可能な行のみ（一覧検索UIからは未使用） */
  materialUsableOnly: boolean;
};

export const FACTORY1_RRESULT_MAX_ROWS = 500;
