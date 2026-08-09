import type { PackageLotEditBeforeAfter, PackageLotEditMode } from "./packageLotEditTypes";

export type ReportHelperRequest<TPayload> = {
  requestId: string;
  screenKey: string;
  mode: PackageLotEditMode;
  source: "current-form";
  payload: TPayload;
};

export type ReportHelperResponse = {
  ok: boolean;
  requestId?: string;
  message?: string;
  errorCode?: string;
  payloadFile?: string;
};

export type PackageReportLotRowPayload = {
  rowNo: 1 | 2 | 3;
  partLotNo: string;
  outQuantity: string;
  useQuantity: string;
  remQuantity: string;
};

export type PackageReportWeightPayload = {
  no: string;
  value: string;
};

export type PackageReportPreviewPayload = {
  productNo: string;
  organicClass: string;
  itemNo: string;
  productName: string;
  workDate: string;
  completeQuantity: string;
  sampleQuantity: string;
  failQuantity: string;
  gradeNo: string;
  temperature: string;
  humidity: string;
  useTea: {
    itemNo: string;
    itemName: string;
  };
  lotRows: PackageReportLotRowPayload[];
  packingTime: {
    start: string;
    end: string;
  };
  cleaningTime: {
    before: {
      start: string;
      end: string;
    };
    after: {
      start: string;
      end: string;
    };
  };
  machineChecks: {
    hp500No1Chk: boolean;
    hp500No2Chk: boolean;
    fr2Chk: boolean;
    fpgChk: boolean;
    ubaChk: boolean;
  };
  beforeAfterChecks: {
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
  };
  weightTest: {
    before: string;
    after: string;
  };
  residualOxygen: {
    am: string;
    pm: string;
  };
  weights: PackageReportWeightPayload[];
  remarks: string;
};
