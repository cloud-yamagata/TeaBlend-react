/** 製造報告書登録モーダル（EditWindow.xaml 相当）— UI用フォーム */

export type PackageLotEditMode = "create" | "update" | "view";

export type PackageLotOrganicClassCode = "A" | "B" | "C" | "";

export type PackageLotEditTimeHm = { hh: string; mm: string };

export type PackageLotEditTimeRange = {
  start: PackageLotEditTimeHm;
  end: PackageLotEditTimeHm;
};

export type PackageLotEditBeforeAfter = {
  before: boolean;
  after: boolean;
};

export type PackageLotEditFormData = {
  /** te_package_base_new.lot_status（1:仕掛 2:完了 3:確定） */
  lotStatusCode: string;
  organicClassPrefix: string;
  productNo: string;
  /** 商品名ZOOMで選択した商品No */
  itemNo: string;
  productName: string;
  organicClass: PackageLotOrganicClassCode;
  workDate: string;
  temperature: string;
  humidity: string;
  /** 使用茶品名（上段）商品No */
  useTeaItemNo1: string;
  /** 使用茶品名（上段）商品名 */
  useTeaItemName1: string;
  /** 使用茶品名（下段）商品No */
  useTeaItemNo2: string;
  /** 使用茶品名（下段）商品名 */
  useTeaItemName2: string;
  partName: string;
  partLotNo1: string;
  outQuantity1: string;
  useQuantity1: string;
  completeQuantity: string;
  remQuantity1: string;
  partLotNo2: string;
  outQuantity2: string;
  useQuantity2: string;
  remQuantity2: string;
  partLotNo3: string;
  outQuantity3: string;
  useQuantity3: string;
  sampleQuantity: string;
  remQuantity3: string;
  failQuantity: string;
  packingStart: PackageLotEditTimeHm;
  packingEnd: PackageLotEditTimeHm;
  hp500No1Chk: boolean;
  hp500No2Chk: boolean;
  fr2Chk: boolean;
  fpgChk: boolean;
  ubaChk: boolean;
  cleaningBefore: PackageLotEditTimeRange;
  cleaningAfter: PackageLotEditTimeRange;
  liftCleaning: PackageLotEditBeforeAfter;
  liftOperation: PackageLotEditBeforeAfter;
  liftRem: PackageLotEditBeforeAfter;
  packingFilter: PackageLotEditBeforeAfter;
  packingSeal: PackageLotEditBeforeAfter;
  packingConveyor: PackageLotEditBeforeAfter;
  packingMagnet: PackageLotEditBeforeAfter;
  packingOperation: PackageLotEditBeforeAfter;
  packingRem: PackageLotEditBeforeAfter;
  toolCleaning: PackageLotEditBeforeAfter;
  uba3Cleaning: PackageLotEditBeforeAfter;
  gradeNo: string;
  categorysRemarks: string;
  weightTestBefore: string;
  weightTestAfter: string;
  residualOxygenAm: string;
  residualOxygenPm: string;
  weightNo1: string;
  weightChk1: string;
  weightNo2: string;
  weightChk2: string;
  weightNo3: string;
  weightChk3: string;
  weightNo4: string;
  weightChk4: string;
  weightNo5: string;
  weightChk5: string;
};

export const emptyTimeHm = (): PackageLotEditTimeHm => ({ hh: "", mm: "" });

export const emptyTimeRange = (): PackageLotEditTimeRange => ({
  start: emptyTimeHm(),
  end: emptyTimeHm()
});

export const emptyBeforeAfter = (): PackageLotEditBeforeAfter => ({
  before: false,
  after: false
});
