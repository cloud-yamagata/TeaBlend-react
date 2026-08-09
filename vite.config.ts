/**
 * 【処理概要】
 *   Vite のビルド／開発サーバ設定。React プラグインと、開発時 API プロキシを定義する。
 *
 * 【パラメータ仕様】
 *   環境変数は Vite 規約（`import.meta.env`）。プロキシは dev サーバのみ有効（本番 `build` では無効）。
 *
 * 【メンテナンス／サンプル】
 *   - 開発で CORS を避ける: `.env.development` に `VITE_*_BASE_URL=/teablend-api` を設定。
 *   - バックエンドの切り替え: `.env.development` または `.env.local` の `VITE_API_PROXY_TARGET` を変更。
 * @see https://vite.dev/config/
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        /**
         * 開発時: ブラウザ → Vite と API を同一オリジンに見せて CORS 由来の Failed to fetch を避ける。
         * .env.development:
         *   VITE_API_MATERIAL_BASE_URL=/teablend-api
         *   VITE_API_MONTHLY_BASE_URL=/teablend-api
         *   VITE_API_REPORT_BASE_URL=/teablend-api
         *   VITE_API_PROXY_TARGET=http://127.0.0.1:8000  （外部 PC: http://192.168.10.149:8000）
         */
        "/teablend-api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/teablend-api/, "") || "/"
        }
      }
    }
  };
});
