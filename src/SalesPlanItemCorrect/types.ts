/**
 * 販売計画商品マスタメンテナンス（SalesPlanItemCorrect）型
 */
import type { TrItemGroup, TrSalesPlanItem } from "../domain/masterTableEntityModels";
import type { TrItem } from "../MonthlyPlan/types";

export type SalesPlanItemCorrectRow = {
  id: string;
  itemNo: number;
  itemName: string;
  packageSize: number;
  itemGroupName: string;
  displayOrder: number;
  display: boolean;
  remarks: string;
};

export type SalesPlanItemCorrectSearchFilters = {
  itemName: string;
};

export const defaultSalesPlanItemCorrectSearchFilters = (): SalesPlanItemCorrectSearchFilters => ({
  itemName: ""
});

export type SalesPlanItemCorrectEditMode = "create" | "update";

export type SalesPlanItemCorrectEditForm = {
  itemNo: string;
  itemName: string;
  packageSize: string;
  itemGroupName: string;
  displayOrder: string;
  display: boolean;
  remarks: string;
};

export type SalesPlanItemLookup = {
  itemName: string;
  packageSize: number;
  itemGroupName: string;
  found: boolean;
};

export function lookupTrItemDisplay(
  itemNo: number,
  items: readonly TrItem[],
  groups: readonly TrItemGroup[]
): SalesPlanItemLookup {
  const item = items.find((it) => it.itemNo === itemNo);
  if (!item) {
    return { itemName: "", packageSize: 0, itemGroupName: "", found: false };
  }
  const group = groups.find((g) => g.data.item_group_no === (item.itemGroupNo ?? 0));
  return {
    itemName: item.itemName ?? "",
    packageSize: item.packageSize ?? 0,
    itemGroupName: group?.data.item_group_name ?? "",
    found: true
  };
}

export function trSalesPlanItemToRow(
  entity: TrSalesPlanItem,
  items: readonly TrItem[],
  groups: readonly TrItemGroup[]
): SalesPlanItemCorrectRow | null {
  const d = entity.data;
  if (d.item_no == null) return null;
  const lookup = lookupTrItemDisplay(d.item_no, items, groups);
  return {
    id: String(d.item_no),
    itemNo: d.item_no,
    itemName: lookup.itemName,
    packageSize: lookup.packageSize,
    itemGroupName: lookup.itemGroupName,
    displayOrder: d.display_order ?? 0,
    display: d.display === true,
    remarks: d.remarks ?? ""
  };
}

export function createEmptySalesPlanItemCorrectEditForm(): SalesPlanItemCorrectEditForm {
  return {
    itemNo: "",
    itemName: "",
    packageSize: "",
    itemGroupName: "",
    displayOrder: "5",
    display: true,
    remarks: ""
  };
}

export function rowToEditForm(row: SalesPlanItemCorrectRow): SalesPlanItemCorrectEditForm {
  return {
    itemNo: String(row.itemNo),
    itemName: row.itemName,
    packageSize: String(row.packageSize),
    itemGroupName: row.itemGroupName,
    displayOrder: String(row.displayOrder),
    display: row.display,
    remarks: row.remarks
  };
}

/** 登録時：選択行の内容をコピーし、商品No・商品名・梱包サイズ・分類名のみ空白 */
export function rowToCreateEditForm(row: SalesPlanItemCorrectRow): SalesPlanItemCorrectEditForm {
  return {
    ...rowToEditForm(row),
    itemNo: "",
    itemName: "",
    packageSize: "",
    itemGroupName: ""
  };
}

export type SalesPlanItemCorrectEditFieldErrors = Partial<
  Record<keyof SalesPlanItemCorrectEditForm, string>
>;

export function validateSalesPlanItemCorrectEditForm(
  form: SalesPlanItemCorrectEditForm
): SalesPlanItemCorrectEditFieldErrors {
  const errors: SalesPlanItemCorrectEditFieldErrors = {};
  if (!/^\d+$/.test(form.itemNo.trim())) {
    errors.itemNo = "商品Noは半角数字で入力してください";
  }
  if (!/^\d+$/.test(form.displayOrder.trim())) {
    errors.displayOrder = "表示順は半角数字で入力してください";
  }
  return errors;
}

export function salesPlanItemCorrectIsMandatoryEmpty(
  key: "itemNo",
  form: SalesPlanItemCorrectEditForm
): boolean {
  switch (key) {
    case "itemNo":
      return !form.itemNo.trim();
  }
}

export function editFormToUpsertBody(form: SalesPlanItemCorrectEditForm) {
  const remarks = form.remarks.trim();
  return {
    item_no: Number(form.itemNo.trim()),
    display_order: Number(form.displayOrder.trim()),
    display: form.display,
    remarks: remarks ? remarks : null
  };
}
