/**
 * 【処理概要】
 *   Jotai の `itemListAtom` をソースに、コード=item_no・名称=item_name の ZOOM を `MasterZoomModal` で提供。
 *
 * 【パラメータ仕様】
 *   - `filterParams` … `systemClass` / `organicClass` / `itemGroupNo` を任意指定。未指定項目は条件に含めない
 *   - `onSelect(itemNo, itemName)` … 親フォームへ反映
 *
 * 【メンテナンス】
 *   商品リスト自体は起動時 bootstrap で `masterTrItemsAtom` に載る。空なら ZOOM も空になる。
 */
import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { matchesContains } from "../lib/searchNormalize";
import { itemListAtom } from "../MonthlyPlan/store";
import type { TrItem } from "../MonthlyPlan/types";
import { MasterZoomModal, type ZoomMasterRow } from "./MasterZoomModal";
import { compareTrItemZoomSort, trItemPassesDisplayActive, trItemPassesFixedFilters } from "./trItemZoomFilter";
import type { TrItemZoomFilterParams } from "./trItemZoomTypes";

function filterTrItemsToRows(
  items: TrItem[],
  codeQuery: string,
  nameQuery: string,
  fixedFilters: TrItemZoomFilterParams | undefined
): ZoomMasterRow[] {
  const qCode = codeQuery.trim();
  const qName = nameQuery.trim();
  /** 検索コード・検索名称とも空白のときは、表示フラグ＋ZOOM パラメータのみの全件（テキスト絞り込みは行わない） */
  const applyModalTextFilter = qCode !== "" || qName !== "";

  const list = items.filter((it) => {
    if (!trItemPassesDisplayActive(it)) {
      return false;
    }
    if (!trItemPassesFixedFilters(it, fixedFilters)) {
      return false;
    }
    if (!applyModalTextFilter) {
      return true;
    }
    const codeStr = String(it.itemNo ?? "");
    const nameStr = String(it.itemName ?? "");
    if (qCode !== "" && !matchesContains(codeStr, codeQuery)) {
      return false;
    }
    if (qName !== "" && !matchesContains(nameStr, nameQuery)) {
      return false;
    }
    return true;
  });

  list.sort(compareTrItemZoomSort);

  return list.map((it, idx) => ({
    id: `tr-item-${String(it.itemNo ?? "")}-${idx}`,
    code: String(it.itemNo ?? ""),
    name: it.itemName ?? ""
  }));
}

export type TrItemMasterZoomModalProps = {
  open: boolean;
  onClose: () => void;
  /** item_no（コード）と item_name（名称）を親へ渡す */
  onSelect: (itemNo: string, itemName: string) => void;
  initialCode: string;
  initialName: string;
  /** システム区分・有機区分・商品分類NO（未指定は条件に含めない） */
  filterParams?: TrItemZoomFilterParams;
  /** 指定時はフッターに「削除」（選択解除） */
  onClear?: () => void;
};

/**
 * 商品マスター（TrItem）向け ZOOM。コード=item_no、名称=item_name。
 * 抽出: `trItemPassesDisplayActive`（表示＝真のみ）＋ filterParams。
 * ソート: display_order → item_no。
 */
export function TrItemMasterZoomModal({
  open,
  onClose,
  onSelect,
  initialCode,
  initialName,
  filterParams,
  onClear
}: TrItemMasterZoomModalProps) {
  const items = useAtomValue(itemListAtom);

  const sc = filterParams?.systemClass;
  const oc = filterParams?.organicClass;
  const ig = filterParams?.itemGroupNo;

  const search = useCallback(
    (params: { code: string; name: string }) => {
      const fixed: TrItemZoomFilterParams = {};
      if (sc != null && String(sc).trim() !== "") {
        fixed.systemClass = sc;
      }
      if (oc != null && String(oc).trim() !== "") {
        fixed.organicClass = oc;
      }
      if (ig != null && Number.isFinite(ig)) {
        fixed.itemGroupNo = ig;
      }
      const hasAny = Object.keys(fixed).length > 0;
      return filterTrItemsToRows(items, params.code, params.name, hasAny ? fixed : undefined);
    },
    [items, sc, oc, ig]
  );

  return (
    <MasterZoomModal
      open={open}
      title="商品マスター"
      initialCode={initialCode}
      initialName={initialName}
      onClose={onClose}
      onSelect={onSelect}
      onClear={onClear}
      codeSearchLabel="検索コード"
      nameSearchLabel="検索名称"
      resultCodeHeader="コード"
      resultNameHeader="名称"
      search={search}
    />
  );
}

export type { TrItemZoomFilterParams } from "./trItemZoomTypes";
