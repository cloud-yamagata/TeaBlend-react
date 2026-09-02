/** 第3工場入出庫実績（te_store_transfer・store_no=3）一覧の1行 */
export type StoreTransferRow = {
  id: string;
  transferNo: number;
  transferDate: string | null;
  itemNo: number;
  productNo: number;
  lotNo: string;
  storeNo: number;
  storePartyName: string;
  transferType: string;
  transferTypeName: string;
  resultType: string;
  resultTypeName: string;
  lotType: string;
  lotTypeName: string;
  reason: string;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  transferQuantity: number;
  unitType: string;
  remarks: string;
};

export type StoreTransferTransferTypeFilter = {
  "1": boolean;
  "2": boolean;
  "3": boolean;
};

export type StoreTransferResultTypeFilter = {
  "1": boolean;
  "2": boolean;
  "3": boolean;
  "4": boolean;
  "5": boolean;
  "8": boolean;
};

/** 検索適用後の条件（year が null のとき年度絞込なし） */
export type StoreTransferAppliedSearchCriteria = {
  year: string | null;
  keywords: string[];
  transferDate: string | null;
  transferTypes: string[];
  resultTypes: string[];
};

export type StoreTransferFilterResult = {
  rows: StoreTransferRow[];
  totalCount: number;
};

/** 第3工場倉庫NO（te_store_transfer.store_no） */
export const FACTORY3_STORE_NO = 3;
