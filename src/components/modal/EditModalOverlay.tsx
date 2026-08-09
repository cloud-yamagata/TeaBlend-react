import type { ReactNode } from "react";
import { resolveEditModalOverlayOnClose, type EditModalMode } from "./modalClosePolicy";

type Props = {
  mode: EditModalMode;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * 登録・変更・表示モーダル用オーバーレイ。
 * {@link modalClosePolicy} のルールに従い、オーバーレイクリック可否を mode で制御する。
 */
export function EditModalOverlay({ mode, onClose, className, children }: Props) {
  const classes = className ? `modalOverlay ${className}` : "modalOverlay";

  return (
    <div
      className={classes}
      role="presentation"
      onClick={resolveEditModalOverlayOnClose(mode, onClose)}
    >
      {children}
    </div>
  );
}
