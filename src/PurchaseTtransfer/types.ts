/** 仕入実績情報一覧の1行（旧 WPF MainWindow DataGrid 列に対応） */
export type PurchaseTtransferRow = {
  id: string;
  /** 一括変更用チェック（選）… 画面側 state で管理 */
  /** 一括変更チェック操作可否（残量状況=未 の行のみ） */
  isBulkUpdateSelectable: boolean;
  /** 原料チェック ON/OFF（受入あり・原料未登録=OFF、それ以外=ON） */
  isSelected: boolean;
  /** 原料チェック操作可否（受入あり・原料未登録の行のみ true） */
  isMaterialSelectable: boolean;
  /** te_purchase_receive が存在するか */
  hasReceive: boolean;
  /** te_material が存在するか */
  hasMaterial: boolean;
  /** te_purchase_transfer が存在するか（変更・削除不可） */
  hasTransfer: boolean;
  year: number | null;
  bidNo: string;
  purchaseDate: string | null;
  purchase: string;
  variety: string;
  teaLife: string;
  grade: string;
  teaType: string;
  teaRank: string;
  fieldNo: string;
  producer: string;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  purchaseWeight: number | null;
  cost: number | null;
  discount: number | null;
  status: string;
  transferQuantity: number | null;
  target: string;
  targetPlan: string;
  lotNo: string;
};

/** 残量状況（未/残/完/誤）… すべて未チェック = 条件なし */
export type PurchaseTtransferStatusFilter = {
  mi: boolean;
  zan: boolean;
  kan: boolean;
  go: boolean;
};

/** 原料登録（未/済）… すべて未チェック = 条件なし */
export type PurchaseTtransferMaterialFilter = {
  mi: boolean;
  sumi: boolean;
};

/** 用途 target（有/無）… すべて未チェック = 条件なし */
export type PurchaseTtransferTargetFilter = {
  ari: boolean;
  nashi: boolean;
};

/** 検索ボタン押下時に確定する条件（year が null のとき年度絞込なし） */
export type PurchaseTtransferAppliedSearchCriteria = {
  year: string | null;
  purchaseDate: string | null;
  statusFilter: PurchaseTtransferStatusFilter;
  materialFilter: PurchaseTtransferMaterialFilter;
  targetFilter: PurchaseTtransferTargetFilter;
};
