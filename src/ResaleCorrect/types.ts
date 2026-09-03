/**
 * 転売先マスタメンテナンス（ResaleCorrect）型
 */
import type { TrResale } from "../domain/masterTableEntityModels";

export type ResaleCorrectRow = {
  id: string;
  resale: string;
  rate: number;
  postage: number;
  limitPrice: number;
  fixedPrice: number;
  calcType: number;
  remarks: string;
};

export type ResaleCorrectSearchFilters = {
  resaleName: string;
};

export const defaultResaleCorrectSearchFilters = (): ResaleCorrectSearchFilters => ({
  resaleName: ""
});

export type ResaleCorrectEditMode = "create" | "update";

export type ResaleCorrectEditForm = {
  resale: string;
  rate: string;
  postage: string;
  limitPrice: string;
  fixedPrice: string;
  calcType: string;
  remarks: string;
};

export const CALC_TYPE_OPTIONS = [
  { value: "0", label: "0:数量粉引" },
  { value: "1", label: "1:単価粉引" },
  { value: "2", label: "2:直販" },
  { value: "3", label: "3:堀口園_棒" }
] as const;

export function trResaleToRow(entity: TrResale): ResaleCorrectRow | null {
  const d = entity.data;
  if (!d.resale) return null;
  return {
    id: d.resale,
    resale: d.resale,
    rate: d.rate,
    postage: d.postage,
    limitPrice: d.limit_price,
    fixedPrice: d.fixed_price,
    calcType: d.calc_type,
    remarks: d.remarks ?? ""
  };
}

/** WPF StoreRepository.Init 相当 */
export function createEmptyResaleCorrectEditForm(): ResaleCorrectEditForm {
  return {
    resale: "",
    rate: "100",
    postage: "35",
    limitPrice: "400",
    fixedPrice: "35",
    calcType: "0",
    remarks: ""
  };
}

export function rowToEditForm(row: ResaleCorrectRow): ResaleCorrectEditForm {
  return {
    resale: row.resale,
    rate: String(row.rate),
    postage: String(row.postage),
    limitPrice: String(row.limitPrice),
    fixedPrice: String(row.fixedPrice),
    calcType: String(row.calcType),
    remarks: row.remarks
  };
}

/** 登録時：選択行をコピーし、転売先名のみ空白 */
export function rowToCreateEditForm(row: ResaleCorrectRow): ResaleCorrectEditForm {
  return {
    ...rowToEditForm(row),
    resale: ""
  };
}

export type ResaleCorrectEditFieldErrors = Partial<Record<keyof ResaleCorrectEditForm, string>>;

export function validateResaleCorrectEditForm(form: ResaleCorrectEditForm): ResaleCorrectEditFieldErrors {
  const errors: ResaleCorrectEditFieldErrors = {};
  if (!form.resale.trim()) {
    errors.resale = "転売先名を入力してください";
  }
  if (!/^\d+$/.test(form.rate.trim())) {
    errors.rate = "手数料%は半角数字で入力してください";
  }
  if (!/^\d+$/.test(form.postage.trim())) {
    errors.postage = "送料は半角数字で入力してください";
  }
  if (!/^\d+$/.test(form.limitPrice.trim())) {
    errors.limitPrice = "下限額は半角数字で入力してください";
  }
  if (!/^\d+$/.test(form.fixedPrice.trim())) {
    errors.fixedPrice = "固定額は半角数字で入力してください";
  }
  if (!/^[0-3]$/.test(form.calcType.trim())) {
    errors.calcType = "計算区分は 0〜3 を選択してください";
  }
  return errors;
}

export function resaleCorrectIsMandatoryEmpty(
  key: "resale" | "rate" | "postage" | "limitPrice" | "fixedPrice" | "calcType",
  form: ResaleCorrectEditForm
): boolean {
  switch (key) {
    case "resale":
      return !form.resale.trim();
    case "rate":
      return !form.rate.trim();
    case "postage":
      return !form.postage.trim();
    case "limitPrice":
      return !form.limitPrice.trim();
    case "fixedPrice":
      return !form.fixedPrice.trim();
    case "calcType":
      return !form.calcType.trim();
  }
}

export function editFormToUpsertBody(form: ResaleCorrectEditForm) {
  const remarks = form.remarks.trim();
  return {
    resale: form.resale.trim(),
    rate: Number(form.rate.trim()),
    postage: Number(form.postage.trim()),
    limit_price: Number(form.limitPrice.trim()),
    fixed_price: Number(form.fixedPrice.trim()),
    calc_type: Number(form.calcType.trim()),
    remarks: remarks ? remarks : null
  };
}
