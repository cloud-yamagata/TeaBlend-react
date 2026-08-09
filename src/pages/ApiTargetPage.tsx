/**
 * 【処理概要】
 *   FastAPI 接続先の候補選択と、候補一覧 YAML の編集（メニュー編集と同型）。
 */
import { useEffect, useMemo, useState } from "react";
import { useSetAtom } from "jotai";
import { bootstrapMasterDataAtom } from "../repository/masterData";
import {
  applyApiTargetsYaml,
  clearApiTargetSelection,
  clearUserApiTargetsYaml,
  fetchDefaultApiTargetsYaml,
  getEffectiveApiTarget,
  getSelectedApiTargetId,
  parseApiTargetsYaml,
  saveUserApiTargetsYaml,
  selectApiTargetId
} from "../config/apiTargetsStore";
import { getMaterialApiBaseUrl } from "../config/api";
import type { ApiTargetsConfig } from "../config/apiTargetsTypes";

type ApiTargetPageProps = {
  initialYaml?: string | null;
  onYamlChange?: (yamlText: string) => void;
  onTargetChange?: () => void;
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

export default function ApiTargetPage({ initialYaml, onYamlChange, onTargetChange }: ApiTargetPageProps) {
  const runBootstrap = useSetAtom(bootstrapMasterDataAtom);
  const [yaml, setYaml] = useState<string>(initialYaml ?? "");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [currentLabel, setCurrentLabel] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");

  const refreshCurrent = () => {
    const effective = getEffectiveApiTarget();
    const stored = getSelectedApiTargetId();
    setSelectedId(stored ?? (import.meta.env.PROD && effective ? effective.id : ""));
    setCurrentLabel(effective?.label ?? (import.meta.env.DEV ? "環境変数（開発プロキシ等）" : "未設定"));
    setCurrentUrl(getMaterialApiBaseUrl());
  };

  useEffect(() => {
    if (initialYaml == null) return;
    setYaml(initialYaml);
  }, [initialYaml]);

  useEffect(() => {
    if (initialYaml != null) {
      refreshCurrent();
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const defaultYaml = await fetchDefaultApiTargetsYaml();
        if (!cancelled) {
          setYaml(defaultYaml);
          refreshCurrent();
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialYaml]);

  const parsed = useMemo((): { ok: true; config: ApiTargetsConfig } | { ok: false; message: string } => {
    try {
      return { ok: true, config: parseApiTargetsYaml(yaml) };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }, [yaml]);

  const applyYaml = () => {
    setError("");
    setStatus("");
    try {
      parseApiTargetsYaml(yaml);
      saveUserApiTargetsYaml(yaml);
      applyApiTargetsYaml(yaml);
      onYamlChange?.(yaml);
      refreshCurrent();
      setStatus("候補YAMLを保存しました（このブラウザに保存されます）。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const resetToDefault = async () => {
    setError("");
    setStatus("");
    try {
      clearUserApiTargetsYaml();
      const defaultYaml = await fetchDefaultApiTargetsYaml();
      setYaml(defaultYaml);
      applyApiTargetsYaml(defaultYaml);
      onYamlChange?.(defaultYaml);
      refreshCurrent();
      setStatus("既定の接続先候補に戻しました。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const applySelection = async () => {
    setError("");
    setStatus("");
    try {
      if (!selectedId) {
        clearApiTargetSelection();
        refreshCurrent();
        onTargetChange?.();
        await runBootstrap();
        setStatus("選択を解除しました（開発時は環境変数／本番は本社既定）。マスタを再取得しました。");
        return;
      }
      const target = selectApiTargetId(selectedId);
      refreshCurrent();
      onTargetChange?.();
      await runBootstrap();
      setStatus(`接続先を「${target.label}」に変更し、マスタを再取得しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">API接続先設定</h1>
      </header>

      <section className="card">
        <p className="status">
          現在の接続先: <strong>{currentLabel}</strong>
          <br />
          URL: <code>{currentUrl}</code>
        </p>

        <div className="menuEditorActions" style={{ marginBottom: "1rem" }}>
          <label>
            接続先を選択{" "}
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!parsed.ok}
            >
              <option value="">{import.meta.env.PROD ? "（既定: 本社）" : "（環境変数／開発プロキシ）"}</option>
              {parsed.ok &&
                parsed.config.targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {t.baseUrl}
                  </option>
                ))}
            </select>
          </label>
          <button className="menuActionButton" type="button" onClick={() => void applySelection()}>
            接続先を変更
          </button>
        </div>

        <p className="status">
          候補一覧は YAML で編集できます。ここで編集した内容は <strong>このPCのブラウザ</strong> に保存されます。
          ビルド済みで未選択のときの既定は YAML の <code>defaultId</code>（本社）です。
        </p>
        <p className={`status ${!parsed.ok ? "error" : ""}`}>
          <strong>解析結果:</strong>{" "}
          {parsed.ok
            ? `OK（候補 ${parsed.config.targets.length} / 既定 ${parsed.config.defaultId}）`
            : parsed.message}
        </p>
        {status && <p className="status">{status}</p>}
        {error && <p className="status error">{error}</p>}

        <div className="menuEditorActions">
          <button className="menuActionButton" type="button" onClick={applyYaml}>
            YAMLを保存して反映
          </button>
          <button className="menuActionButton" type="button" onClick={() => downloadText("api-targets.yaml", yaml)}>
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
            既定YAMLに戻す
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
