/**
 * 製造報告書モーダル … 必須項目の未入力表示（赤枠）と lot_status 判定
 */
import { PACKAGE_LOT_STATUS_ACTIVE, PACKAGE_LOT_STATUS_COMPLETE } from "./packageLotDisplay";
import type {
  PackageLotEditFormData,
  PackageLotEditTimeHm,
  PackageLotEditTimeRange
} from "./packageLotEditTypes";

export type PackageLotMandatoryHighlight = {
  productItemNo: boolean;
  productName: boolean;
  useTeaItemNo: boolean;
  useTeaItemName: boolean;
  packingStart: boolean;
  packingEnd: boolean;
  cleaningBeforeStart: boolean;
  cleaningBeforeEnd: boolean;
  cleaningAfterStart: boolean;
  cleaningAfterEnd: boolean;
};

export const isTimeHmFilled = (time: PackageLotEditTimeHm): boolean =>
  time.hh.trim() !== "" && time.mm.trim() !== "";

export const isTimeRangeFilled = (range: PackageLotEditTimeRange): boolean =>
  isTimeHmFilled(range.start) && isTimeHmFilled(range.end);

/** 製品名ZOOM確定済み（商品No・商品名） */
export function isPackageLotProductZoomFilled(form: PackageLotEditFormData): boolean {
  return form.itemNo.trim() !== "" && form.productName.trim() !== "";
}

/** 使用茶品名設定済み（商品No・商品名） */
export function isPackageLotUseTeaPartFilled(form: PackageLotEditFormData): boolean {
  return form.useTeaItemNo1.trim() !== "" && form.useTeaItemName1.trim() !== "";
}

/** 登録モードで登録ボタンを活性化してよいか（製造Noのみのゴミ登録を防ぐ） */
export function canRegisterPackageLot(form: PackageLotEditFormData): boolean {
  return isPackageLotProductZoomFilled(form) && isPackageLotUseTeaPartFilled(form);
}

/** 赤枠表示対象（空白時 true） */
export function computePackageLotMandatoryHighlight(
  form: PackageLotEditFormData
): PackageLotMandatoryHighlight {
  const cleaningBeforeFilled = isTimeRangeFilled(form.cleaningBefore);
  const cleaningAfterFilled = isTimeRangeFilled(form.cleaningAfter);

  return {
    productItemNo: form.itemNo.trim() === "",
    productName: form.productName.trim() === "",
    useTeaItemNo: form.useTeaItemNo1.trim() === "",
    useTeaItemName: form.useTeaItemName1.trim() === "",
    packingStart: !isTimeHmFilled(form.packingStart),
    packingEnd: !isTimeHmFilled(form.packingEnd),
    cleaningBeforeStart: !cleaningBeforeFilled && !isTimeHmFilled(form.cleaningBefore.start),
    cleaningBeforeEnd: !cleaningBeforeFilled && !isTimeHmFilled(form.cleaningBefore.end),
    cleaningAfterStart: !cleaningAfterFilled && !isTimeHmFilled(form.cleaningAfter.start),
    cleaningAfterEnd: !cleaningAfterFilled && !isTimeHmFilled(form.cleaningAfter.end)
  };
}

export function isAllPackageLotMandatoryFilled(form: PackageLotEditFormData): boolean {
  const h = computePackageLotMandatoryHighlight(form);
  return (
    !h.productItemNo &&
    !h.productName &&
    !h.useTeaItemNo &&
    !h.useTeaItemName &&
    !h.packingStart &&
    !h.packingEnd &&
    !h.cleaningBeforeStart &&
    !h.cleaningBeforeEnd &&
    !h.cleaningAfterStart &&
    !h.cleaningAfterEnd
  );
}

/** 登録・変更保存時の lot_status（必須すべて入力済み → 2:完了、それ以外 → 1:仕掛） */
export function resolveLotStatusOnSave(
  form: PackageLotEditFormData,
  existingStatus?: string
): string {
  const existing = (existingStatus ?? form.lotStatusCode ?? "").trim();
  if (existing === "3") return "3";
  if (isAllPackageLotMandatoryFilled(form)) return PACKAGE_LOT_STATUS_COMPLETE;
  return PACKAGE_LOT_STATUS_ACTIVE;
}
