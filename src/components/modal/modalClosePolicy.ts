/**
 * 編集モーダルの閉じ方（共通ルール）
 *
 * - create / update … 入力中の誤操作防止のため、オーバーレイクリックでは閉じない（閉じるボタンのみ）
 * - view … 参照のみのため、オーバーレイクリックでも閉じられる
 */
export type EditModalMode = "create" | "update" | "view";

/** オーバーレイクリックで閉じてよいモードか */
export function shouldCloseEditModalOnOverlayClick(mode: EditModalMode): boolean {
  return mode === "view";
}

/** オーバーレイ onClick に渡すハンドラ（create/update では undefined） */
export function resolveEditModalOverlayOnClose(
  mode: EditModalMode,
  onClose: () => void
): (() => void) | undefined {
  return shouldCloseEditModalOnOverlayClick(mode) ? onClose : undefined;
}
