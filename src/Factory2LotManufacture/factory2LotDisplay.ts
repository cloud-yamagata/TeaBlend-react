/**
 * 第二工場ロット一覧の表示ラベル（固定マッピング。tr_constant は参照しない）。
 */

/** process_type … コード:名称 */
const PROCESS_TYPE_LABELS: Record<string, string> = {
  "02": "荒茶ブ",
  "03": "仕上",
  "04": "火入",
  "05": "仕上ブ"
};

/** lot_status … 名称のみ（内部コード → 表示名） */
const LOT_STATUS_LABELS: Record<string, string> = {
  "1": "仕掛",
  "2": "完了",
  "3": "確定"
};

/** organic_class … コード:名称 */
const ORGANIC_CLASS_LABELS: Record<string, string> = {
  A: "有機",
  B: "無農薬",
  C: "一般茶"
};

const normalizeCodeKey = (code: string): string => {
  const c = code.trim();
  if (/^\d+$/.test(c)) {
    return String(Number(c));
  }
  return c.toUpperCase();
};

const lookupLabel = (map: Record<string, string>, code: string): string => {
  const c = code.trim();
  if (!c) return "";
  if (map[c]) return map[c];
  if (/^\d+$/.test(c)) {
    const padded = c.padStart(2, "0");
    if (map[padded]) return map[padded];
  }
  return map[normalizeCodeKey(c)] ?? "";
};

/** 工程区分 … コード:名称 */
export function formatFactory2ProcessType(processTypeCode: string): string {
  const code = processTypeCode.trim();
  if (!code) return "";
  const name = lookupLabel(PROCESS_TYPE_LABELS, code);
  if (name) return `${code}:${name}`;
  return code;
}

/** 工程区分名のみ（コード 02〜05 → 荒茶ブ 等） */
export function processTypeShortName(processTypeCode: string): string {
  const code = processTypeCode.trim();
  if (!code) return "";
  const name = lookupLabel(PROCESS_TYPE_LABELS, code);
  if (name) return name;
  const idx = code.indexOf(":");
  if (idx >= 0) return code.slice(idx + 1);
  return code;
}

/** 有機区分 … コード:名称 */
export function formatFactory2OrganicClass(organicCode: string): string {
  const code = organicCode.trim();
  if (!code) return "";
  const key = code.toUpperCase();
  const name = ORGANIC_CLASS_LABELS[key];
  if (name) return `${key}:${name}`;
  return code;
}

/** ロット状態 … 名称のみ */
export function formatFactory2LotStatus(statusCode: string): string {
  const code = statusCode.trim();
  if (!code) return "";
  const name = lookupLabel(LOT_STATUS_LABELS, code);
  if (name) return name;
  if (code.length > 1 && /[^\d]/.test(code)) {
    return code;
  }
  return code;
}

/** フィルタ比較用に organic_class を正規化（大文字1文字） */
export function normalizeOrganicClassCode(code: string): string {
  return code.trim().toUpperCase();
}

/** フィルタ比較用に lot_status を正規化 */
export function normalizeLotStatusCode(code: string): string {
  const c = code.trim();
  if (/^\d+$/.test(c)) return String(Number(c));
  return c;
}

/** ロット状態「確定」（tr_constant.lot_status = 3） */
export const FACTORY2_LOT_STATUS_CONFIRMED = "3";

export function isFactory2LotStatusConfirmed(lotStatusCode: string): boolean {
  return normalizeLotStatusCode(lotStatusCode) === FACTORY2_LOT_STATUS_CONFIRMED;
}

/** フィルタ比較用に process_type を正規化（02〜05） */
export function normalizeProcessTypeCode(code: string): string {
  const raw = code.trim();
  const head = raw.includes(":") ? raw.slice(0, raw.indexOf(":")).trim() : raw;
  if (/^\d+$/.test(head)) return head.padStart(2, "0");
  return head;
}

/** 茶区分が有機茶（organic_class = A） */
export function isFactory2OrganicTea(organicClassCode: string): boolean {
  return normalizeOrganicClassCode(organicClassCode) === "A";
}
