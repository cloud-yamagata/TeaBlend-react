import type { Factory2ProcessFilter } from "./types";

/** 使用部品一覧行（登録モーダル） */
export type Factory2LotEditPartRow = {
  id: string;
  /** 月次計画 lot_no（親ロット。在庫追加のみの行は空） */
  parentLotNo: string;
  processName: string;
  /** 月次計画 part_lot_no（部品ロット） */
  partLotNo: string;
  /** 登録API用の子ロットNo（在庫照合結果） */
  lotNo: string;
  partNo: string;
  productNo: string;
  partName: string;
  makeYear: string;
  count: string;
  useQuantity: string;
  remarks: string;
};

export type Factory2LotEditChecks = {
  useDeviceUnit1: boolean;
  useDeviceUnit2: boolean;
  useDeviceUnit3: boolean;
  packingCase1: boolean;
  packingCase2: boolean;
  workBeforeCleaning: boolean;
  workAfterCleaning: boolean;
  device: boolean;
  operation: boolean;
  rest: boolean;
  magnetCleaning: boolean;
};

export type Factory2LotEditTimeRange = {
  startHh: string;
  startMm: string;
  endHh: string;
  endMm: string;
};

/** 登録時に計画No入力があった場合のみモーダルに表示 */
export type Factory2LotEditPlanContext = {
  planNo: number;
  year: number | null;
  month: number | null;
};

/** モーダル表示用スナップショット（項目転送・初期表示） */
export type Factory2LotEditFormData = {
  lotNo: number | null;
  /** ロット状態コード（tr_constant.lot_status） */
  lotStatusCode: string;
  /** te_grade.grade_no（lot_no 一致。無い場合は null） */
  gradeNo: number | null;
  organicClassCode: string;
  processTypeCode: Factory2ProcessFilter | string;
  productNo: number | null;
  makeYear: string;
  itemName: string;
  count: string;
  workDate: string;
  lotName: string;
  unitWeight: string;
  unitNumber: string;
  fractionWeight: string;
  fractionNumber: string;
  productQuantity: string;
  inputQuantity: string;
  summaryRemarks: string;
  temperature: string;
  humidity: string;
  workStart: { hh: string; mm: string };
  workEnd: { hh: string; mm: string };
  cleaningBefore: Factory2LotEditTimeRange;
  cleaningAfter: Factory2LotEditTimeRange;
  checks: Factory2LotEditChecks;
  partRows: Factory2LotEditPartRow[];
  /** 1段目で計画Noを入力して開いた場合 */
  planContext?: Factory2LotEditPlanContext;
  /** 計画連携時の警告（工程不一致・商品不一致・在庫未照合など） */
  planWarnings?: string[];
};

export type Factory2LotEditMode = "create" | "update" | "view";
