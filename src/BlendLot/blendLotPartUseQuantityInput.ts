/**
 * ブレンドロット部品 … 使用数量入力（在庫数量上限）
 * 第2工場製造ロット登録（Factory2LotEditModal）の投入数チェックに準拠。
 */
import { toNumberText } from "./blendLotDisplayUtils";

const USE_QTY_INPUT_PATTERN = /^\d*\.?\d{0,2}$/;

export function isValidBlendLotPartUseQuantityTyping(text: string): boolean {
  return text === "" || USE_QTY_INPUT_PATTERN.test(text);
}

export function parseBlendLotPartUseQuantityInput(text: string): number | null {
  const t = text.trim().replace(/,/g, "");
  if (!t || t === ".") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 使用数量の上限 = ZOOM 選択時の在庫数量 */
export function maxBlendLotPartUseQuantityFromStoc(stocQuantityText: string): number | null {
  const stoc = parseBlendLotPartUseQuantityInput(stocQuantityText);
  if (stoc == null || stoc <= 0) return null;
  return stoc;
}

export function normalizeBlendLotPartUseQuantityInput(text: string, maxStoc: number | null): string {
  let qty = parseBlendLotPartUseQuantityInput(text);
  if (qty == null) return "";
  qty = Math.max(0, qty);
  if (maxStoc != null && maxStoc > 0) {
    qty = Math.min(qty, maxStoc);
  }
  return String(Math.round(qty * 100) / 100);
}

export function validateBlendLotPartUseQuantityAgainstStoc(
  useQuantityText: string,
  stocQuantityText: string
): string | null {
  const useQty = parseBlendLotPartUseQuantityInput(useQuantityText);
  if (useQty == null) return null;

  const maxStoc = maxBlendLotPartUseQuantityFromStoc(stocQuantityText);
  if (maxStoc == null) return null;

  const maxLabel = toNumberText(maxStoc);
  if (useQty > maxStoc) {
    return `使用数量は在庫数量（${maxLabel}）以下で入力してください。`;
  }
  if (useQty <= 0) {
    return "使用数量は0より大きい値を入力してください。";
  }
  return null;
}
