/**
 * リポジトリ同梱の tsv/tr_constant.tsv を TrConstant 配列へ変換。
 */
import type { TrConstant } from "../MaterialList/types";

const parseTsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === `"`) {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === "\t") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
};

/** TSV 本文（ヘッダ行あり）をパース */
export function parseTrConstantTsv(raw: string): TrConstant[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const header = parseTsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxField = header.indexOf("const_field");
  const idxConst = header.findIndex((h) => h === "const" || h === "const_value");
  const idxName = header.indexOf("const_name");
  const idxOrder = header.indexOf("display_order");
  const idxDisplay = header.indexOf("display");

  if (idxField < 0 || idxConst < 0 || idxName < 0) return [];

  const rows: TrConstant[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseTsvLine(lines[i]);
    const constField = (cols[idxField] ?? "").trim();
    const constValue = (cols[idxConst] ?? "").trim();
    const constName = (cols[idxName] ?? "").trim();
    if (!constField || !constValue) continue;

    const orderRaw = idxOrder >= 0 ? cols[idxOrder]?.trim() : "";
    const displayOrder =
      orderRaw !== "" && Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : null;
    const displayRaw = idxDisplay >= 0 ? cols[idxDisplay]?.trim().toLowerCase() : "";
    const display =
      displayRaw === "true" || displayRaw === "1"
        ? true
        : displayRaw === "false" || displayRaw === "0"
          ? false
          : null;

    rows.push({ constField, constValue, constName, displayOrder, display });
  }
  return rows;
}
