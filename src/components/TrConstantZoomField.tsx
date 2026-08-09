/**
 * システム定数 ZOOM 入力（tr_constant … const_field → const_name）
 * UI は製造報告書ロット ZOOM の「Z」ボタンと同型。
 */
import { useState } from "react";
import type { TrConstant } from "../MaterialList/types";
import { TrConstantZoomModal } from "./TrConstantZoomModal";
import "./trConstantZoomField.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** tr_constant.const_field */
  constField: string;
  title?: string;
  constants?: TrConstant[];
  disabled?: boolean;
  /** true のとき手入力不可（ZOOM 選択のみ） */
  readOnly?: boolean;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
  invalid?: boolean;
};

export function TrConstantZoomField({
  value,
  onChange,
  constField,
  title,
  constants,
  disabled = false,
  readOnly = false,
  ariaLabel,
  className,
  inputClassName,
  invalid = false
}: Props) {
  const [open, setOpen] = useState(false);
  const zoomTitle = title ?? "システム定数";

  return (
    <>
      <div className={className ? `trConstantZoomField ${className}` : "trConstantZoomField"}>
        <input
          className={inputClassName ? `trConstantZoomFieldInput ${inputClassName}` : "trConstantZoomFieldInput"}
          type="text"
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            onChange(e.target.value);
          }}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          title={readOnly ? `${ariaLabel}はZOOMで選択してください` : undefined}
        />
        <button
          type="button"
          className="trConstantZoomFieldBtn"
          disabled={disabled}
          title={zoomTitle}
          aria-label={`${ariaLabel} ZOOM`}
          onClick={() => setOpen(true)}
        >
          Z
        </button>
      </div>

      <TrConstantZoomModal
        open={open}
        onClose={() => setOpen(false)}
        constField={constField}
        title={zoomTitle}
        constants={constants}
        onSelect={(_constValue, constName) => onChange(constName)}
      />
    </>
  );
}
