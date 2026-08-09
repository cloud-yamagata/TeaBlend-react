import { LOCAL_REPORT_HELPER_BASE_URL } from "../config/localReportHelper";
import { buildFactory2GradeReportPreviewPayload } from "./buildFactory2GradeReportPreviewPayload";
import { buildFactory2ReportPreviewPayload } from "./buildFactory2ReportPreviewPayload";
import type { Factory2LotEditFormData, Factory2LotEditMode, Factory2LotEditPartRow } from "./factory2LotEditTypes";
import type {
  Factory2GradeReportPreviewPayload,
  Factory2ReportPreviewPayload,
  ReportHelperRequest,
  ReportHelperResponse
} from "./factory2ReportHelperTypes";
import type { MasterEntityCache } from "../domain/masterTableEntityModels";

const HELPER_START_HINT =
  "ローカル帳票ヘルパーに接続できません。`dotnet run --project tools/TeaBlendReportHelper` を起動してください。";

const createRequestId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `req-${Date.now()}`;

async function parseHelperResponse(res: Response): Promise<ReportHelperResponse> {
  const text = await res.text();
  if (!text) {
    return { ok: res.ok, message: res.ok ? undefined : "ローカル帳票ヘルパーが空の応答を返しました。" };
  }
  try {
    return JSON.parse(text) as ReportHelperResponse;
  } catch {
    return {
      ok: res.ok,
      message: res.ok ? text : `ローカル帳票ヘルパーの応答を解析できません: ${text}`
    };
  }
}

async function postReportHelper<TPayload>(
  path: string,
  body: ReportHelperRequest<TPayload>
): Promise<ReportHelperResponse> {
  const url = `${LOCAL_REPORT_HELPER_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const suffix = error instanceof Error && error.message ? ` (${error.message})` : "";
    throw new Error(`${HELPER_START_HINT}${suffix}`);
  }

  const response = await parseHelperResponse(res);
  if (!res.ok || !response.ok) {
    throw new Error(response.message || `ローカル帳票ヘルパー呼び出しに失敗しました: ${res.status}`);
  }
  return response;
}

export type Factory2ReportPreviewContext = {
  panel: HTMLElement | null;
  form: Factory2LotEditFormData;
  partRows: Factory2LotEditPartRow[];
  organicClassCode: string;
  makeYear: string;
  cache: MasterEntityCache;
};

export async function previewFactory2ReportViaHelper(
  context: Factory2ReportPreviewContext,
  mode: Factory2LotEditMode
): Promise<ReportHelperResponse> {
  const payload: Factory2ReportPreviewPayload = buildFactory2ReportPreviewPayload(
    context.panel,
    context.form,
    context.partRows,
    context.organicClassCode,
    context.makeYear,
    context.cache
  );
  return await postReportHelper("/reports/factory2_report/preview", {
    requestId: createRequestId(),
    screenKey: "Factory2LotManufacture",
    mode,
    source: "current-form",
    payload
  });
}

export async function previewFactory2GradeReportViaHelper(
  context: Factory2ReportPreviewContext,
  mode: Factory2LotEditMode
): Promise<ReportHelperResponse> {
  const payload: Factory2GradeReportPreviewPayload = buildFactory2GradeReportPreviewPayload(
    context.panel,
    context.form,
    context.partRows,
    context.organicClassCode,
    context.makeYear,
    context.cache
  );
  return await postReportHelper("/reports/factory2_grade_report/preview", {
    requestId: createRequestId(),
    screenKey: "Factory2LotManufacture",
    mode,
    source: "current-form",
    payload
  });
}
