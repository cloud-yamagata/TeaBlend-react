/** パッケージロット一覧の表示ラベル */

const LOT_STATUS_LABELS: Record<string, string> = {
  "1": "仕掛",
  "2": "完了",
  "3": "確定",
  "4": "測定"
};

const ORGANIC_CLASS_LABELS: Record<string, string> = {
  A: "有機",
  B: "無農薬",
  C: "一般茶"
};

const normalizeCodeKey = (code: string): string => {
  const c = code.trim();
  if (/^\d+$/.test(c)) return String(Number(c));
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
  return map[normalizeCodeKey(c)] ?? c;
};

export function formatPackageLotStatus(lotStatusCode: string): string {
  return lookupLabel(LOT_STATUS_LABELS, lotStatusCode);
}

export function formatPackageOrganicClass(organicClassCode: string): string {
  return lookupLabel(ORGANIC_CLASS_LABELS, organicClassCode);
}

/** 茶区分が有機（organic_class = A） */
export function isPackageOrganicTea(organicClassCode: string): boolean {
  return normalizeCodeKey(organicClassCode) === "A";
}

/** ロット状態「仕掛」（lot_status = 1） */
export const PACKAGE_LOT_STATUS_ACTIVE = "1";

/** ロット状態「完了」（lot_status = 2） */
export const PACKAGE_LOT_STATUS_COMPLETE = "2";

/** ロット状態「確定」（lot_status = 3） */
export const PACKAGE_LOT_STATUS_CONFIRMED = "3";

export function isPackageLotStatusConfirmed(lotStatusCode: string): boolean {
  const c = lotStatusCode.trim();
  if (/^\d+$/.test(c)) {
    return String(Number(c)) === PACKAGE_LOT_STATUS_CONFIRMED;
  }
  return c === PACKAGE_LOT_STATUS_CONFIRMED;
}
