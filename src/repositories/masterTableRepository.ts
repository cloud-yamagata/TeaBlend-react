/**
 * 【処理概要】
 *   FastAPI の `list[dict]` マスタ用 URL 群と、`fetchMasterTableList` ヘルパ。
 *
 * 【パラメータ仕様】
 *   - `GENERIC_MASTER_TABLE_SPECS` … 各要素 `{ id, buildUrl }`。`id` は `domain/masterTableEntityModels` のキーと一致必須
 *   - `TYPED_MASTER_LABELS` … bootstrap 時のエラー表示ラベル（型付き4表）
 *
 * 【メンテナンス】
 *   FastAPI で router がコメントアウトされている URL は 404 になる。不要ならここからも削除しキャッシュ／取得負荷を下げる。
 */
import { getMaterialApiBaseUrl } from "../config/api";
import { fetchJsonArray } from "../lib/apiFetch";

/** 一覧 GET が `list[dict]` のマスタ用エンドポイントを取得する */
export async function fetchMasterTableList(url: string): Promise<Record<string, unknown>[]> {
  const raw = await fetchJsonArray(url);
  return raw.map((r) => (r ?? {}) as Record<string, unknown>);
}

/**
 * main.py で有効なマスタのうち、API が list[dict] のもの。
 * te_material / tr_constant / te_monthly_plan / tr_item は既存リポジトリで型付き取得。
 * users / items はサンプル CRUD のため除外。
 *
 * 並びは main.py の import ブロックに近い順（追従しやすさ優先）。
 */
export const GENERIC_MASTER_TABLE_SPECS = [
  { id: "blend_no", buildUrl: () => `${getMaterialApiBaseUrl()}/blend_no/` },
  { id: "bulk_no", buildUrl: () => `${getMaterialApiBaseUrl()}/bulk_no/` },
  { id: "finish_no", buildUrl: () => `${getMaterialApiBaseUrl()}/finish_no/` },
  { id: "firepan_no", buildUrl: () => `${getMaterialApiBaseUrl()}/firepan_no/` },
  {
    id: "te_factory1_result",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_factory1_result/`
  },
  {
    id: "te_factory1_transfer",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_factory1_transfer/`
  },
  {
    id: "te_factory2_result",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_factory2_result/`
  },
  {
    id: "vi_factory2_stock",
    buildUrl: () => `${getMaterialApiBaseUrl()}/vi_factory2_stock/`
  },
  {
    id: "vi_factory3_stoc",
    buildUrl: () => `${getMaterialApiBaseUrl()}/vi_factory3_stoc/`
  },
  {
    id: "te_factory3_result",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_factory3_result/`
  },
  {
    id: "te_factory3_stock",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_factory3_stock/`
  },
  { id: "te_grade", buildUrl: () => `${getMaterialApiBaseUrl()}/te_grade/` },
  { id: "te_lot", buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot/` },
  { id: "te_lot_base", buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_base/` },
  { id: "te_lot_use_item", buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_use_item/` },
  {
    id: "te_lot_categorys_blend",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_categorys_blend/`
  },
  {
    id: "te_lot_categorys_common",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_categorys_common/`
  },
  {
    id: "te_lot_categorys_finish",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_categorys_finish/`
  },
  {
    id: "te_lot_categorys_firepan",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_categorys_firepan/`
  },
  { id: "te_lot_divide", buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_divide/` },
  { id: "te_lot_part", buildUrl: () => `${getMaterialApiBaseUrl()}/te_lot_part/` },
  {
    id: "te_material_purchase",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_material_purchase/`
  },
  {
    id: "te_material_result",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_material_result/`
  },
  {
    id: "te_package_base",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_package_base/`
  },
  {
    id: "te_package_base_new",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_package_base_new/`
  },
  {
    id: "te_package_categorys_new",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_package_categorys_new/`
  },
  {
    id: "te_purchase_receive",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_purchase_receive/`
  },
  { id: "te_purchase_tea", buildUrl: () => `${getMaterialApiBaseUrl()}/te_purchase_tea/` },
  {
    id: "te_purchase_transfer",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_purchase_transfer/`
  },
  { id: "te_store_transfer", buildUrl: () => `${getMaterialApiBaseUrl()}/te_store_transfer/` },
  {
    id: "te_store_transfer_fa2",
    buildUrl: () => `${getMaterialApiBaseUrl()}/te_store_transfer_fa2/`
  },
  { id: "tr_customer", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_customer/` },
  {
    id: "tr_direct_shipment",
    buildUrl: () => `${getMaterialApiBaseUrl()}/tr_direct_shipment/`
  },
  { id: "tr_item_bom", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_item_bom/` },
  { id: "tr_item_group", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_item_group/` },
  { id: "tr_purchase", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_purchase/` },
  { id: "tr_resale", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_resale/` },
  { id: "tr_store", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_store/` },
  { id: "tr_supplier", buildUrl: () => `${getMaterialApiBaseUrl()}/tr_supplier/` }
] as const;

export type GenericMasterTableId = (typeof GENERIC_MASTER_TABLE_SPECS)[number]["id"];

/** 型付きマスタ4件（エラー表示・ログ用ラベル） */
export const TYPED_MASTER_LABELS = ["te_material", "tr_constant", "te_monthly_plan", "tr_item"] as const;
