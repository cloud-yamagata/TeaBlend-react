/**
 * 【処理概要】
 *   React アプリのエントリ。`#root` にルートをマウントし、Jotai の Provider で全体に状態ストアを供給する。
 *
 * 【パラメータ仕様】
 *   このファイルに関数パラメータは無い。`index.html` の `<div id="root">` がマウント先。
 *
 * 【メンテナンス】
 *   - グローバル CSS を足す場合はここで `import "./index.css"` 等（未使用のテンプレ CSS は参照のみ）。
 *   - ルータは `App.tsx` 側。ここはマウントと Provider のみに留めるのが安全。
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";

// createRoot: React 18 以降のクライアントレンダリ。非同期コンカレント機能の前提。
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Jotai: 画面横断の atom をここでスコープ化（複数 Provider は通常不要） */}
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
);
