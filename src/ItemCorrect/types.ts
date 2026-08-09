/**
 * 商品マスタメンテナンス（ItemCorrect）型
 */
import type { TrItem } from "../MonthlyPlan/types";

export type ItemCorrectRow = {
  id: string;
  itemNo: number;
  systemClass: string;
  organicClass: string;
  itemGroupNo: number;
  itemName: string;
  janCode: string;
  packageSize: number;
  displayOrder: number;
  display: boolean;
  remarks: string;
};

export type ItemCorrectSearchFilters = {
  itemName: string;
  systemClassCheck: ItemCorrectSystemClassCheck;
  organicClassCheck: ItemCorrectOrganicClassCheck;
  itemGroupCheck: ItemCorrectItemGroupCheck;
};

/** 商品区分（1=商品 / 2=仕上品） */
export type ItemCorrectSystemClassCheck = {
  product: boolean;
  finish: boolean;
};

/** 有機区分（A/B/C） */
export type ItemCorrectOrganicClassCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 商品分類（選択可能コードのみ） */
export type ItemCorrectItemGroupCheck = {
  "1": boolean;
  "3": boolean;
  "4": boolean;
  "5": boolean;
  "6": boolean;
  "7": boolean;
  "9": boolean;
};

export const defaultSystemClassCheck = (): ItemCorrectSystemClassCheck => ({
  product: false,
  finish: false
});

export const defaultOrganicClassCheck = (): ItemCorrectOrganicClassCheck => ({
  organic: false,
  pesticideFree: false,
  general: false
});

export const defaultItemGroupCheck = (): ItemCorrectItemGroupCheck => ({
  "1": false,
  "3": false,
  "4": false,
  "5": false,
  "6": false,
  "7": false,
  "9": false
});

export const defaultItemCorrectSearchFilters = (): ItemCorrectSearchFilters => ({
  itemName: "",
  systemClassCheck: defaultSystemClassCheck(),
  organicClassCheck: defaultOrganicClassCheck(),
  itemGroupCheck: defaultItemGroupCheck()
});

export type ItemCorrectEditMode = "create" | "update";

export type ItemCorrectEditForm = {
  itemNo: string;
  systemClass: string;
  organicClass: string;
  itemGroupNo: string;
  itemName: string;
  janCode: string;
  packageSize: string;
  displayOrder: string;
  display: boolean;
  remarks: string;
};

export const SYSTEM_CLASS_OPTIONS = [
  { value: "1", label: "1:商品" },
  { value: "2", label: "2:仕上品" }
] as const;

export const ORGANIC_CLASS_OPTIONS = [
  { value: "A", label: "A:有機" },
  { value: "B", label: "B:無農薬" },
  { value: "C", label: "C:一般" }
] as const;

/** 2,8 は指定不可のため選択肢に含めない */
export const ITEM_GROUP_OPTIONS = [
  { value: "1", label: "1:商品" },
  { value: "3", label: "3:仕上茶" },
  { value: "4", label: "4:仕入茶" },
  { value: "5", label: "5:委託品" },
  { value: "6", label: "6:ブレンド" },
  { value: "7", label: "7:委託支給品" },
  { value: "9", label: "9:卸" }
] as const;

export const isItemDisplayOn = (display: string | null | undefined): boolean => {
  if (display == null) return false;
  const t = String(display).trim().toLowerCase();
  return t === "true" || t === "t" || t === "1" || t === "yes";
};

export function trItemToRow(item: TrItem): ItemCorrectRow | null {
  if (item.itemNo == null) return null;
  return {
    id: String(item.itemNo),
    itemNo: item.itemNo,
    systemClass: item.systemClass ?? "",
    organicClass: item.organicClass ?? "",
    itemGroupNo: item.itemGroupNo ?? 0,
    itemName: item.itemName ?? "",
    janCode: item.janCode ?? "",
    packageSize: item.packageSize ?? 0,
    displayOrder: item.displayOrder ?? 0,
    display: isItemDisplayOn(item.display),
    remarks: item.remarks ?? ""
  };
}

export function createEmptyItemCorrectEditForm(): ItemCorrectEditForm {
  return {
    itemNo: "",
    systemClass: "1",
    organicClass: "C",
    itemGroupNo: "1",
    itemName: "",
    janCode: "",
    packageSize: "100",
    displayOrder: "5",
    display: true,
    remarks: ""
  };
}

export function rowToEditForm(row: ItemCorrectRow): ItemCorrectEditForm {
  return {
    itemNo: String(row.itemNo),
    systemClass: row.systemClass || "1",
    organicClass: row.organicClass || "C",
    itemGroupNo: String(row.itemGroupNo || 1),
    itemName: row.itemName,
    janCode: row.janCode,
    packageSize: String(row.packageSize),
    displayOrder: String(row.displayOrder),
    display: row.display,
    remarks: row.remarks
  };
}

/** 登録時：選択行の内容をコピーし、商品No・商品名・JANコードのみ空白 */
export function rowToCreateEditForm(row: ItemCorrectRow): ItemCorrectEditForm {
  return {
    ...rowToEditForm(row),
    itemNo: "",
    itemName: "",
    janCode: ""
  };
}

export type ItemCorrectEditFieldErrors = Partial<Record<keyof ItemCorrectEditForm, string>>;

export function validateItemCorrectEditForm(form: ItemCorrectEditForm): ItemCorrectEditFieldErrors {
  const errors: ItemCorrectEditFieldErrors = {};
  if (!/^\d+$/.test(form.itemNo.trim())) errors.itemNo = "商品Noは半角数字で入力してください";
  if (!form.systemClass.trim()) errors.systemClass = "商品区分を選択してください";
  if (!form.organicClass.trim()) errors.organicClass = "有機区分を選択してください";
  if (!/^\d+$/.test(form.itemGroupNo.trim())) errors.itemGroupNo = "商品分類を選択してください";
  if (!form.itemName.trim()) errors.itemName = "商品名を入力してください";
  if (!/^\d+$/.test(form.packageSize.trim())) errors.packageSize = "梱包サイズは半角数字で入力してください";
  if (!/^\d+$/.test(form.displayOrder.trim())) errors.displayOrder = "表示順は半角数字で入力してください";
  return errors;
}

/** 未入力時に赤枠を出す項目（商品No・商品名）… 初期表示から常時判定 */
export function itemCorrectIsMandatoryEmpty(
  key: "itemNo" | "itemName",
  form: ItemCorrectEditForm
): boolean {
  switch (key) {
    case "itemNo":
      return !form.itemNo.trim();
    case "itemName":
      return !form.itemName.trim();
  }
}

export function editFormToUpsertBody(form: ItemCorrectEditForm) {
  return {
    item_no: Number(form.itemNo.trim()),
    system_class: form.systemClass.trim(),
    organic_class: form.organicClass.trim(),
    item_group_no: Number(form.itemGroupNo.trim()),
    item_name: form.itemName.trim(),
    jan_code: form.janCode.trim(),
    package_size: Number(form.packageSize.trim()),
    display_order: Number(form.displayOrder.trim()),
    display: form.display,
    remarks: form.remarks.trim() || null
  };
}
