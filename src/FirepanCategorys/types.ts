/** 火入個別情報登録一覧行（旧 FirepanCategorys MainWindow DataGrid 相当） */
export type FirepanCategoryRow = {
  id: string;
  workDate: string | null;
  lotNo: number | null;
  productNo: number | null;
  lotStatusCode: string;
  lotStatusName: string | null;
  lotName: string | null;
  makeYear: number | null;
  itemName: string | null;
  itemNo: number | null;
  count: number | null;
  organicClassCode: string;
  organicClass: string | null;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
};

export type FirepanCategoryLotStatusRadio = "all" | "active" | "complete" | "confirm";

export type FirepanCategoryOrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

export type FirepanCategoryAppliedSearchCriteria = {
  year: string | null;
  lotStatusRadio: FirepanCategoryLotStatusRadio;
  workDate: string | null;
  lotNameQuery: string;
  organicCheck: FirepanCategoryOrganicCheck;
};
