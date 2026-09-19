/**
 * ロット分割一覧の表示ラベル（検索の有機チェックBOXグループと同一）
 */

export const LOT_DIVIDE_ORGANIC_OPTIONS = [
  { code: "A", label: "有機" },
  { code: "B", label: "無農薬" },
  { code: "C", label: "一般" }
] as const;

const ORGANIC_LABELS: Record<string, string> = Object.fromEntries(
  LOT_DIVIDE_ORGANIC_OPTIONS.map((o) => [o.code, o.label])
);

/** 有機区分コード → チェックBOXグループ名称 */
export function formatLotDivideOrganicClass(organicCode: string): string {
  const code = organicCode.trim().toUpperCase();
  if (!code) return "";
  return ORGANIC_LABELS[code] ?? organicCode.trim();
}
