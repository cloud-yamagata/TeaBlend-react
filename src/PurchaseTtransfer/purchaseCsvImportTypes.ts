/** 宮崎入札 CSV 1行 → te_purchase_tea 相当（insert_purchase_csv.py 登録列） */
export type PurchaseTeaImportRow = {
  year: number;
  purchase: string;
  bidNo: string;
  purchaseDate: string;
  variety: string;
  teaLife: string;
  grade: string;
  teaType: string;
  teaRank: string;
  fieldNo: string;
  producer: string;
  cost: number | null;
  unitWeight: number;
  unitNumber: number;
  fractionWeight: number;
  fractionNumber: number;
  discount: number;
  target: string;
  targetPlan: string;
  lotNo: string;
  remarks: string;
};

export type PurchaseCsvImportDiffKind = "new" | "changed";

export type PurchaseCsvImportDiff = {
  kind: PurchaseCsvImportDiffKind;
  row: PurchaseTeaImportRow;
  changedFields?: string[];
};

export type PurchaseCsvParseMeta = {
  purchase: string;
  auctionDateText: string;
  teaYear: number;
  rowCount: number;
};

export type PurchaseCsvParseResult = {
  meta: PurchaseCsvParseMeta;
  rows: PurchaseTeaImportRow[];
};
