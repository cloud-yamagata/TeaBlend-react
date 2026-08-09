/**
 * 【処理概要】
 *   アプリ起動時にマスタを一括取得し、型付き4表＋汎用マスタを Jotai atom に格納する。
 *
 * 【パラメータ仕様】
 *   - `bootstrapMasterDataAtom` … write のみ。同時呼び出しは直列化（`bootstrapInflight`）
 *   - 画面別エラーは `materialListMasterErrorAtom` / `monthlyPlanMasterErrorAtom` が抽出
 *
 * 【メンテナンス】
 *   - 汎用マスタの一覧は `repositories/masterTableRepository.ts` と FastAPI `main.py` の両方と一致させる
 *   - 並列数は `GENERIC_MASTER_FETCH_CONCURRENCY`（既定8）。遅い環境では下げる
 */
import { atom } from "jotai";
import type { TeMaterial, TrConstant } from "../MaterialList/types";
import type { TeMonthlyPlan, TrItem } from "../MonthlyPlan/types";
import {
  emptyMasterEntityCache,
  mergeParsedTable,
  type MasterEntityCache
} from "../domain/masterTableEntityModels";
import { enrichViFactory2StockList } from "../repositories/enrichFactory2Stock";
import { fetchAllTrConstants } from "../repositories/constantRepository";
import { fetchMaterials } from "../repositories/materialRepository";
import {
  fetchMasterTableList,
  GENERIC_MASTER_TABLE_SPECS,
  TYPED_MASTER_LABELS
} from "../repositories/masterTableRepository";
import { fetchItems, fetchMonthlyPlans } from "../repositories/monthlyPlanRepository";

/** 同一ホストへの同時 fetch を抑え、接続窮乏・タイムアウトによる Failed to fetch を避ける */
const GENERIC_MASTER_FETCH_CONCURRENCY = 8;

async function allSettledInBatches<T, R>(
  items: readonly T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const batch = await Promise.allSettled(slice.map((item) => fn(item)));
    out.push(...batch);
  }
  return out;
}

export const masterMaterialsAtom = atom<TeMaterial[]>([]);
export const masterTrConstantsAtom = atom<TrConstant[]>([]);
export const masterMonthlyPlansAtom = atom<TeMonthlyPlan[]>([]);
export const masterTrItemsAtom = atom<TrItem[]>([]);

/** パース済みマスタ（テーブルごとにエンティティ配列）。画面は masterQueries 等で参照し、派生 Atom にバインドする */
export const masterEntityCacheAtom = atom<MasterEntityCache>(emptyMasterEntityCache());

export const masterDataLoadingAtom = atom(false);

/** マスタ取得の失敗一覧（画面別に絞り込んで表示する） */
export type MasterFetchFailure = { id: string; message: string };
export const masterDataFailuresAtom = atom<MasterFetchFailure[]>([]);

/** 全失敗を連結したメッセージ（デバッグ・将来のグローバル表示用） */
export const masterDataErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom);
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const MATERIAL_LIST_SCREEN_FAILURE_IDS = new Set<string>(["te_material", "tr_constant"]);

/** 原料一覧で見せるマスタエラー（起動時一括取得のうち当画面が使う表のみ） */
export const materialListMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => MATERIAL_LIST_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const MONTHLY_PLAN_SCREEN_FAILURE_IDS = new Set<string>(["te_monthly_plan", "tr_item"]);

/** 月次計画で見せるマスタエラー（te_material は別画面用のためここでは出さない） */
export const monthlyPlanMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => MONTHLY_PLAN_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const FACTORY2_LOT_SCREEN_FAILURE_IDS = new Set<string>([
  "te_lot_base",
  "te_lot_use_item",
  "vi_factory2_stock"
]);

const BLEND_CATEGORYS_SCREEN_FAILURE_IDS = new Set<string>([
  "te_lot_base",
  "te_lot_use_item",
  "te_lot_categorys_common",
  "te_lot_categorys_blend"
]);

