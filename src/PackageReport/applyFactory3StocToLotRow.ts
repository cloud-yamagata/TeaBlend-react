import type { ViFactory3Stoc } from "../domain/masterTableEntityModels";
import { formatPackageLotQuantity } from "./formatPackageLotQuantity";
import type { PackageLotDetailRowIndex } from "./packageLotDetailRows";
import type { PackageLotEditFormData } from "./packageLotEditTypes";

export type { PackageLotDetailRowIndex } from "./packageLotDetailRows";

/** ZOOM選択結果を明細行へ反映（product_no→ロット、stoc_quantity→出庫数量） */
export function applyFactory3StocToLotRow(
  form: PackageLotEditFormData,
  row: PackageLotDetailRowIndex,
  stoc: ViFactory3Stoc
): PackageLotEditFormData {
  const productNo = String(stoc.data.product_no);
  const outQuantity = formatPackageLotQuantity(stoc.data.stoc_quantity);

  if (row === 1) {
    return {
      ...form,
      partLotNo1: productNo,
      outQuantity1: outQuantity,
      remQuantity1: "",
      useQuantity1: outQuantity
    };
  }
  if (row === 2) {
    return {
      ...form,
      partLotNo2: productNo,
      outQuantity2: outQuantity,
      remQuantity2: "",
      useQuantity2: outQuantity
    };
  }
  return {
    ...form,
    partLotNo3: productNo,
    outQuantity3: outQuantity,
    remQuantity3: "",
    useQuantity3: outQuantity
  };
}
