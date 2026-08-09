/**
 * 【処理概要】
 *   メニュー YAML をテキストエディタで編集し、localStorage 保存・既定復帰・ファイル入出力を行う。
 *
 * 【パラメータ仕様】
 *   - `initialYaml` … 親（`App`）から渡す現在のメニュー文字列
 *   - `onYamlChange` … 解析成功時のみ呼ぶ。親が `menuConfig` state を更新
 *
 * 【メンテナンス】
 *   保存はブラウザローカルのみ。サーバ配布の `public/menu.yaml` を変えたい場合はビルド成果物を更新する別フローが必要。
 */
import { useEffect, useMemo, useState } from "react";
import { clearUserMenuYaml, fetchDefaultMenuYaml, parseMenuYaml, saveUserMenuYaml } from "../menu/menuStore";

type MenuEditorPageProps = {
  initialYaml?: string | null;
  onYamlChange?: (yamlText: string) => void;
};

const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const readFileText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました。"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
};

export default function MenuEditorPage({ initialYaml, onYamlChange }: MenuEditorPageProps) {
  const [yaml, setYaml] = useState<string>(initialYaml ?? "");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (initialYaml == null) return;
    setYaml(initialYaml);
  }, [initialYaml]);

  useEffect(() => {
    if (initialYaml != null) return;
    let cancelled = false;
    const run = async () => {
      try {
        const defaultYaml = await fetchDefaultMenuYaml();
        if (!cancelled) setYaml(defaultYaml);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialYaml]);

  const parsedSummary = useMemo(() => {
    try {
      const config = parseMenuYaml(yaml);
      const groupCount = config.groups.length;
      const itemCount = config.groups.reduce((sum, g) => sum + g.items.length, 0);
      return `OK（グループ ${groupCount} / メニュー ${itemCount}）`;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [yaml]);

  const applyYaml = () => {
    setError("");
    setStatus("");
    try {
      parseMenuYaml(yaml);
      saveUserMenuYaml(yaml);
      onYamlChange?.(yaml);
      setStatus("保存しました（このブラウザに保存されます）。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const resetToDefault = async () => {
    setError("");
    setStatus("");
    try {
      clearUserMenuYaml();
      const defaultYaml = await fetchDefaultMenuYaml();
      setYaml(defaultYaml);
      onYamlChange?.(defaultYaml);
      setStatus("既定メニューに戻しました。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">メニュー編集（YAML）</h1>
      </header>

      <section className="card">
        <p className="status">
          ここで編集した内容は <strong>このPCのブラウザ</strong> に保存されます。サーバー上のファイルは直接書き換えません。
        </p>
        <p className={`status ${error ? "error" : ""}`}>
          <strong>解析結果:</strong> {parsedSummary}
        </p>
        {status && <p className="status">{status}</p>}
        {error && <p className="status error">{error}</p>}

        <div className="menuEditorActions">
          <button className="menuActionButton" type="button" onClick={applyYaml}>
            保存して反映
          </button>
          <button className="menuActionButton" type="button" onClick={() => downloadText("menu.yaml", yaml)}>
            YAMLをダウンロード
          </button>
          <label className="menuActionButton fileButton">
            YAMLを読み込み
            <input
              type="file"
              accept=".yml,.yaml,text/yaml,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await readFileText(file);
                  setYaml(text);
                  setStatus(`読み込みました: ${file.name}`);
                  setError("");
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                }
              }}
            />
          </label>
          <button className="menuActionButton menuActionButtonDanger" type="button" onClick={() => void resetToDefault()}>
            既定に戻す
          </button>
        </div>

        <textarea
          className="menuEditorTextarea"
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          spellCheck={false}
        />
      </section>
    </main>
  );
}

