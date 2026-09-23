/** 仕入実績情報一覧の1行（旧 WPF MainWindow DataGrid 列に対応） */
export type PurchaseTtransferRow = {
  id: string;
  /** 一括変更・一括振分チェック操作可否（WPF は全行可） */
  isBulkUpdateSelectable: boolean;
  /** 原料チェック操作可否（工場振分 result_type=1 あり・原料未登録。WPF is_chk_usable 相当） */
  isMaterialSelectable: boolean;
  /** te_purchase_transfer.result_type='1' の重量合計 > 0 か */
  hasFactoryTransfer: boolean;
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
