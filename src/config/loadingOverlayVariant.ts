/**
 * ローディングオーバーレイのビジュアル候補。
 * `.env` に `VITE_LOADING_OVERLAY_VARIANT=igeta-logo` 等で切り替え可能。
 */
export type LoadingOverlayVariant =
  | "cup-steam"
  | "leaf-spin"
  | "teapot"
  | "leaves-orbit"
  | "igeta-logo";

const VALID: LoadingOverlayVariant[] = [
  "cup-steam",
  "leaf-spin",
  "teapot",
  "leaves-orbit",
  "igeta-logo"
];

const resolveVariant = (raw: unknown): LoadingOverlayVariant => {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (VALID.includes(v as LoadingOverlayVariant)) {
    return v as LoadingOverlayVariant;
  }
  return "cup-steam";
};

export const LOADING_OVERLAY_VARIANT: LoadingOverlayVariant = resolveVariant(
  import.meta.env.VITE_LOADING_OVERLAY_VARIANT
);
