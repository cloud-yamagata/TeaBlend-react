/**
 * 【処理概要】
 *   メニュー YAML のデコード、localStorage 永続化、`public/menu.yaml` 既定取得。
 *
 * 【パラメータ仕様】
 *   - `parseMenuYaml(yamlText)` … 検証付きで `MenuConfig` を返却。失敗は Error
 *   - `loadUserMenuYaml` / `saveUserMenuYaml` … キー `teablend.menuYaml.v1`
 *
 * 【メンテナンス】
 *   スキーマ変更時は `types.ts` と本ファイルの `decodeMenuConfig`、および `public/menu.yaml` を同期。
 */
import type { MenuConfig, MenuGroup, MenuItem } from "./types";
import { parseSimpleYaml } from "./simpleYaml";

const STORAGE_KEY = "teablend.menuYaml.v1";

const isRecord = (v: unknown): v is Record<string, unknown> => {
  return typeof v === "object" && v !== null && !Array.isArray(v);
};

const asString = (v: unknown): string | null => (typeof v === "string" ? v : v == null ? null : String(v));

const toMenuItem = (raw: unknown): MenuItem | null => {
  if (!isRecord(raw)) return null;
  const label = asString(raw.label);
  const screenKey = asString(raw.screenKey);
  const path = raw.path == null ? undefined : asString(raw.path) ?? undefined;
  if (!label || !screenKey) return null;
  return { label, screenKey, path };
};

const toMenuGroup = (raw: unknown): MenuGroup | null => {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title);
  const itemsRaw = raw.items;
  if (!title || !Array.isArray(itemsRaw)) return null;
  const items = itemsRaw.map(toMenuItem).filter((v): v is MenuItem => Boolean(v));
  if (items.length === 0) return null;
  return { title, items };
};

export const decodeMenuConfig = (raw: unknown): MenuConfig => {
  if (!isRecord(raw)) {
    throw new Error("メニューYAMLの形式が不正です（ルートがオブジェクトではありません）。");
  }
  const version = Number(raw.version);
  const title = raw.title == null ? undefined : asString(raw.title) ?? undefined;
  const groupsRaw = raw.groups;
  if (!Number.isFinite(version)) {
    throw new Error("メニューYAMLの形式が不正です（versionが数値ではありません）。");
  }
  if (!Array.isArray(groupsRaw)) {
    throw new Error("メニューYAMLの形式が不正です（groupsが配列ではありません）。");
  }
  const groups = groupsRaw.map(toMenuGroup).filter((v): v is MenuGroup => Boolean(v));
  if (groups.length === 0) {
    throw new Error("メニューYAMLのgroupsが空です。");
  }
  return { version, title, groups };
};

export const parseMenuYaml = (yamlText: string): MenuConfig => {
  const raw = parseSimpleYaml(yamlText);
  return decodeMenuConfig(raw);
};

export const loadUserMenuYaml = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveUserMenuYaml = (yamlText: string): void => {
  localStorage.setItem(STORAGE_KEY, yamlText);
};

export const clearUserMenuYaml = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const fetchDefaultMenuYaml = async (): Promise<string> => {
  const res = await fetch("/menu.yaml", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`既定メニュー(menu.yaml)の取得に失敗しました: ${res.status}`);
  }
  return await res.text();
};

