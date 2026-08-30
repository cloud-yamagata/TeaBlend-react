/**
 * 振分実績一覧（PurchaseResaleList）行型
 */
export type PurchaseResaleListRow = {
  id: string;
  year: number;
  purchase: string;
  bidNo: string;
  transfer: string;
  transferDate: string;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  transferWeight: number;
  transferNumber: number;
  unitPrice: number | null;
  purchaseDate: string;
  variety: string;
  teaLife: string;
  grade: string;
  teaType: string;
  teaRank: string;
  fieldNo: string;
  producer: string;
  discount: number;
  purchaseWeight: number;
  purchaseNumber: number;
  target: string;
  targetPlan: string;
  lotNo: string;
  cost: number | null;
  remarks: string;
};

export type PurchaseResaleListTeaLifeFilter = {
  tea1: boolean;
  tea2: boolean;
  tea3: boolean;
  tea4: boolean;
  bancha: boolean;
  aki: boolean;
};

export const defaultPurchaseResaleListTeaLifeFilter = (): PurchaseResaleListTeaLifeFilter => ({
  tea1: false,
  tea2: false,
  tea3: false,
  tea4: false,
  bancha: false,
  aki: false
});

/** 検索適用済み条件 */
export type PurchaseResaleListAppliedSearch = {
  year: string | null;
  transfer: string;
  teaLifeFilter: PurchaseResaleListTeaLifeFilter;
  purchaseDate: string;
  /** 仕入実績一覧の選択行から開いたときの仕入先・入札NO 固定絞込 */
  contextPurchase: string | null;
  contextBidNo: string | null;
};

