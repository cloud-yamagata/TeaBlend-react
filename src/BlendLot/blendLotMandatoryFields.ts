/**
 * ブレンドロット登録モーダル … 必須項目の未入力表示（赤枠）
 */
export type BlendLotMandatoryHighlight = {
  itemNo: boolean;
  itemName: boolean;
  unitWeight: boolean;
};

/** 赤枠表示対象（空白時 true） */
export function computeBlendLotMandatoryHighlight(form: {
  itemNo: string;
  itemName: string;
  unitWeight: string;
}): BlendLotMandatoryHighlight {
  return {
    itemNo: form.itemNo.trim() === "",
    itemName: form.itemName.trim() === "",
    unitWeight: form.unitWeight.trim() === ""
  };
}

export function isBlendLotMandatoryFilled(form: {
  itemNo: string;
  itemName: string;
  unitWeight: string;
  workDate: string;
}): boolean {
  const h = computeBlendLotMandatoryHighlight(form);
  return !h.itemNo && !h.itemName && !h.unitWeight && form.workDate.trim() !== "";
}
