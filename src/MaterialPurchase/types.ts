/**
 * 仕上品仕入（MaterialPurchase）一覧行
 */
export type MaterialPurchaseRow = {
  id: string;
  purchaseDate: string | null;
  itemNo: number;
  purchaseNo: number;
  itemName: string;
  purchaseLotNo: string;
  purchaseQuantity: number | null;
  supplier: string;
};

export type MaterialPurchaseSearchFilters = {
  /** 年度（当年下2桁〜00。仕入日の暦年と照合） */
  year: string;
  /** 商品No（入力テキスト。未指定は空） */
  itemNo: string;
  /** 商品名（部分一致） */
  itemName: string;
  /** 仕入日 yyyy-MM-dd（空なら条件なし） */
  purchaseDate: string;
  /** 仕入先（部分一致） */
  supplier: string;
};

/** 編集画面モード（WPF EditType: "1"=登録 / "2"=更新） */
export type MaterialPurchaseEditMode = "create" | "update";

export type MaterialPurchaseEditForm = {
  purchaseDate: string;
  itemNo: number;
  purchaseNo: number;
  itemName: string;
  purchaseLotNo: string;
  purchaseQuantity: string;
  supplier: string;
};

/** 一覧行 → 編集フォーム（変更／更新モード初期値） */
export function materialPurchaseRowToEditForm(row: MaterialPurchaseRow): MaterialPurchaseEditForm {
  const qty =
    row.purchaseQuantity != null && Number.isFinite(row.purchaseQuantity)
      ? (Math.round(row.purchaseQuantity * 100) / 100).toFixed(2)
      : "";
  return {
    purchaseDate: row.purchaseDate ?? "",
    itemNo: row.itemNo,
    purchaseNo: row.purchaseNo,
    itemName: row.itemName,
    purchaseLotNo: row.purchaseLotNo,
    purchaseQuantity: qty,
    supplier: row.supplier
  };
}

/**
 * 一覧行 → 登録モード初期値
 * 仕入日・仕入No は新規のため反映しない（purchaseNo=0、purchaseDate は空→画面側で当日）
 */
export function materialPurchaseRowToCreateForm(row: MaterialPurchaseRow): MaterialPurchaseEditForm {
  const base = materialPurchaseRowToEditForm(row);
  return {
    ...base,
    purchaseDate: "",
    purchaseNo: 0
  };
}
