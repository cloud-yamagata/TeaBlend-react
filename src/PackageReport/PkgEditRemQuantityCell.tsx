import type { PackageLotDetailRowIndex } from "./applyFactory3StocToLotRow";

type Props = {
  row: PackageLotDetailRowIndex;
  value: string;
  disabled: boolean;
  hasError: boolean;
  maxRem: number | null;
  onChange: (raw: string) => void;
  onBlur: () => void;
};

export function PkgEditRemQuantityCell({
  row,
  value,
  disabled,
  hasError,
  maxRem,
  onChange,
  onBlur
}: Props) {
  return (
    <input
      className={`pkgEditInputRight pkgEditDetailDataCell${hasError ? " pkgEditInputError" : ""}`}
      type="text"
      inputMode="decimal"
      value={value}
      readOnly={disabled}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-label={`使用残${row}`}
      aria-invalid={hasError}
      placeholder={maxRem != null && !disabled ? `上限 ${maxRem}` : undefined}
    />
  );
}
