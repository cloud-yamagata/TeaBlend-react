/**
 * システム定数メンテナンス（TrConstantCorrect）型
 */
import type { TrConstant } from "../MaterialList/types";

export type TrConstantCorrectRow = TrConstant & {
  id: string;
};

export type TrConstantEditForm = {
  constValue: string;
  constName: string;
  displayOrder: string;
  display: boolean;
};

export function createEmptyTrConstantEditForm(): TrConstantEditForm {
  return {
    constValue: "",
    constName: "",
    displayOrder: "",
    display: true
  };
}

export function rowToTrConstantEditForm(row: TrConstantCorrectRow): TrConstantEditForm {
  return {
    constValue: row.constValue,
    constName: row.constName,
    displayOrder: row.displayOrder == null ? "" : String(row.displayOrder),
    display: row.display !== false
  };
}

export function toTrConstantCorrectRow(row: TrConstant): TrConstantCorrectRow {
  return {
    ...row,
    id: `${row.constField}:${row.constValue}`
  };
}
