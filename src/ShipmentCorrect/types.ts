/**
 * 直送先マスタメンテナンス（ShipmentCorrect）型
 */
import type { TrDirectShipment } from "../domain/masterTableEntityModels";

export type ShipmentCorrectRow = {
  id: string;
  directShipmentNo: number;
  directShipmentName: string;
  directShipmentKana: string;
  zip: string;
  address: string;
  phoneNo: string;
  faxNo: string;
  displayOrder: number;
  remarks: string;
};

export type ShipmentCorrectSearchFilters = {
  shipmentName: string;
};

export const defaultShipmentCorrectSearchFilters = (): ShipmentCorrectSearchFilters => ({
  shipmentName: ""
});

export type ShipmentCorrectEditMode = "create" | "update";

export type ShipmentCorrectEditForm = {
  directShipmentNo: string;
  directShipmentName: string;
  directShipmentKana: string;
  zip: string;
  address: string;
  phoneNo: string;
  faxNo: string;
  displayOrder: string;
  remarks: string;
};

export function trDirectShipmentToRow(entity: TrDirectShipment): ShipmentCorrectRow | null {
  const d = entity.data;
  if (d.direct_shipment_no == null) return null;
  return {
    id: String(d.direct_shipment_no),
    directShipmentNo: d.direct_shipment_no,
    directShipmentName: d.direct_shipment_name ?? "",
    directShipmentKana: d.direct_shipment_kana ?? "",
    zip: d.zip ?? "",
    address: d.address ?? "",
    phoneNo: d.phone_no ?? "",
    faxNo: d.fax_no ?? "",
    displayOrder: d.display_order ?? 0,
    remarks: d.remarks ?? ""
  };
}

export function createEmptyShipmentCorrectEditForm(): ShipmentCorrectEditForm {
  return {
    directShipmentNo: "",
    directShipmentName: "",
    directShipmentKana: "",
    zip: "",
    address: "",
    phoneNo: "",
    faxNo: "",
    displayOrder: "5",
    remarks: ""
  };
}

export function rowToEditForm(row: ShipmentCorrectRow): ShipmentCorrectEditForm {
  return {
    directShipmentNo: String(row.directShipmentNo),
    directShipmentName: row.directShipmentName,
    directShipmentKana: row.directShipmentKana,
    zip: row.zip,
    address: row.address,
    phoneNo: row.phoneNo,
    faxNo: row.faxNo,
    displayOrder: String(row.displayOrder),
    remarks: row.remarks
  };
}

/** 登録時：選択行の内容をコピーし、直送先No・直送先名のみ空白 */
export function rowToCreateEditForm(row: ShipmentCorrectRow): ShipmentCorrectEditForm {
  return {
    ...rowToEditForm(row),
    directShipmentNo: "",
    directShipmentName: ""
  };
}

export type ShipmentCorrectEditFieldErrors = Partial<Record<keyof ShipmentCorrectEditForm, string>>;

export function validateShipmentCorrectEditForm(
  form: ShipmentCorrectEditForm
): ShipmentCorrectEditFieldErrors {
  const errors: ShipmentCorrectEditFieldErrors = {};
  if (!/^\d+$/.test(form.directShipmentNo.trim())) {
    errors.directShipmentNo = "直送先Noは半角数字で入力してください";
  }
  if (!form.directShipmentName.trim()) {
    errors.directShipmentName = "直送先名を入力してください";
  }
  if (!/^\d+$/.test(form.displayOrder.trim())) {
    errors.displayOrder = "表示順は半角数字で入力してください";
  }
  return errors;
}

/** 未入力時に赤枠を出す項目（直送先No・直送先名） */
export function shipmentCorrectIsMandatoryEmpty(
  key: "directShipmentNo" | "directShipmentName",
  form: ShipmentCorrectEditForm
): boolean {
  switch (key) {
    case "directShipmentNo":
      return !form.directShipmentNo.trim();
    case "directShipmentName":
      return !form.directShipmentName.trim();
  }
}

export function editFormToUpsertBody(form: ShipmentCorrectEditForm) {
  const emptyToNull = (v: string) => {
    const t = v.trim();
    return t ? t : null;
  };
  return {
    direct_shipment_no: Number(form.directShipmentNo.trim()),
    direct_shipment_name: form.directShipmentName.trim(),
    direct_shipment_kana: emptyToNull(form.directShipmentKana),
    zip: emptyToNull(form.zip),
    address: emptyToNull(form.address),
    phone_no: emptyToNull(form.phoneNo),
    fax_no: emptyToNull(form.faxNo),
    display_order: Number(form.displayOrder.trim()),
    remarks: emptyToNull(form.remarks)
  };
}
