import type { Factory2LotEditMode } from "./factory2LotEditTypes";

export type ReportHelperRequest<TPayload> = {
  requestId: string;
  screenKey: string;
  mode: Factory2LotEditMode;
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

/** blend_report / finish_report / firepan_report 用（1行＝使用部品1件） */
export type Factory2BlendReportRowPayload = Record<string, string | number | boolean>;

export type Factory2ReportPreviewPayload = {
  processTypeCode: string;
  rows: Factory2BlendReportRowPayload[];
};

/** grade_report_fa2 用 */
export type Factory2GradeReportRowPayload = Record<string, string | number | boolean>;

export type Factory2GradeReportPreviewPayload = {
  processTypeCode: string;
  rows: Factory2GradeReportRowPayload[];
};
