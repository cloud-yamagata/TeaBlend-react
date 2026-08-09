/** 配合個別情報登録モーダル（EditWindow.xaml 相当） */
export type BlendCategoryEditFormData = {
  lotNo: number;
  organicClassCode: string;
  productNo: number | null;
  makeYear: string | null;
  itemName: string | null;
  count: string | null;
  workDate: string | null;
  lotName: string | null;
  processTypeCode: string;
  organicClass: string | null;
  unitWeight: number | null;
  unitNumber: number | null;
  /** te_lot_base.fraction_weight（端数重量・生産量計算用） */
  fractionWeightRaw: number | null;
  productQuantity: number;
  /** 適用（te_lot_categorys_blend.remarks 優先、なければ te_lot_base.remarks） */
  applicationRemarks: string | null;
  sensualTestColor: string;
  sensualTestTaste: string;
  sensualTestAroma: string;
  /** DB保存用（配合個別 remarks） */
  blendRemarks: string;
  temperature: string;
  humidity: string;
  workStartHh: string;
  workStartMm: string;
  workEndHh: string;
  workEndMm: string;
  workBeforeCleaningStartHh: string;
  workBeforeCleaningStartMm: string;
  workBeforeCleaningEndHh: string;
  workBeforeCleaningEndMm: string;
  workEndCleaningStartHh: string;
  workEndCleaningStartMm: string;
  workEndCleaningEndHh: string;
  workEndCleaningEndMm: string;
  useDeviceUnit1: boolean;
  useDeviceUnit2: boolean;
  useDeviceUnit3: boolean;
  packingCase1: boolean;
  packingCase2: boolean;
  workBeforeCleaningChk: boolean;
  workAfterCleaningChk: boolean;
  deviceChk: boolean;
  operationChk: boolean;
  restChk: boolean;
  magnetCleaningChk: boolean;
};

export type BlendCategoryUpsertPayload = {
  lot_no: number;
  sensual_test_color: string | null;
  sensual_test_taste: string | null;
  sensual_test_aroma: string | null;
  remarks: string | null;
};
