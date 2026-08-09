/** 仕入受入情報一覧の1行（旧 WPF PurchaseReceive MainWindow DataGrid 列） */
export type PurchaseReceiveRow = {
  id: string;
  year: number;
  bidNo: string;
  purchaseDate: string;
  purchase: string;
  variety: string;
  teaLife: string;
  grade: string;
  teaType: string;
  teaRank: string;
  fieldNo: string;
  producer: string;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  /** 移動重量（当該振分行） */
  transferQuantity: number;
  /** 残量状況: 未 / 残 / 完 / 誤 */
  status: string;
  /** 受入重量合計（仕入キー単位） */
  receiveQuantity: number;
  target: string;
  targetPlan: string;
  lotNo: string;
  transfer: string;
  resultType: string;
};

/** 仕入受入実績（SubWindow 行） */
export type PurchaseReceiveDetailRow = {
  id: string;
  year: number;
  purchase: string;
  bidNo: string;
  receiveDate: string;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  transferQuantity: number;
  remarks: string;
};

export type PurchaseReceiveStatusFilter = {
  mi: boolean;
  zan: boolean;
  kan: boolean;
  go: boolean;
};

export type PurchaseReceiveAppliedSearchCriteria = {
  year: string;
  keywords: readonly string[];
  purchaseDate: string | null;
  statusFilter: PurchaseReceiveStatusFilter;
};

export const PURCHASE_RECEIVE_MAX_ROWS = 500;
