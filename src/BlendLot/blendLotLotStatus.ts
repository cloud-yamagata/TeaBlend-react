/**
 * ブレンドロット … ロット状態（lot_status）判定
 */
import {
  PACKAGE_LOT_STATUS_ACTIVE,
  PACKAGE_LOT_STATUS_COMPLETE,
  PACKAGE_LOT_STATUS_CONFIRMED
} from "../PackageReport/packageLotDisplay";

/** 使用部品情報が1件以上あるか */
export function hasBlendLotPartItems(partCount: number): boolean {
  return partCount > 0;
}

/**
 * 登録・変更保存時の lot_status
 * ① 仕掛 … 使用部品なし
 * ② 完了 … 使用部品あり
 * ③ 確定 … 既に確定（在庫確定済み）の場合は維持
 */
export function resolveBlendLotStatusOnSave(
  partCount: number,
  existingLotStatus?: string | null
): string {
  const existing = (existingLotStatus ?? "").trim();
  if (existing === PACKAGE_LOT_STATUS_CONFIRMED) {
    return PACKAGE_LOT_STATUS_CONFIRMED;
  }
  if (hasBlendLotPartItems(partCount)) {
    return PACKAGE_LOT_STATUS_COMPLETE;
  }
  return PACKAGE_LOT_STATUS_ACTIVE;
}

/** 在庫確定ボタン活性化（保存済みロット状態が完了） */
export function canConfirmBlendLotStock(lotStatusCode: string): boolean {
  return lotStatusCode.trim() === PACKAGE_LOT_STATUS_COMPLETE;
}
