import type { ViFactory3Stoc } from "../domain/masterTableEntityModels";

const parseItemNo = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const parseProductNo = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/** 使用茶品名の商品Noで vi_factory3_stoc を絞り込み（他行で選択済みの製造Noは除外） */
export function filterFactory3StocForPackageLot(
  stocks: ViFactory3Stoc[],
  useTeaItemNo: string,
  excludeProductNos: number[]
): ViFactory3Stoc[] {
  const itemNo = parseItemNo(useTeaItemNo);
  if (itemNo == null) return [];

  const excluded = new Set(excludeProductNos);
  return stocks.filter((row) => {
    const d = row.data;
    if (d.item_no !== itemNo) return false;
    if (excluded.has(d.product_no)) return false;
    return (d.stoc_quantity ?? 0) > 0;
  });
}

export function collectOtherRowProductNos(
  partLotNos: string[],
  activeRowIndex: number
): number[] {
  const out: number[] = [];
  partLotNos.forEach((value, index) => {
    if (index === activeRowIndex) return;
    const n = parseProductNo(value);
    if (n != null) out.push(n);
  });
  return out;
}