const FINISH_CATEGORYS_SCREEN_FAILURE_IDS = new Set<string>([
  "te_lot_base",
  "te_lot_use_item",
  "te_lot_categorys_common",
  "te_lot_categorys_finish"
]);

const FIREPAN_CATEGORYS_SCREEN_FAILURE_IDS = new Set<string>([
  "te_lot_base",
  "te_lot_use_item",
  "te_lot_categorys_common",
  "te_lot_categorys_firepan"
]);

const PACKAGE_LOT_SCREEN_FAILURE_IDS = new Set<string>([
  "te_package_base_new",
  "te_package_categorys_new"
]);

/** パッケージロット登録で見せるマスタエラー */
export const packageLotMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => PACKAGE_LOT_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

/** 第二工場ロット製造登録で見せるマスタエラー */
export const factory2LotMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => FACTORY2_LOT_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

/** 配合個別情報登録で見せるマスタエラー */
export const blendCategoryMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    BLEND_CATEGORYS_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

/** 仕上個別情報登録で見せるマスタエラー */
export const finishCategoryMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    FINISH_CATEGORYS_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

/** 火入個別情報登録で見せるマスタエラー */
export const firepanCategoryMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    FIREPAN_CATEGORYS_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const PURCHASE_TTRANSFER_SCREEN_FAILURE_IDS = new Set<string>([
  "te_purchase_tea",
  "te_purchase_transfer",
  "te_purchase_receive",
  "te_material"
]);

/** 仕入実績情報一覧で見せるマスタエラー */
export const purchaseTtransferMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => PURCHASE_TTRANSFER_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const FACTORY1_RRESULT_SCREEN_FAILURE_IDS = new Set<string>([
  "te_factory1_result",
  "te_factory1_transfer",
  "te_material"
]);

/** 第1工場生産実績情報一覧で見せるマスタエラー */
export const factory1RresultMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => FACTORY1_RRESULT_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const MATERIAL_RRESULT_SCREEN_FAILURE_IDS = new Set<string>(["te_material_result", "te_material"]);

/** 原料実績情報一覧で見せるマスタエラー */
export const materialRresultMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => MATERIAL_RRESULT_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const STORE_TRANSFER_FA2_SCREEN_FAILURE_IDS = new Set<string>(["te_store_transfer_fa2"]);

/** 第2工場入出庫実績で見せるマスタエラー */
export const storeTransferFa2MasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    STORE_TRANSFER_FA2_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const MATERIAL_PURCHASE_SCREEN_FAILURE_IDS = new Set<string>([
  "te_material_purchase",
  "tr_item",
  "tr_supplier"
]);

/** 仕上品仕入登録で見せるマスタエラー */
export const materialPurchaseMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    MATERIAL_PURCHASE_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const ITEM_CORRECT_SCREEN_FAILURE_IDS = new Set<string>(["tr_item"]);

/** 商品マスタメンテナンス（Item）で見せるマスタエラー */
export const itemCorrectMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) => ITEM_CORRECT_SCREEN_FAILURE_IDS.has(f.id));
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const SHIPMENT_CORRECT_SCREEN_FAILURE_IDS = new Set<string>(["tr_direct_shipment"]);

/** 直送先マスタメンテナンスで見せるマスタエラー */
export const shipmentCorrectMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    SHIPMENT_CORRECT_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

const ITEM_BOM_CORRECT_SCREEN_FAILURE_IDS = new Set<string>(["tr_item_bom", "tr_item"]);

/** 商品原料対照表メンテナンスで見せるマスタエラー */
export const itemBomCorrectMasterErrorAtom = atom((get) => {
  const list = get(masterDataFailuresAtom).filter((f) =>
    ITEM_BOM_CORRECT_SCREEN_FAILURE_IDS.has(f.id)
  );
  if (list.length === 0) return null;
  return `マスタ取得でエラー: ${list.map((f) => `${f.id}: ${f.message}`).join(" / ")}`;
});

