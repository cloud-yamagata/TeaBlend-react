/** 配合個別情報登録一覧行（旧 BlendCategorys MainWindow DataGrid 相当） */
export type BlendCategoryRow = {
  id: string;
  workDate: string | null;
  lotNo: number | null;
  processTypeCode: string;
  processTypeName: string | null;
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
export type BlendCategoryLotStatusRadio = "all" | "active" | "complete" | "confirm";

export type BlendCategoryOrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 検索ボタン押下時に確定する条件（全項目を AND 結合） */
export type BlendCategoryAppliedSearchCriteria = {
  year: string;
  lotStatusRadio: BlendCategoryLotStatusRadio;
  workDate: string | null;
  lotNameQuery: string;
  organicCheck: BlendCategoryOrganicCheck;
};
