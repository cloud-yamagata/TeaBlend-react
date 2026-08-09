/**
 * 転売先の提供単価（お届け価格）… StoreRepository.GetUnitPrice 相当
 */
import type { TrResale } from "../domain/masterTableEntityModels";

/** 正の数値を指定桁で四捨五入（MidpointRounding.AwayFromZero 相当） */
function roundAwayFromZero(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function findTrResaleByTransfer(transfer: string, resales: readonly TrResale[]): TrResale | null {
  const trimmed = transfer.trim();
  if (!trimmed) return null;
  return resales.find((row) => row.data.resale === trimmed) ?? null;
}

/**
 * 振分先・仕入単価・粉引率からお届け価格を算出する。
 * @param transfer 振分先（tr_resale.resale と一致）
 * @param cost 仕入単価（Store.cost）
 * @param discount 粉引率（%）
 */
export function getPurchaseTransferUnitPrice(
  transfer: string,
  cost: number,
  discount: number,
  resales: readonly TrResale[]
): number {
  const target = findTrResaleByTransfer(transfer, resales);
  if (!target) return cost;

  const { calc_type, rate, postage, limit_price, fixed_price } = target.data;

  switch (calc_type) {
    case 0: {
      // 数量粉引
      if (cost > limit_price) {
        return roundAwayFromZero(cost * (rate / 100), 0) + postage;
      }
      return fixed_price + postage;
    }
    case 1:
      // 単価粉引
      return roundAwayFromZero(cost * (1 - discount / 100), 0) + postage + fixed_price;
    case 2:
      // 直販
      return 0;
    case 3:
      // 堀口園_棒
      return roundAwayFromZero(cost * (rate / 100) * (1 - discount / 100), 1) + postage;
    default:
      return cost;
  }
}
