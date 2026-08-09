import type { PackageLotEditFormData } from "./packageLotEditTypes";

/** 使用茶明細データ部全体（ロット3行・出来上り個数・サンプル数）を空にする */
export function emptyPackageLotUseRowFields(): Pick<
  PackageLotEditFormData,
  | "partLotNo1"
  | "outQuantity1"
  | "useQuantity1"
  | "completeQuantity"
  | "remQuantity1"
  | "partLotNo2"
  | "outQuantity2"
  | "useQuantity2"
  | "remQuantity2"
  | "partLotNo3"
  | "outQuantity3"
  | "useQuantity3"
  | "sampleQuantity"
  | "remQuantity3"
> {
  return {
    partLotNo1: "",
    outQuantity1: "",
    useQuantity1: "",
    completeQuantity: "",
    remQuantity1: "",
    partLotNo2: "",
    outQuantity2: "",
    useQuantity2: "",
    remQuantity2: "",
    partLotNo3: "",
    outQuantity3: "",
    useQuantity3: "",
    sampleQuantity: "",
    remQuantity3: ""
  };
}

/** 製品名ZOOMの選択が前回と同一か */
export function isSameProductZoomSelection(
  current: Pick<PackageLotEditFormData, "itemNo" | "productName">,
  itemNo: string,
  productName: string
): boolean {
  return current.itemNo.trim() === itemNo.trim() && current.productName.trim() === productName.trim();
}
