/**
 * ローディング用ビジュアル候補（SVG / 井ヶ田ロゴ）
 */
import type { LoadingOverlayVariant } from "../config/loadingOverlayVariant";
import igetaLogoUrl from "../../画像/igeta_logo.jpg";

type Props = {
  variant: LoadingOverlayVariant;
};

export function LoadingOverlayIcon({ variant }: Props) {
  switch (variant) {
    case "leaf-spin":
      return (
        <div className="loadingTeaIcon loadingTeaIcon--leafSpin" aria-hidden="true">
          <svg viewBox="0 0 32 32" className="loadingTeaSvg">
            <path
              className="loadingTeaLeaf"
              d="M16 4C10 10 8 18 16 28C24 18 22 10 16 4Z"
              fill="currentColor"
            />
            <path d="M16 8V24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "teapot":
      return (
        <div className="loadingTeaIcon loadingTeaIcon--teapot" aria-hidden="true">
          <svg viewBox="0 0 40 32" className="loadingTeaSvg">
            <ellipse cx="18" cy="22" rx="12" ry="6" fill="currentColor" opacity="0.25" />
            <path
              d="M8 14h20a4 4 0 0 1 4 4v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-2a4 4 0 0 1 4-4z"
              fill="currentColor"
            />
            <path d="M32 16h4a3 3 0 0 1 0 6h-4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M14 8V12M18 6V12M22 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "leaves-orbit":
      return (
        <div className="loadingTeaIcon loadingTeaIcon--leavesOrbit" aria-hidden="true">
          <span className="loadingTeaOrbitLeaf loadingTeaOrbitLeaf--1" />
          <span className="loadingTeaOrbitLeaf loadingTeaOrbitLeaf--2" />
          <span className="loadingTeaOrbitLeaf loadingTeaOrbitLeaf--3" />
        </div>
      );
    case "igeta-logo":
      return (
        <div className="loadingTeaIcon loadingTeaIcon--igetaLogo" aria-hidden="true">
          <img className="loadingIgetaLogo" src={igetaLogoUrl} alt="" />
        </div>
      );
    case "cup-steam":
    default:
      return (
        <div className="loadingTeaIcon loadingTeaIcon--cupSteam" aria-hidden="true">
          <svg viewBox="0 0 40 36" className="loadingTeaSvg">
            <path
              d="M10 18h16a3 3 0 0 1 3 3v4a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5v-4a3 3 0 0 1 3-3z"
              fill="currentColor"
            />
            <path d="M29 20h3a2 2 0 0 1 0 4h-3" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path className="loadingTeaSteam loadingTeaSteam--1" d="M14 10 Q15 6 14 2" />
            <path className="loadingTeaSteam loadingTeaSteam--2" d="M18 11 Q19 7 18 3" />
            <path className="loadingTeaSteam loadingTeaSteam--3" d="M22 10 Q23 6 22 2" />
          </svg>
        </div>
      );
  }
}
