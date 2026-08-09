import {
  getCurrentMakeYearMax,
  stepMakeYearDown,
  stepMakeYearUp
} from "./factory2MakeYear";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function Factory2MakeYearSpinner({ value, onChange, readOnly = false }: Props) {
  const max = getCurrentMakeYearMax();
  const display = value.trim();

  if (readOnly) {
    return (
      <input
        className="f2EditInput f2EditMakeYearValue"
        type="text"
        readOnly
        value={display}
        aria-label="年"
      />
    );
  }

  const atMax = display !== "" && Number(display) >= max;
  const atMin = display !== "" && Number(display) <= 0;

  return (
    <div className="f2EditMakeYearSpinner" role="group" aria-label="年">
      <input
        className="f2EditInput f2EditMakeYearValue"
        type="text"
        readOnly
        value={display}
        aria-label="年"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={display === "" ? undefined : Number(display)}
      />
      <div className="f2EditMakeYearButtons">
        <button
          type="button"
          className="f2EditMakeYearStep"
          disabled={atMax}
          aria-label="年を増やす"
          onClick={() => onChange(stepMakeYearUp(value))}
        >
          ▲
        </button>
        <button
          type="button"
          className="f2EditMakeYearStep"
          disabled={atMin}
          aria-label="年を減らす"
          onClick={() => onChange(stepMakeYearDown(value))}
        >
          ▼
        </button>
      </div>
    </div>
  );
}
