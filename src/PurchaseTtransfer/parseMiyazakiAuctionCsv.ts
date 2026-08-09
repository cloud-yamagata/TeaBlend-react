/**
 * 宮崎入札 CSV（KZNK580 商社別買取一覧表）→ te_purchase_tea 行へ変換
 */
import { parseCsvText } from "./parseCsvText";
import type { PurchaseCsvParseResult, PurchaseTeaImportRow } from "./purchaseCsvImportTypes";

const round2 = (n: number): number => Math.round(n * 100) / 100;

const parseQuantityPack = (text: string): { weight: number; count: number } | null => {
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/^([\d.]+)\s*-\s*(\d+)/);
  if (!m) return null;
  const weight = Number(m[1]);
  const count = Number(m[2]);
  if (!Number.isFinite(weight) || !Number.isFinite(count)) return null;
  return { weight, count };
};

/** 元号年（1桁〜2桁）を西暦に（Reiwa / Heisei の近い方） */
const eraYearToWestern = (eraYear: number, referenceWesternYear = new Date().getFullYear()): number => {
  const candidates = [2018 + eraYear, 1988 + eraYear];
  return candidates.reduce((best, year) =>
    Math.abs(year - referenceWesternYear) < Math.abs(best - referenceWesternYear) ? year : best
  );
};

/** 入札会日「1.10.18」または「1年10月18日」 */
export const parseAuctionDate = (
  text: string
): { isoDate: string; teaYear: number; westernYear: number } | null => {
  const dot = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{1,2})/);
  if (dot) {
    const eraYear = Number(dot[1]);
    const month = Number(dot[2]);
    const day = Number(dot[3]);
    const westernYear = eraYearToWestern(eraYear);
    const isoDate = `${westernYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { isoDate, teaYear: westernYear % 100, westernYear };
  }
  const jp = text.match(/(\d{1,2})年(\d{1,2})月(\d{1,2})日/);
  if (jp) {
    const eraYear = Number(jp[1]);
    const month = Number(jp[2]);
    const day = Number(jp[3]);
    const westernYear = eraYearToWestern(eraYear);
    const isoDate = `${westernYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { isoDate, teaYear: westernYear % 100, westernYear };
  }
  return null;
};

const parsePurchaseName = (line: string): string => {
  const m = line.match(/商社\s+\d+\s+(.+?)(?:,|$)/);
  return m?.[1]?.trim() ?? "";
};

const parseAuctionDateFromMetaLine = (line: string): string => {
  const m = line.match(/入札会日[^0-9]*(\d{1,2}\.\d{1,2}\.\d{1,2})/);
  return m?.[1] ?? "";
};

const toNumberOrNull = (text: string): number | null => {
  const t = text.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const isDataRow = (cells: string[]): boolean => {
  const bid = cells[0]?.trim() ?? "";
  return /^\d+$/.test(bid);
};

const buildImportRow = (
  cells: string[],
  purchaseDate: string,
  teaYear: number
): PurchaseTeaImportRow | null => {
  if (!isDataRow(cells)) return null;

  const packs = [cells[3], cells[4], cells[5]]
    .map(parseQuantityPack)
    .filter((p): p is { weight: number; count: number } => p != null);

  const primary = packs[0] ?? { weight: 0, count: 0 };
  const secondary = packs[1] ?? { weight: 0, count: 0 };

  const discountRaw = toNumberOrNull(cells[9] ?? "");
  const costRaw = toNumberOrNull(cells[7] ?? "");

  return {
    year: teaYear,
    purchase: (cells[1] ?? "").trim(),
    bidNo: cells[0].trim(),
    purchaseDate,
    variety: (cells[14] ?? "").trim(),
    teaLife: (cells[11] ?? "").trim(),
    grade: "",
    teaType: (cells[12] ?? "").trim(),
    teaRank: (cells[13] ?? "").trim(),
    fieldNo: "",
    producer: (cells[15] ?? "").trim(),
    cost: costRaw == null ? null : Math.round(costRaw),
    unitWeight: round2(primary.weight),
    unitNumber: primary.count,
    fractionWeight: round2(secondary.weight),
    fractionNumber: secondary.count,
    discount: round2(discountRaw ?? 0),
    target: "",
    targetPlan: "",
    lotNo: "",
    remarks: (cells[2] ?? "").trim()
  };
};

/** CSV テキストをパース（Shift_JIS / UTF-8 いずれも可） */
export function parseMiyazakiAuctionCsv(text: string): PurchaseCsvParseResult {
  const matrix = parseCsvText(text);
  let traderName = "";
  let auctionDateText = "";
  let purchaseDate = "";
  let teaYear = 0;
  const rows: PurchaseTeaImportRow[] = [];

  for (const cells of matrix) {
    const joined = cells.join(",");
    if (joined.includes("商社") && joined.includes("入札会日")) {
      traderName = parsePurchaseName(joined);
      auctionDateText = parseAuctionDateFromMetaLine(joined);
      const parsedDate = parseAuctionDate(auctionDateText);
      if (parsedDate) {
        purchaseDate = parsedDate.isoDate;
        teaYear = parsedDate.teaYear;
      }
      continue;
    }
    if (cells[0]?.includes("入札")) continue;
    if (!purchaseDate || teaYear === 0) continue;

    const row = buildImportRow(cells, purchaseDate, teaYear);
    if (row) rows.push(row);
  }

  if (!purchaseDate || teaYear === 0) {
    throw new Error("宮崎入札 CSV の形式を認識できません（入札会日が見つかりません）。");
  }

  return {
    meta: { purchase: traderName, auctionDateText, teaYear, rowCount: rows.length },
    rows
  };
};

/** File を Shift_JIS 優先でテキスト読込 */
export async function readCsvFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("shift-jis").decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}
