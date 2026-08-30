/** 仕上個別情報登録一覧行（旧 FinishCategorys MainWindow DataGrid 相当） */
export type FinishCategoryRow = {
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

/** ロット状態ラジオ（1=仕掛, 2=完了, 3=確定, all=全件） */
export type FinishCategoryLotStatusRadio = "all" | "active" | "complete" | "confirm";

export type FinishCategoryOrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 検索ボタン押下時に確定する条件（全項目を AND 結合） */
export type FinishCategoryAppliedSearchCriteria = {
  year: string | null;
  lotStatusRadio: FinishCategoryLotStatusRadio;
  workDate: string | null;
  lotNameQuery: string;
  organicCheck: FinishCategoryOrganicCheck;
};
