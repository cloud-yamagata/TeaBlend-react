/// <reference types="vite/client" />

/**
 * 【処理概要】
 *   Vite が注入する `import.meta.env` の型拡張。`VITE_` プレフィックス付きキーの補完用。
 *
 * 【パラメータ仕様】
 *   各プロパティは任意（`?`）。実装側は `config/api.ts` の `resolveEnvBaseUrl` で空文字を潰す。
 *
 * 【メンテナンス】
 *   新しい `VITE_*` を追加したらここと `config/api.ts` の両方を更新すること。
 */
interface ImportMetaEnv {
  readonly VITE_API_MATERIAL_BASE_URL?: string;
  readonly VITE_API_MONTHLY_BASE_URL?: string;
  readonly VITE_API_REPORT_BASE_URL?: string;
  readonly VITE_LOADING_OVERLAY_VARIANT?: string;
  readonly VITE_LOADING_SPLASH_MESSAGE?: string;
  readonly VITE_LOADING_SPLASH_SUB_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.tsv?raw" {
  const content: string;
  export default content;
}
