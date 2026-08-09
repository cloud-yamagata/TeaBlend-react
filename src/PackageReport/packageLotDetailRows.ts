import type { TePackageLotPartInfo } from "../domain/packageReportEntities";
import type { PackageLotEditFormData } from "./packageLotEditTypes";

export type PackageLotDetailRowIndex = 1 | 2 | 3;

export type PackageLotDetailRowFields = {
  partLotNo: string;
  outQuantity: string;
  useQuantity: string;
  remQuantity: string;
};

const EMPTY_LOT_DETAIL_ROW: PackageLotDetailRowFields = {
  partLotNo: "",
  outQuantity: "",
  useQuantity: "",
  remQuantity: ""
};

const MAX_LOT_DETAIL_ROWS = 3;

export function isFilledLotDetailRow(row: PackageLotDetailRowFields): boolean {
  return row.partLotNo.trim() !== "";
}

export function extractLotDetailRows(form: PackageLotEditFormData): PackageLotDetailRowFields[] {
  return [
    {
      partLotNo: form.partLotNo1,
      outQuantity: form.outQuantity1,
      useQuantity: form.useQuantity1,
      remQuantity: form.remQuantity1
    },
    {
      partLotNo: form.partLotNo2,
      outQuantity: form.outQuantity2,
      useQuantity: form.useQuantity2,
      remQuantity: form.remQuantity2
    },
    {
      partLotNo: form.partLotNo3,
      outQuantity: form.outQuantity3,
      useQuantity: form.useQuantity3,
      remQuantity: form.remQuantity3
    }
  ];
}

/** 空行を除き先頭から詰め、最大3行にパディング（DB JSON・再表示用） */
export function compactLotDetailRows(
  rows: PackageLotDetailRowFields[]
): PackageLotDetailRowFields[] {
  const filled = rows.filter(isFilledLotDetailRow);
  const compacted: PackageLotDetailRowFields[] = [];
  for (let i = 0; i < MAX_LOT_DETAIL_ROWS; i += 1) {
    compacted.push(filled[i] ?? { ...EMPTY_LOT_DETAIL_ROW });
  }
  return compacted;
}

export function applyLotDetailRowsToForm(
  form: PackageLotEditFormData,
  rows: PackageLotDetailRowFields[]
): PackageLotEditFormData {
  const [row1, row2, row3] = rows;
  return {
    ...form,
    partLotNo1: row1.partLotNo,
    outQuantity1: row1.outQuantity,
    useQuantity1: row1.useQuantity,
    remQuantity1: row1.remQuantity,
    partLotNo2: row2.partLotNo,
    outQuantity2: row2.outQuantity,
    useQuantity2: row2.useQuantity,
    remQuantity2: row2.remQuantity,
    partLotNo3: row3.partLotNo,
    outQuantity3: row3.outQuantity,
    useQuantity3: row3.useQuantity,
    remQuantity3: row3.remQuantity
  };
}

/** フォーム上の使用茶明細行を上詰め（中間空白を除去） */
export function compactPackageLotUseRowsInForm(
  form: PackageLotEditFormData
): PackageLotEditFormData {
  return applyLotDetailRowsToForm(form, compactLotDetailRows(extractLotDetailRows(form)));
}

/** 指定行をクリアし、残り行を上詰め */
export function clearAndCompactLotDetailRow(
  form: PackageLotEditFormData,
  row: PackageLotDetailRowIndex
): PackageLotEditFormData {
  const rows = extractLotDetailRows(form);
  rows[row - 1] = { ...EMPTY_LOT_DETAIL_ROW };
  return applyLotDetailRowsToForm(form, compactLotDetailRows(rows));
}

const parseLotPartNo = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const parseLotQuantity = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

/** 登録・変更 API 向け lot_part_info（上詰め済み） */
export function buildLotPartInfoFromForm(form: PackageLotEditFormData): TePackageLotPartInfo[] {
  return compactLotDetailRows(extractLotDetailRows(form))
    .filter(isFilledLotDetailRow)
    .map((row) => {
      const part_lot_no = parseLotPartNo(row.partLotNo);
      if (part_lot_no == null) return null;
      const out_quantity = parseLotQuantity(row.outQuantity);
      const rem_quantity = parseLotQuantity(row.remQuantity);
      const use_quantity = parseLotQuantity(row.useQuantity);
      const entry: TePackageLotPartInfo = { part_lot_no };
      if (out_quantity != null) entry.out_quantity = out_quantity;
      if (rem_quantity != null) entry.rem_quantity = rem_quantity;
      if (use_quantity != null) entry.use_quantity = use_quantity;
      return entry;
    })
    .filter((entry): entry is TePackageLotPartInfo => entry != null);
}