let bootstrapInflight: Promise<void> | null = null;

export const bootstrapMasterDataAtom = atom(null, async (_get, set) => {
  if (bootstrapInflight) {
    await bootstrapInflight;
    return;
  }

  bootstrapInflight = (async () => {
    set(masterDataLoadingAtom, true);
    set(masterDataFailuresAtom, []);

    try {
      // 型付き4表を先に取得（接続枠を確保）。続く generic は件数が多いためバッチで取得する。
      const typedSettled = await Promise.allSettled([
        fetchMaterials(),
        fetchAllTrConstants(),
        fetchMonthlyPlans(),
        fetchItems()
      ]);

      const genericSettled = await allSettledInBatches(
        GENERIC_MASTER_TABLE_SPECS,
        GENERIC_MASTER_FETCH_CONCURRENCY,
        (spec) => fetchMasterTableList(spec.buildUrl()).then((rows) => ({ id: spec.id, rows }))
      );

      const failures: MasterFetchFailure[] = [];

      let nextCache = emptyMasterEntityCache();
      genericSettled.forEach((res, i) => {
        const spec = GENERIC_MASTER_TABLE_SPECS[i];
        if (res.status === "fulfilled") {
          nextCache = mergeParsedTable(nextCache, spec.id, res.value.rows);
        } else {
          failures.push({
            id: spec.id,
            message: res.reason instanceof Error ? res.reason.message : String(res.reason)
          });
        }
      });
      try {
        nextCache = {
          ...nextCache,
          vi_factory2_stock: enrichViFactory2StockList(nextCache.vi_factory2_stock, nextCache)
        };
      } catch (err) {
        console.error("[bootstrapMasterData] vi_factory2_stock enrich failed", err);
        failures.push({
          id: "vi_factory2_stock",
          message: err instanceof Error ? err.message : String(err)
        });
      }
      set(masterEntityCacheAtom, nextCache);

      if (typedSettled[0].status === "fulfilled") {
        set(masterMaterialsAtom, typedSettled[0].value);
      } else {
        set(masterMaterialsAtom, []);
        failures.push({
          id: TYPED_MASTER_LABELS[0],
          message:
            typedSettled[0].reason instanceof Error ? typedSettled[0].reason.message : String(typedSettled[0].reason)
        });
      }

      if (typedSettled[1].status === "fulfilled") {
        set(masterTrConstantsAtom, typedSettled[1].value);
      } else {
        set(masterTrConstantsAtom, []);
        console.warn("[bootstrapMasterData] tr_constant failed", typedSettled[1].reason);
        failures.push({
          id: TYPED_MASTER_LABELS[1],
          message:
            typedSettled[1].reason instanceof Error ? typedSettled[1].reason.message : String(typedSettled[1].reason)
        });
      }

      if (typedSettled[2].status === "fulfilled") {
        set(masterMonthlyPlansAtom, typedSettled[2].value);
      } else {
        set(masterMonthlyPlansAtom, []);
        failures.push({
          id: TYPED_MASTER_LABELS[2],
          message:
            typedSettled[2].reason instanceof Error ? typedSettled[2].reason.message : String(typedSettled[2].reason)
        });
      }

      if (typedSettled[3].status === "fulfilled") {
        set(masterTrItemsAtom, typedSettled[3].value);
      } else {
        set(masterTrItemsAtom, []);
        failures.push({
          id: TYPED_MASTER_LABELS[3],
          message:
            typedSettled[3].reason instanceof Error ? typedSettled[3].reason.message : String(typedSettled[3].reason)
        });
      }

      set(masterDataFailuresAtom, failures);
    } finally {
      set(masterDataLoadingAtom, false);
    }
  })();

  try {
    await bootstrapInflight;
  } finally {
    bootstrapInflight = null;
  }
});
