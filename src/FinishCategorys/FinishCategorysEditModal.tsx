/**
 * 仕上個別情報登録画面（FinishCategorys EditWindow.xaml 相当）
 */
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal/EditModalOverlay";
import { useBusyTask } from "../ui/useBusyTask";
import {
  computePickupQuantity,
  formToFinishCategoryUpsertPayload
} from "./buildFinishCategoryEditForm";
import type { FinishCategoryEditFormData } from "./finishCategoryEditTypes";
import { upsertFinishCategoryAtom } from "./store";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "../BlendCategorys/blendCategoryEditModal.css";
import "./finishCategoryEditModal.css";

type Props = {
  form: FinishCategoryEditFormData;
  onClose: () => void;
};

const toDateText = (value: string | null): string => {
  if (!value) return "";
  const m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}/${String(Number(m[2])).padStart(2, "0")}/${String(Number(m[3])).padStart(2, "0")}`;
  }
  return value;
};

const fmtNum = (value: number | null, digits = 2): string =>
  value == null ? "" : value.toFixed(digits);

function LabelCell({ children, width, className }: { children: ReactNode; width: number; className?: string }) {
  return (
    <div className={`bcEditCellLabel ${className ?? ""}`} style={{ width }}>
      {children}
    </div>
  );
}

function ValueCell({
  children,
  width,
  align = "left",
  className
}: {
  children: ReactNode;
  width: number;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <div
      className={`bcEditCellValue bcEditAlign${align === "left" ? "Left" : align === "right" ? "Right" : "Center"} ${className ?? ""}`}
      style={{ width }}
    >
      {children}
    </div>
  );
}

function ReadonlyText({ value, align = "left" }: { value: string; align?: "left" | "right" }) {
  return <span className={`bcEditReadonly bcEditAlign${align === "right" ? "Right" : "Left"}`}>{value}</span>;
}

function CheckPanel({
  title,
  width,
  items
}: {
  title: string;
  width: number;
  items: { label: string; checked: boolean }[];
}) {
  return (
    <div className="f2EditCheckPanel" style={{ width }}>
      <div className="f2EditCheckPanelTitle">{title}</div>
      <div className="f2EditCheckPanelBody">
        {items.map((item) => (
          <div key={item.label} className="f2EditCheckCell">
            <span>{item.label}</span>
            <input type="checkbox" checked={item.checked} disabled readOnly aria-label={item.label} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimePair({ hh, mm }: { hh: string; mm: string }) {
  return (
    <span className="bcEditTimePair">
      <span className="bcEditTimeDigit">{hh}</span>
      <span className="bcEditTimeColon">：</span>
      <span className="bcEditTimeDigit">{mm}</span>
    </span>
  );
}

function TimeRange({
  sh,
  sm,
  eh,
  em
}: {
  sh: string;
  sm: string;
  eh: string;
  em: string;
}) {
  return (
    <span className="bcEditTimeRange">
      <span className="bcEditTimeDigit bcEditTimeDigitNarrow">{sh}</span>
      <span className="bcEditTimeColon">：</span>
      <span className="bcEditTimeDigit bcEditTimeDigitNarrow">{sm}</span>
      <span className="bcEditTimeTilde">～</span>
      <span className="bcEditTimeDigit bcEditTimeDigitNarrow">{eh}</span>
      <span className="bcEditTimeColon">：</span>
      <span className="bcEditTimeDigit bcEditTimeDigitNarrow">{em}</span>
    </span>
  );
}

function EditInput({
  value,
  onChange,
  disabled,
  width = 40,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  width?: number;
  className?: string;
}) {
  return (
    <input
      className={`fcEditInput ${className ?? ""}`}
      style={{ width }}
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

type PickupRow = {
  nameKey: keyof FinishCategoryEditFormData;
  weightKey: keyof FinishCategoryEditFormData;
  numberKey: keyof FinishCategoryEditFormData;
  fractionKey: keyof FinishCategoryEditFormData;
  label: string;
};

const PICKUP_ROWS: PickupRow[] = [
  {
    nameKey: "pickup1Name",
    weightKey: "pickup1Weight",
    numberKey: "pickup1Number",
    fractionKey: "pickup1Fraction",
    label: "棒"
  },
  {
    nameKey: "pickup2Name",
    weightKey: "pickup2Weight",
    numberKey: "pickup2Number",
    fractionKey: "pickup2Fraction",
    label: "唐箕先"
  },
  {
    nameKey: "pickup3Name",
    weightKey: "pickup3Weight",
    numberKey: "pickup3Number",
    fractionKey: "pickup3Fraction",
    label: "頭"
  },
  {
    nameKey: "pickup4Name",
    weightKey: "pickup4Weight",
    numberKey: "pickup4Number",
    fractionKey: "pickup4Fraction",
    label: "粉"
  }
];

export function FinishCategorysEditModal({ form: initialForm, onClose }: Props) {
  const upsert = useSetAtom(upsertFinishCategoryAtom);
  const runBusy = useBusyTask();
  const [form, setForm] = useState(initialForm);

  const organicCode = form.organicClassCode.trim().toUpperCase();
  const processCode = form.processTypeCode.trim();

  const setField = useCallback(
    <K extends keyof FinishCategoryEditFormData>(key: K, value: FinishCategoryEditFormData[K]) => {
      setForm((p) => ({ ...p, [key]: value }));
    },
    []
  );

  const handleRegist = useCallback(() => {
    const ok = window.confirm(
      "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
    );
    if (!ok) return;

    void runBusy(async () => {
      const success = await upsert(formToFinishCategoryUpsertPayload(form));
      if (success) {
        onClose();
      }
    }, "登録中…");
  }, [form, onClose, runBusy, upsert]);

  const pickupQuantities = useMemo(
    () =>
      PICKUP_ROWS.map((row) =>
        computePickupQuantity(
          String(form[row.weightKey]),
          String(form[row.numberKey]),
          String(form[row.fractionKey])
        )
      ),
    [form]
  );

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="fcEditOverlay">
      <div
        className="fcEditPanel bcEditPanel modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fcEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="bcEditWindowTitle">仕上個別情報登録画面</h2>
        <div className="bcEditToolbar f2EditToolbar">
          <span id="fcEditTitle" className="bcEditHeaderTitle">
            製造報告書（仕上）
          </span>
          <button type="button" className="bcEditActionBtn" onClick={handleRegist}>
            登録
          </button>
          <button type="button" className="bcEditActionBtn" disabled>
            変更
          </button>
          <button type="button" className="bcEditActionBtn" disabled>
            削除
          </button>
          <button type="button" className="bcEditActionBtn bcEditCloseBtn" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div className="f2EditBlock">
          <div className="f2EditRow bcEditFormRow">
            <LabelCell width={50}>製造No</LabelCell>
            <ValueCell width={88} className="bcEditProductNoValue">
              <span className="bcEditProductNoText">
                {organicCode} - {form.productNo ?? ""}
              </span>
            </ValueCell>
            <LabelCell width={30}>年</LabelCell>
            <ValueCell width={30}>
              <ReadonlyText value={form.makeYear ?? ""} />
            </ValueCell>
            <LabelCell width={50}>通称名</LabelCell>
            <ValueCell width={171}>
              <ReadonlyText value={form.itemName ?? ""} />
            </ValueCell>
            <LabelCell width={35}>回数</LabelCell>
            <ValueCell width={30}>
              <ReadonlyText value={form.count ?? ""} />
            </ValueCell>
            <LabelCell width={50}>製造日</LabelCell>
            <ValueCell width={80}>
              <ReadonlyText value={toDateText(form.workDate)} />
            </ValueCell>
          </div>
        </div>

        <div className="f2EditBlock">
          <div className="f2EditRow bcEditFormRow">
            <LabelCell width={50}>茶区分</LabelCell>
            <ValueCell width={242} className="bcEditRadioWrap">
              <label className="bcEditRadio">
                <input type="radio" checked={organicCode === "A"} disabled readOnly /> 有機茶
              </label>
              <label className="bcEditRadio">
                <input type="radio" checked={organicCode === "B"} disabled readOnly /> 無農薬茶
              </label>
              <label className="bcEditRadio">
                <input type="radio" checked={organicCode === "C"} disabled readOnly /> 一般茶
              </label>
            </ValueCell>
            <LabelCell width={60}>プロセス</LabelCell>
            <ValueCell width={262} className="bcEditRadioWrap bcEditRadioWrapProcess">
              <label className="bcEditRadio">
                <input type="radio" checked={processCode === "02"} disabled readOnly /> 荒茶配合
              </label>
              <label className="bcEditRadio">
                <input type="radio" checked={processCode === "03"} disabled readOnly /> 仕上
              </label>
              <label className="bcEditRadio">
                <input type="radio" checked={processCode === "04"} disabled readOnly /> 火入
              </label>
              <label className="bcEditRadio">
                <input type="radio" checked={processCode === "05"} disabled readOnly /> 仕上配合
              </label>
            </ValueCell>
          </div>
        </div>

        <div className="f2EditBlock bcEditPartsBlock">
          <div className="f2EditRow bcEditPartsHeadRow bcEditFormRow">
            <LabelCell width={230} className="bcEditPartsHead">
              部品名
            </LabelCell>
            <LabelCell width={56} className="bcEditPartsHead">
              梱包重量
            </LabelCell>
            <LabelCell width={50} className="bcEditPartsHead">
              梱包数
            </LabelCell>
            <LabelCell width={56} className="bcEditPartsHead">
              端数重量
            </LabelCell>
            <LabelCell width={72} className="bcEditPartsHead">
              製造数(Kg)
            </LabelCell>
            <LabelCell width={150} className="bcEditPartsHead">
              適用
            </LabelCell>
          </div>
          <div className="f2EditRow bcEditPartsDataRow bcEditFormRow">
            <ValueCell width={230}>
              <ReadonlyText value={form.lotName ?? ""} />
            </ValueCell>
            <ValueCell width={56} align="right">
              <ReadonlyText value={fmtNum(form.unitWeight)} align="right" />
            </ValueCell>
            <ValueCell width={50} align="right">
              <ReadonlyText value={form.unitNumber == null ? "" : String(form.unitNumber)} align="right" />
            </ValueCell>
            <ValueCell width={56} align="right">
              <ReadonlyText value={fmtNum(form.fractionWeightRaw)} align="right" />
            </ValueCell>
            <ValueCell width={72} align="right">
              <ReadonlyText value={fmtNum(form.productQuantity)} align="right" />
            </ValueCell>
            <ValueCell width={150}>
              <ReadonlyText value={form.applicationRemarks ?? ""} />
            </ValueCell>
          </div>
        </div>

        <div className="f2EditBlock bcEditCheckRow">
          <CheckPanel
            title="使用機械"
            width={150}
            items={[
              { label: "1号機", checked: form.useDeviceUnit1 },
              { label: "2号機", checked: form.useDeviceUnit2 },
              { label: "3号機", checked: form.useDeviceUnit3 }
            ]}
          />
          <CheckPanel
            title="上り梱包形態"
            width={100}
            items={[
              { label: "窒素ﾀﾞﾝﾎﾞｰﾙ", checked: form.packingCase1 },
              { label: "大海袋", checked: form.packingCase2 }
            ]}
          />
          <CheckPanel
            title="確認チェック"
            width={300}
            items={[
              { label: "作業前清掃", checked: form.workBeforeCleaningChk },
              { label: "作業後清掃", checked: form.workAfterCleaningChk },
              { label: "装置設定", checked: form.deviceChk },
              { label: "空動作", checked: form.operationChk },
              { label: "残留物", checked: form.restChk },
              { label: "磁石清掃", checked: form.magnetCleaningChk }
            ]}
          />
        </div>

        <div className="f2EditBlock bcEditEnvRow">
          <div className="bcEditEnvTemp">
            <LabelCell width={60} className="bcEditEnvTempLabel">
              <div>室内温度</div>
              <div>湿度</div>
            </LabelCell>
            <ValueCell width={65} className="bcEditEnvTempValue">
              <div className="bcEditEnvLine">
                <ReadonlyText value={form.temperature} align="right" />
                <span>℃</span>
              </div>
              <div className="bcEditEnvLine">
                <ReadonlyText value={form.humidity} align="right" />
                <span>％</span>
              </div>
            </ValueCell>
          </div>
          <div className="bcEditTimeBlock">
            <LabelCell width={100}>製造開始時間</LabelCell>
            <LabelCell width={100}>製造終了時間</LabelCell>
          </div>
          <div className="bcEditTimeBlock">
            <ValueCell width={76} className="bcEditTimeValue">
              <TimePair hh={form.workStartHh} mm={form.workStartMm} />
            </ValueCell>
            <ValueCell width={76} className="bcEditTimeValue">
              <TimePair hh={form.workEndHh} mm={form.workEndMm} />
            </ValueCell>
          </div>
          <div className="bcEditTimeBlock">
            <LabelCell width={100}>作業前清掃時刻</LabelCell>
            <LabelCell width={100}>作業後清掃時刻</LabelCell>
          </div>
          <div className="bcEditTimeBlock bcEditTimeBlockWide">
            <ValueCell width={148} className="bcEditTimeValue">
              <TimeRange
                sh={form.workBeforeCleaningStartHh}
                sm={form.workBeforeCleaningStartMm}
                eh={form.workBeforeCleaningEndHh}
                em={form.workBeforeCleaningEndMm}
              />
            </ValueCell>
            <ValueCell width={148} className="bcEditTimeValue">
              <TimeRange
                sh={form.workEndCleaningStartHh}
                sm={form.workEndCleaningStartMm}
                eh={form.workEndCleaningEndHh}
                em={form.workEndCleaningEndMm}
              />
            </ValueCell>
          </div>
        </div>

        <div className="f2EditBlock fcEditPickupBlock">
          <div className="fcEditPickupBadge" aria-hidden>
            出物
          </div>
          <div className="fcEditPickupGrid" role="group" aria-label="出物">
            <div className="fcEditPickupHead">用途等</div>
            <div className="fcEditPickupHead">品柄</div>
            <div className="fcEditPickupHead">Kg</div>
            <div className="fcEditPickupHead">個数</div>
            <div className="fcEditPickupHead">端数</div>
            <div className="fcEditPickupHead">総数量</div>
            {PICKUP_ROWS.flatMap((row, idx) => [
              <div key={`${row.label}-name`} className="fcEditPickupValue fcEditPickupValueName">
                <EditInput
                  value={String(form[row.nameKey])}
                  onChange={(v) => setField(row.nameKey, v as never)}
                  className="fcEditPickupInput"
                />
              </div>,
              <div key={`${row.label}-grade`} className="fcEditPickupValue fcEditPickupValueLabel">
                <ReadonlyText value={row.label} />
              </div>,
              <div key={`${row.label}-weight`} className="fcEditPickupValue fcEditPickupValueNum">
                <EditInput
                  value={String(form[row.weightKey])}
                  onChange={(v) => setField(row.weightKey, v as never)}
                  className="fcEditPickupInput"
                />
              </div>,
              <div key={`${row.label}-number`} className="fcEditPickupValue fcEditPickupValueNum">
                <EditInput
                  value={String(form[row.numberKey])}
                  onChange={(v) => setField(row.numberKey, v as never)}
                  className="fcEditPickupInput"
                />
              </div>,
              <div key={`${row.label}-fraction`} className="fcEditPickupValue fcEditPickupValueNum">
                <EditInput
                  value={String(form[row.fractionKey])}
                  onChange={(v) => setField(row.fractionKey, v as never)}
                  className="fcEditPickupInput"
                />
              </div>,
              <div key={`${row.label}-quantity`} className="fcEditPickupValue fcEditPickupValueNum">
                <ReadonlyText value={pickupQuantities[idx]} align="right" />
              </div>
            ])}
          </div>
        </div>

        <div className="f2EditBlock fcEditSpBlock">
          <div className="fcEditSpBadge" aria-hidden>
            SP-1
          </div>
          <div className="fcEditSp1Grid" role="group" aria-label="SP-1">
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 1 }}>
              使用状況
            </div>
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 2 }}>
              投入量
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "3 / 6" }}>
              回転篩網
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "6 / 8" }}>
              廻し篩網目
            </div>
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 8 }}>
              唐箕
            </div>
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 9 }}>
              電棒電圧
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "10 / 12" }}>
              角葉抜き
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 3 }}>
              元
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 4 }}>
              中
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 5 }}>
              先
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 6 }}>
              上
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 7 }}>
              下
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 10 }}>
              振動
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 11 }}>
              網
            </div>
            <label className="fcEditSpUseCell" style={{ gridColumn: 1 }}>
              使用
              <input
                type="checkbox"
                checked={form.sp1UseChk}
                onChange={(e) => setField("sp1UseChk", e.target.checked)}
              />
            </label>
            <div className="fcEditSpValue" style={{ gridColumn: 2 }}>
              <EditInput
                value={form.sp1Value1}
                onChange={(v) => setField("sp1Value1", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 3 }}>
              <EditInput
                value={form.sp1Value2a}
                onChange={(v) => setField("sp1Value2a", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 4 }}>
              <EditInput
                value={form.sp1Value2b}
                onChange={(v) => setField("sp1Value2b", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 5 }}>
              <EditInput
                value={form.sp1Value2c}
                onChange={(v) => setField("sp1Value2c", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 6 }}>
              <EditInput
                value={form.sp1Value3a}
                onChange={(v) => setField("sp1Value3a", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 7 }}>
              <EditInput
                value={form.sp1Value3b}
                onChange={(v) => setField("sp1Value3b", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 8 }}>
              <EditInput
                value={form.sp1Value4}
                onChange={(v) => setField("sp1Value4", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 9 }}>
              <EditInput
                value={form.sp1Value5}
                onChange={(v) => setField("sp1Value5", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 10 }}>
              <EditInput
                value={form.sp1Value6a}
                onChange={(v) => setField("sp1Value6a", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 11 }}>
              <EditInput
                value={form.sp1Value6b}
                onChange={(v) => setField("sp1Value6b", v)}
                disabled={!form.sp1UseChk}
                className="fcEditSpInput"
              />
            </div>
          </div>
        </div>

        <div className="f2EditBlock fcEditSpBlock">
          <div className="fcEditSpBadge" aria-hidden>
            SP-2
          </div>
          <div className="fcEditSp2Grid" role="group" aria-label="SP-2">
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 1 }}>
              使用状況
            </div>
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 2 }}>
              投入量
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "3 / 7" }}>
              抜き網
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "7 / 9" }}>
              廻し篩網目
            </div>
            <div className="fcEditSpHead" style={{ gridColumn: "9 / 11" }}>
              唐箕
            </div>
            <div className="fcEditSpHead fcEditSpHeadSpan2" style={{ gridColumn: 11 }}>
              電棒電圧
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 3 }}>
              抜き振動
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 4 }}>
              先網目
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 5 }}>
              中網目
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 6 }}>
              元網目
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 7 }}>
              上
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 8 }}>
              下
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 9 }}>
              ①本茶
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 10 }}>
              ②芽
            </div>
            <label className="fcEditSpUseCell" style={{ gridColumn: 1 }}>
              使用
              <input
                type="checkbox"
                checked={form.sp2UseChk}
                onChange={(e) => setField("sp2UseChk", e.target.checked)}
              />
            </label>
            <div className="fcEditSpValue" style={{ gridColumn: 2 }}>
              <EditInput
                value={form.sp2Value1}
                onChange={(v) => setField("sp2Value1", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 3 }}>
              <EditInput
                value={form.sp2Value2a}
                onChange={(v) => setField("sp2Value2a", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 4 }}>
              <EditInput
                value={form.sp2Value2b}
                onChange={(v) => setField("sp2Value2b", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 5 }}>
              <EditInput
                value={form.sp2Value2c}
                onChange={(v) => setField("sp2Value2c", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 6 }}>
              <EditInput
                value={form.sp2Value2d}
                onChange={(v) => setField("sp2Value2d", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 7 }}>
              <EditInput
                value={form.sp2Value3a}
                onChange={(v) => setField("sp2Value3a", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 8 }}>
              <EditInput
                value={form.sp2Value3b}
                onChange={(v) => setField("sp2Value3b", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 9 }}>
              <EditInput
                value={form.sp2Value4a}
                onChange={(v) => setField("sp2Value4a", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 10 }}>
              <EditInput
                value={form.sp2Value4b}
                onChange={(v) => setField("sp2Value4b", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 11 }}>
              <EditInput
                value={form.sp2Value5}
                onChange={(v) => setField("sp2Value5", v)}
                disabled={!form.sp2UseChk}
                className="fcEditSpInput"
              />
            </div>
          </div>
        </div>

        <div className="f2EditBlock fcEditEtcBlock">
          <div className="fcEditDryerGrid" role="group" aria-label="乾燥機">
            <div className="fcEditSpHead" style={{ gridColumn: "1 / 4" }}>
              乾燥機
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 1 }}>
              温度
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 2 }}>
              投入厚
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 3 }}>
              速度
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 1 }}>
              <EditInput
                value={form.etcValue1a}
                onChange={(v) => setField("etcValue1a", v)}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 2 }}>
              <EditInput
                value={form.etcValue1b}
                onChange={(v) => setField("etcValue1b", v)}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 3 }}>
              <EditInput
                value={form.etcValue1c}
                onChange={(v) => setField("etcValue1c", v)}
                className="fcEditSpInput"
              />
            </div>
          </div>

          <div className="fcEditColorGrid" role="group" aria-label="色彩選別機調整">
            <div className="fcEditSpHead" style={{ gridColumn: "1 / 6" }}>
              色彩選別機調整
            </div>
            <div className="fcEditColorLabel" style={{ gridColumn: 1, gridRow: 2 }}>
              上
            </div>
            <div className="fcEditColorLabel" style={{ gridColumn: 1, gridRow: 3 }}>
              下
            </div>
            <div className="fcEditColorValue" style={{ gridColumn: "2 / 4", gridRow: 2 }}>
              <EditInput
                value={form.etcValue2a}
                onChange={(v) => setField("etcValue2a", v)}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditColorValue" style={{ gridColumn: "2 / 4", gridRow: 3 }}>
              <EditInput
                value={form.etcValue2b}
                onChange={(v) => setField("etcValue2b", v)}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: "4 / 6", gridRow: 2 }}>
              投入量
            </div>
            <div className="fcEditColorValue" style={{ gridColumn: 4, gridRow: 3 }}>
              <EditInput
                value={form.etcValue2c}
                onChange={(v) => setField("etcValue2c", v)}
                className="fcEditSpInput"
              />
            </div>
            <div className="fcEditColorValue" style={{ gridColumn: 5, gridRow: 3 }}>
              <EditInput
                value={form.etcValue2d}
                onChange={(v) => setField("etcValue2d", v)}
                className="fcEditSpInput"
              />
            </div>
          </div>

          <div className="fcEditCutGrid" role="group" aria-label="切断網目">
            <div className="fcEditCutChkRow" style={{ gridColumn: 1 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.etcUseChk3a}
                  onChange={(e) => setField("etcUseChk3a", e.target.checked)}
                />
                HA300
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.etcUseChk3b}
                  onChange={(e) => setField("etcUseChk3b", e.target.checked)}
                />
                横山式
              </label>
            </div>
            <div className="fcEditSpSubHead" style={{ gridColumn: 1, gridRow: 2 }}>
              切断網目
            </div>
            <div className="fcEditSpValue" style={{ gridColumn: 1, gridRow: 3 }}>
              <EditInput
                value={form.etcValue3}
                onChange={(v) => setField("etcValue3", v)}
                className="fcEditSpInput"
              />
            </div>
          </div>

          <div className="fcEditRemarksGrid" role="group" aria-label="備考">
            <div className="fcEditSpHead" style={{ gridColumn: 1 }}>
              備考
            </div>
            <div className="fcEditRemarksValue" style={{ gridColumn: 1, gridRow: 2 }}>
              <input
                type="text"
                className="fcEditRemarksInput"
                value={form.finishRemarks}
                onChange={(e) => setField("finishRemarks", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </EditModalOverlay>
  );
}
