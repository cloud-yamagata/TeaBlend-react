/**
 * 【処理概要】
 *   原料マスタ `te_material` を一覧取得し `TeMaterial[]` に正規化。
 *
 * 【パラメータ仕様】
 *   `fetchMaterials()` … 引数なし。ベース URL は `MATERIAL_API_BASE_URL`
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchJsonArray } from "../lib/apiFetch";
import type { TeMaterial } from "../MaterialList/types";
import { normalizeMaterial } from "./recordNormalize";

export async function fetchMaterials(): Promise<TeMaterial[]> {
  const url = `${getMaterialApiBaseUrl()}/te_material/`;
  const raw = await fetchJsonArray(url);
  return raw.map((row) => normalizeMaterial((row ?? {}) as Record<string, unknown>));
}
