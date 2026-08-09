import { LOCAL_REPORT_HELPER_BASE_URL } from "../config/localReportHelper";
import { buildPackageReportPreviewPayload } from "./buildPackageReportPreviewPayload";
import type { PackageLotEditFormData, PackageLotEditMode } from "./packageLotEditTypes";
import type { PackageReportPreviewPayload, ReportHelperRequest, ReportHelperResponse } from "./reportHelperTypes";

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

export async function previewPackageReportViaHelper(
  form: PackageLotEditFormData,
  mode: PackageLotEditMode
): Promise<ReportHelperResponse> {
  const payload: PackageReportPreviewPayload = buildPackageReportPreviewPayload(form);
  return await postReportHelper("/reports/package_report/preview", {
    requestId: createRequestId(),
    screenKey: "PackageReport",
    mode,
    source: "current-form",
    payload
  });
}

export async function previewPackageGradeReportViaHelper(
  form: PackageLotEditFormData,
  mode: PackageLotEditMode
): Promise<ReportHelperResponse> {
  const payload: PackageReportPreviewPayload = buildPackageReportPreviewPayload(form);
  return await postReportHelper("/reports/package_grade_report/preview", {
    requestId: createRequestId(),
    screenKey: "PackageReport",
    mode,
    source: "current-form",
    payload
  });
}
