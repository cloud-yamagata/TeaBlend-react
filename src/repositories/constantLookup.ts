/**
 * tr_constant からコード→表示名を引くヘルパ（bootstrap 済みの配列向け）。
 */
import type { TrConstant } from "../MaterialList/types";

export function filterConstantsByField(rows: TrConstant[], constField: string): TrConstant[] {
  const f = constField.trim();
  return rows.filter((r) => (r.constField ?? "").trim() === f);
}

const registerMapKey = (map: Map<string, string>, field: string, value: string, name: string) => {
  if (!field || !value) return;
  map.set(`${field}:${value}`, name);
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    map.set(`${field}:${String(n)}`, name);
    map.set(`${field}:${String(n).padStart(2, "0")}`, name);
  }
};

/** `${constField}:${constValue}` → constName（数値コードは 1 / 01 などの別表記も登録） */
export function buildConstantNameMap(rows: TrConstant[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    const field = (r.constField ?? "").trim();
    const value = (r.constValue ?? "").trim();
    if (!field || !value) continue;
    const name = r.constName?.trim() || value;
    registerMapKey(map, field, value, name);
  }
  return map;
}

export function constantDisplayName(
  map: Map<string, string>,
  constField: string,
  constValue: string | null | undefined
): string {
  const v = (constValue ?? "").trim();
  if (!v) return "";
  return map.get(`${constField.trim()}:${v}`) ?? v;
}

/** 名称のみ（コードは含めない） */
export function constantNameOnly(
  map: Map<string, string>,
  constField: string,
  constValue: string | null | undefined
): string {
  const v = (constValue ?? "").trim();
  if (!v) return "";
  const name = map.get(`${constField.trim()}:${v}`);
  return name && name !== v ? name : "";
}

/** 「コード:名称」。名称が無いときはコードのみ */
export function constantCodeColonName(
  map: Map<string, string>,
  constField: string,
  constValue: string | null | undefined
): string {
  const code = (constValue ?? "").trim();
  if (!code) return "";
  const name = map.get(`${constField.trim()}:${code}`);
  if (name && name !== code) return `${code}:${name}`;
  return code;
}

/** 複数 const_field を順に試して名称を得る（有機区分は tsv 上 grade） */
export function constantNameFromFields(
  map: Map<string, string>,
  constFields: readonly string[],
  constValue: string | null | undefined
): string {
  for (const field of constFields) {
    const name = constantNameOnly(map, field, constValue);
    if (name) return name;
  }
  return "";
}

/** 複数 const_field を順に試して「コード:名称」 */
export function constantCodeColonFromFields(
  map: Map<string, string>,
  constFields: readonly string[],
  constValue: string | null | undefined
): string {
  const code = (constValue ?? "").trim();
  if (!code) return "";
  for (const field of constFields) {
    const name = map.get(`${field.trim()}:${code}`);
    if (name && name !== code) return `${code}:${name}`;
  }
  return code;
}

/** 表示名の部分一致で const_value の集合を作る（ロット状態・有機区分フィルタ用） */
export function constantValuesByNamePart(
  rows: TrConstant[],
  constField: string,
  namePart: string
): Set<string> {
  const part = namePart.trim();
  if (!part) return new Set();
  return new Set(
    filterConstantsByField(rows, constField)
      .filter((r) => (r.constName ?? "").includes(part))
      .map((r) => (r.constValue ?? "").trim())
      .filter(Boolean)
  );
}
