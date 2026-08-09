/** パッケージロット登録一覧行（製造報告書一覧） */
export type PackageLotRegistRow = {
  id: string;
  workDate: string | null;
  lotStatus: string;
  /** te_package_base_new.lot_status（フィルタ用） */
  lotStatusCode: string;
  productNo: number | null;
  itemNo: number | null;
  organicClassCode: string;
  organicName: string;
  productName: string;
  completeQuantity: number | null;
  gradeNo: number | null;
  partName: string;
  useQuantity: number | null;
};

/** ロット状態チェック（1=仕掛, 4=測定, 2=完了, 3=確定） */
export type PackageLotStatusCheck = {
  active: boolean;
  measure: boolean;
  complete: boolean;
  confirm: boolean;
};

export type PackageLotOrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 検索ボタン押下時に確定する条件 */
export type PackageLotAppliedSearchCriteria = {
  lotStatusCheck: PackageLotStatusCheck;
  organicCheck: PackageLotOrganicCheck;
  workDate: string | null;
  /** 商品名ZOOMで選択した商品NO（未選択は null） */
  itemNo: number | null;
  productNameQuery: string;
};
