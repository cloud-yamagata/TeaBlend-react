/** 第2工場入出庫実績一覧の1行（旧 StoreTransferFa2 Store モデル） */
export type StoreTransferFa2Row = {
  id: string;
  transferNo: number;
  transferDate: string | null;
  lotNo: number | null;
  lotName: string;
  processType: string;
  processTypeName: string;
  productNo: number | null;
  transferType: string;
  transferTypeName: string;
  resultType: string;
  resultTypeName: string;
  lotType: string;
  lotTypeName: string;
  reason: string;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  fractionNumber: number | null;
  transferQuantity: number | null;
  unitType: string;
  remarks: string;
};

export type StoreTransferFa2ProcessFilter = {
  "01": boolean;
  "02": boolean;
  "03": boolean;
  "04": boolean;
  "05": boolean;
};

export type StoreTransferFa2TransferTypeFilter = {
  "1": boolean;
  "2": boolean;
  "3": boolean;
};

export type StoreTransferFa2ResultTypeFilter = {
  "1": boolean;
  "2": boolean;
  "3": boolean;
  "4": boolean;
  "5": boolean;
  "8": boolean;
};

/** 検索適用後の条件（year が null のとき年度絞込なし） */
export type StoreTransferFa2AppliedSearchCriteria = {
  year: string | null;
  keywords: string[];
  transferDate: string | null;
  processTypes: string[];
  transferTypes: string[];
  resultTypes: string[];
};

export type StoreTransferFa2FilterResult = {
  rows: StoreTransferFa2Row[];
  totalCount: number;
};
