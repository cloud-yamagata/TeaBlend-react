/**
 * ロット分割（LotDivide）一覧行・検索条件
 */
export type LotDivideProcessFilter = {
  "02": boolean;
  "03": boolean;
  "04": boolean;
  "05": boolean;
};

export type LotDivideOrganicFilter = {
  A: boolean;
  B: boolean;
  C: boolean;
};

export type LotDivideRow = {
  id: string;
  lotNo: number;
  processType: string;
  processTypeName: string;
  productNo: number;
  productDate: string | null;
  lotName: string;
  makeYear: string;
  itemNo: number;
  itemName: string;
  count: string;
  organicClass: string;
  productQuantity: number;
  factory2Stock: number;
  divideQuantity: number;
};

export type LotDivideAppliedSearchCriteria = {
  processTypes: string[] | null;
  organicClasses: string[] | null;
  productDate: string | null;
  nameQuery: string;
};

export type LotDivideEditForm = {
  lotNo: number;
  processType: string;
  processTypeName: string;
  productNo: number;
  productDate: string;
  lotName: string;
  makeYear: string;
  itemNo: number;
  itemName: string;
  count: string;
  organicClass: string;
  productQuantity: string;
  factory2Stock: string;
  divideDate: string;
  divideQuantity: string;
  divideLotName: string;
  reason: string;
  remarks: string;
};

export function lotDivideRowToEditForm(row: LotDivideRow): LotDivideEditForm {
  const fmt = (n: number) => (Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : "");
  return {
    lotNo: row.lotNo,
    processType: row.processType,
    processTypeName: row.processTypeName,
    productNo: row.productNo,
    productDate: row.productDate ?? "",
    lotName: row.lotName,
    makeYear: row.makeYear,
    itemNo: row.itemNo,
    itemName: row.itemName,
    count: row.count,
    organicClass: row.organicClass,
    productQuantity: fmt(row.productQuantity),
    factory2Stock: fmt(row.factory2Stock),
    divideDate: "",
    divideQuantity: "",
    divideLotName: row.lotName,
    reason: "",
    remarks: ""
  };
}
