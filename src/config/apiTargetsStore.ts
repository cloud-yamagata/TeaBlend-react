/**
 * 【処理概要】
 *   FastAPI 接続先候補 YAML の取得・検証・localStorage 永続化、および実行時の選択状態。
 *   メニュー（menu.yaml）と同様に public 配布＋ブラウザ上書き。
 *
 * 【解決順（baseUrl）】
 *   1. localStorage の選択 id（候補に存在する場合）
 *   2. 本番ビルド: YAML の defaultId（本社）
 *   3. それ以外: 環境変数 VITE_API_*（開発プロキシ /teablend-api 等）
 */
import { parseSimpleYaml } from "../menu/simpleYaml";
import type { ApiTarget, ApiTargetsConfig } from "./apiTargetsTypes";

const YAML_STORAGE_KEY = "teablend.apiTargetsYaml.v1";
const SELECTED_ID_STORAGE_KEY = "teablend.apiTargetId.v1";

export const API_TARGET_CHANGED_EVENT = "teablend:api-target-changed";

const isRecord = (v: unknown): v is Record<string, unknown> => {
  return typeof v === "object" && v !== null && !Array.isArray(v);
};

const asString = (v: unknown): string | null => (typeof v === "string" ? v : v == null ? null : String(v));

const normalizeBaseUrl = (raw: string): string => raw.trim().replace(/\/+$/, "");

const toTarget = (raw: unknown): ApiTarget | null => {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id)?.trim();
  const label = asString(raw.label)?.trim();
  const baseUrlRaw = asString(raw.baseUrl)?.trim();
  if (!id || !label || !baseUrlRaw) return null;
  return { id, label, baseUrl: normalizeBaseUrl(baseUrlRaw) };
};

export const decodeApiTargetsConfig = (raw: unknown): ApiTargetsConfig => {
  if (!isRecord(raw)) {
    throw new Error("接続先YAMLの形式が不正です（ルートがオブジェクトではありません）。");
  }
  const version = Number(raw.version);
  const defaultId = asString(raw.defaultId)?.trim() ?? "";
  const targetsRaw = raw.targets;
  if (!Number.isFinite(version)) {
    throw new Error("接続先YAMLの形式が不正です（versionが数値ではありません）。");
  }
  if (!defaultId) {
    throw new Error("接続先YAMLの形式が不正です（defaultIdがありません）。");
  }
  if (!Array.isArray(targetsRaw)) {
    throw new Error("接続先YAMLの形式が不正です（targetsが配列ではありません）。");
  }
  const targets = targetsRaw.map(toTarget).filter((v): v is ApiTarget => Boolean(v));
  if (targets.length === 0) {
    throw new Error("接続先YAMLのtargetsが空です。");
  }
  if (!targets.some((t) => t.id === defaultId)) {
    throw new Error(`接続先YAMLのdefaultId「${defaultId}」がtargetsに存在しません。`);
  }
  return { version, defaultId, targets };
};

export const parseApiTargetsYaml = (yamlText: string): ApiTargetsConfig => {
  return decodeApiTargetsConfig(parseSimpleYaml(yamlText));
};

export const loadUserApiTargetsYaml = (): string | null => {
  try {
    return localStorage.getItem(YAML_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveUserApiTargetsYaml = (yamlText: string): void => {
  localStorage.setItem(YAML_STORAGE_KEY, yamlText);
};

export const clearUserApiTargetsYaml = (): void => {
  localStorage.removeItem(YAML_STORAGE_KEY);
};

export const fetchDefaultApiTargetsYaml = async (): Promise<string> => {
  const res = await fetch("/api-targets.yaml", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`既定接続先(api-targets.yaml)の取得に失敗しました: ${res.status}`);
  }
  return await res.text();
};

export const loadSelectedApiTargetId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_ID_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveSelectedApiTargetId = (id: string): void => {
  localStorage.setItem(SELECTED_ID_STORAGE_KEY, id);
};

export const clearSelectedApiTargetId = (): void => {
  localStorage.removeItem(SELECTED_ID_STORAGE_KEY);
};

type RuntimeState = {
  config: ApiTargetsConfig | null;
  yamlText: string;
  /** 明示選択された id。null のとき未選択（既定ルール適用） */
  selectedId: string | null;
  ready: boolean;
};

const runtime: RuntimeState = {
  config: null,
  yamlText: "",
  selectedId: null,
  ready: false
};

export const getApiTargetsConfig = (): ApiTargetsConfig | null => runtime.config;

export const getApiTargetsYamlText = (): string => runtime.yamlText;

export const isApiTargetsReady = (): boolean => runtime.ready;

export const findApiTargetById = (id: string | null | undefined): ApiTarget | null => {
  if (!id || !runtime.config) return null;
  return runtime.config.targets.find((t) => t.id === id) ?? null;
};

/** UI表示用: 現在有効な接続先（未選択時は既定ルールで解決した候補） */
export const getEffectiveApiTarget = (): ApiTarget | null => {
  if (!runtime.config) return null;
  const selected = findApiTargetById(runtime.selectedId);
  if (selected) return selected;
  if (import.meta.env.PROD) {
    return findApiTargetById(runtime.config.defaultId);
  }
  return null;
};

export const getSelectedApiTargetId = (): string | null => runtime.selectedId;

const notifyChanged = (): void => {
  try {
    window.dispatchEvent(new Event(API_TARGET_CHANGED_EVENT));
  } catch {
    // ignore (SSR 等)
  }
};

export const applyApiTargetsYaml = (yamlText: string): ApiTargetsConfig => {
  const config = parseApiTargetsYaml(yamlText);
  runtime.config = config;
  runtime.yamlText = yamlText;
  if (runtime.selectedId && !config.targets.some((t) => t.id === runtime.selectedId)) {
    runtime.selectedId = null;
    clearSelectedApiTargetId();
  }
  notifyChanged();
  return config;
};

export const selectApiTargetId = (id: string): ApiTarget => {
  if (!runtime.config) {
    throw new Error("接続先候補がまだ読み込まれていません。");
  }
  const target = runtime.config.targets.find((t) => t.id === id);
  if (!target) {
    throw new Error(`接続先 id「${id}」が見つかりません。`);
  }
  runtime.selectedId = id;
  saveSelectedApiTargetId(id);
  notifyChanged();
  return target;
};

export const clearApiTargetSelection = (): void => {
  runtime.selectedId = null;
  clearSelectedApiTargetId();
  notifyChanged();
};

/**
 * アプリ起動時に呼ぶ。YAML と選択 id を読み込み、runtime を準備する。
 */
export const initApiTargets = async (): Promise<void> => {
  const userYaml = loadUserApiTargetsYaml();
  const yaml = userYaml ?? (await fetchDefaultApiTargetsYaml());
  const config = parseApiTargetsYaml(yaml);
  runtime.config = config;
  runtime.yamlText = yaml;
  const storedId = loadSelectedApiTargetId();
  runtime.selectedId = storedId && config.targets.some((t) => t.id === storedId) ? storedId : null;
  runtime.ready = true;
};
