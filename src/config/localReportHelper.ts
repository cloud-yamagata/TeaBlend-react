const DEFAULT_LOCAL_REPORT_HELPER_BASE_URL = "http://127.0.0.1:48721/api/v1";

function resolveEnvBaseUrl(raw: unknown): string {
  if (typeof raw !== "string") {
    return DEFAULT_LOCAL_REPORT_HELPER_BASE_URL;
  }
  const t = raw.trim();
  if (t === "" || t === "undefined") {
    return DEFAULT_LOCAL_REPORT_HELPER_BASE_URL;
  }
  return t.replace(/\/+$/, "");
}

export const LOCAL_REPORT_HELPER_BASE_URL: string = resolveEnvBaseUrl(
  import.meta.env.VITE_LOCAL_REPORT_HELPER_BASE_URL
);
