/**
 * 【処理概要】
 *   `masterEntityCacheAtom` に載ったエンティティ向けの小さなクエリ集（現状は例示的にロット基本のみ）。
 *
 * 【パラメータ仕様】
 *   - `lotBasesWithLotNo(cache, lotNo)` … `TeLotBase[]` を返す
 *   - `masterEntityCounts` … デバッグ用にテーブル別件数を集計
 */
import type {
  MasterEntityCache,
  TeLotBase,
  ViFactory2Stock,
  ViFactory3Stoc
} from "../domain/masterTableEntityModels";

/** 例: ロットNO でロット基本情報を絞り込み */
export function lotBasesWithLotNo(cache: MasterEntityCache, lotNo: number): TeLotBase[] {
  return cache.te_lot_base.filter((e) => e.data.lot_no === lotNo);
}

/** 第二工場ロット在庫（vi_factory2_stock・在庫重量>0 のみキャッシュ済み） */
export function factory2StockList(cache: MasterEntityCache): ViFactory2Stock[] {
  return cache.vi_factory2_stock;
}

/** 第3工場仕上茶在庫（vi_factory3_stoc ビュー） */
export function factory3StocList(cache: MasterEntityCache): ViFactory3Stoc[] {
  return cache.vi_factory3_stoc;
}

/** キャッシュ全体の件数サマリ（デバッグ用） */
export function masterEntityCounts(cache: MasterEntityCache): Record<string, number> {
  const out: Record<string, number> = {};
  (Object.keys(cache) as (keyof MasterEntityCache)[]).forEach((k) => {
    out[k] = cache[k].length;
  });
  return out;
}
