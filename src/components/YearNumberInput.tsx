import { type KeyboardEvent } from "react";
import {
  YEAR_NUMBER_INPUT_MIN,
  clampYearNumberInput,
  getCurrentCalendarYear,
  normalizeYearInputOnBlur
} from "./yearNumberInputUtils";

export type YearNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  /** true のとき空欄を許可（検索条件など）。false のとき blur で当年に補正 */
  allowEmpty?: boolean;
  id?: string;
  "aria-label"?: string;
};

/**
 * 年の数値入力（下限 2000・上限 当年）。
 * 矢印キーはブラウザ標準に任せず、当年を起点に ±1 で増減する。
 */
export function YearNumberInput({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  allowEmpty = false,
  id,
  "aria-label": ariaLabel
}: YearNumberInputProps) {
  const maxYear = getCurrentCalendarYear();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
      return;
    }
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === "") {
      onChange(String(maxYear));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      onChange(String(maxYear));
      return;
    }
    const delta = e.key === "ArrowUp" ? 1 : -1;
    onChange(String(clampYearNumberInput(parsed + delta)));
  };

  const handleBlur = () => {
    const normalized = normalizeYearInputOnBlur(value, allowEmpty);
    if (normalized !== value) {
      onChange(normalized);
    }
    onBlur?.();
  };

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      className={className}
      type="number"
      min={YEAR_NUMBER_INPUT_MIN}
      max={maxYear}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
