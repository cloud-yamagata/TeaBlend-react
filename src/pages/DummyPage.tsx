/**
 * 【処理概要】
 *   メニューに登録されたがレポート定義の無い `screenKey` 向けのプレースホルダ画面。
 *
 * 【パラメータ仕様】
 *   - `label` … メニュー項目名が渡ればタイトルに利用
 *   - ルート param `screenKey` は `react-router` の `useParams()` から取得
 */

import { useMemo } from "react";
import { useParams } from "react-router-dom";

type DummyPageProps = {
  label?: string;
};

export default function DummyPage({ label }: DummyPageProps) {
  const params = useParams();
  const screenKey = params.screenKey ?? "";
  const title = useMemo(() => label ?? (screenKey ? `未実装: ${screenKey}` : "未実装画面"), [label, screenKey]);

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">{title}</h1>
      </header>
      <section className="card">
        <p className="status">
          この画面は現在ダミーです。メニュー定義（YAML）上の <strong>screenKey</strong> は <code>{screenKey}</code> です。
        </p>
      </section>
    </main>
  );
}

