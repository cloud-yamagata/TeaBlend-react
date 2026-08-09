/**
 * 【処理概要】
 *   `busyCountAtom` が正の間、半透明オーバーレイとメッセージを表示するプレゼンテーションコンポーネント。
 *
 * 【パラメータ仕様】
 *   プロパティ無し。`busyMessageAtom` / `isBusyAtom` を Jotai から購読。
 *
 * 【メンテナンス】
 *   長時間処理は `useBusyTask()` でラップし、メッセージ文字列を第2引数に渡す。
 */
import { useAtomValue } from "jotai";
import type { CSSProperties } from "react";
import { LOADING_OVERLAY_SPLASH_IMAGE_URL } from "../config/loadingOverlaySplash";
import {
  LOADING_SPLASH_MESSAGE,
  LOADING_SPLASH_SUB_MESSAGE
} from "../config/loadingOverlaySplashMessage";
import { LOADING_OVERLAY_VARIANT } from "../config/loadingOverlayVariant";
import { busyMessageAtom, busySplashAtom, isBusyAtom } from "../ui/busy";
import { LoadingOverlayIcon } from "./LoadingOverlayIcon";
import "./loadingOverlay.css";

export default function LoadingOverlay() {
  const busy = useAtomValue(isBusyAtom);
  const splash = useAtomValue(busySplashAtom);
  const message = useAtomValue(busyMessageAtom);
  if (!busy) return null;

  const displayMessage = splash ? LOADING_SPLASH_MESSAGE : message || "処理中...";
  const displaySubMessage = splash
    ? LOADING_SPLASH_SUB_MESSAGE || (message !== LOADING_SPLASH_MESSAGE ? message : "")
    : "";

  const overlayStyle: CSSProperties | undefined = splash
    ? ({
        ["--loading-splash-image" as string]: `url("${LOADING_OVERLAY_SPLASH_IMAGE_URL}")`
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`loadingOverlay${splash ? " loadingOverlay--splash" : ""}`}
      style={overlayStyle}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="loadingOverlayPanel">
        <LoadingOverlayIcon variant={LOADING_OVERLAY_VARIANT} />
        <div className="loadingOverlayTextBlock">
          <div className="loadingOverlayText">{displayMessage}</div>
          {displaySubMessage ? (
            <div className="loadingOverlaySubText">{displaySubMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

