/** 年入力（2000〜当年）の下限・丸め・初期値 */
export const YEAR_NUMBER_INPUT_MIN = 2000;

export const getCurrentCalendarYear = () => new Date().getFullYear();

export const getDefaultYearInputValue = () => String(getCurrentCalendarYear());

export const clampYearNumberInput = (value: number) =>
  Math.min(getCurrentCalendarYear(), Math.max(YEAR_NUMBER_INPUT_MIN, value));

export const normalizeYearInputOnBlur = (text: string, allowEmpty: boolean): string => {
  const trimmed = text.trim();
  if (trimmed === "") {
    return allowEmpty ? "" : getDefaultYearInputValue();
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return allowEmpty ? "" : getDefaultYearInputValue();
  }
  return String(clampYearNumberInput(parsed));
};
