/**
 * 配合個別情報登録画面（BlendCategorys EditWindow.xaml 相当）
 */
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { EditModalOverlay } from "../components/modal/EditModalOverlay";
import { useBusyTask } from "../ui/useBusyTask";
import { computeOverallJudge } from "./buildBlendCategoryEditForm";
import type { BlendCategoryEditFormData } from "./blendCategoryEditTypes";
import { upsertBlendCategoryAtom } from "./store";
import "../Factory2LotManufacture/factory2LotEditModal.css";
import "./blendCategoryEditModal.css";

type Props = {
  form: BlendCategoryEditFormData;
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

const trimOrNull = (value: string): string | null => {
  const t = value.trim();
  return t.length > 0 ? t : null;
};

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

export function BlendCategorysEditModal({ form: initialForm, onClose }: Props) {
  const upsert = useSetAtom(upsertBlendCategoryAtom);
  const runBusy = useBusyTask();
  const [form, setForm] = useState(initialForm);

  const overallJudge = useMemo(
    () => computeOverallJudge(form.sensualTestColor, form.sensualTestTaste, form.sensualTestAroma),
    [form.sensualTestColor, form.sensualTestTaste, form.sensualTestAroma]
  );

  const organicCode = form.organicClassCode.trim().toUpperCase();
  const processCode = form.processTypeCode.trim();

  const handleRegist = useCallback(() => {
    const ok = window.confirm(
      "登録内容に間違いがないか確認してください。登録を実行します。よろしいですか？"
    );
    if (!ok) return;

    void runBusy(async () => {
      const success = await upsert({
        lot_no: form.lotNo,
        sensual_test_color: trimOrNull(form.sensualTestColor),
        sensual_test_taste: trimOrNull(form.sensualTestTaste),
        sensual_test_aroma: trimOrNull(form.sensualTestAroma),
        remarks: trimOrNull(form.blendRemarks)
      });
      if (success) {
        onClose();
      }
    }, "登録中…");
  }, [form, onClose, runBusy, upsert]);

  return (
    <EditModalOverlay mode="view" onClose={onClose} className="bcEditOverlay">
      <div
        className="bcEditPanel modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bcEditTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="bcEditWindowTitle">配合個別情報登録画面</h2>
        <div className="bcEditToolbar f2EditToolbar">
          <span id="bcEditTitle" className="bcEditHeaderTitle">
            製造報告書（配合）
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

        <div className="f2EditBlock bcEditSensualRow">
          <div className="bcEditSensualBadge">官能検査</div>
          <div className="bcEditSensualGrid">
            <div className="bcEditSensualHeadRow">
              <LabelCell width={100} className="bcEditSensualHead">
                本品評価
              </LabelCell>
              <LabelCell width={100} className="bcEditSensualHead">
                水色
              </LabelCell>
              <LabelCell width={100} className="bcEditSensualHead">
                味
              </LabelCell>
              <LabelCell width={100} className="bcEditSensualHead">
                香
              </LabelCell>
              <LabelCell width={100} className="bcEditSensualHead">
                総合評価
              </LabelCell>
            </div>
            <div className="bcEditSensualDataRow">
              <ValueCell width={100}>
                <span className="bcEditSensualSheet">本シート</span>
              </ValueCell>
              <ValueCell width={100} className="bcEditSensualInputCell">
                <input
                  className="bcEditSensualInput"
                  type="text"
                  inputMode="decimal"
                  value={form.sensualTestColor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sensualTestColor: e.target.value }))
                  }
                />
              </ValueCell>
              <ValueCell width={100} className="bcEditSensualInputCell">
                <input
                  className="bcEditSensualInput"
                  type="text"
                  inputMode="decimal"
                  value={form.sensualTestTaste}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sensualTestTaste: e.target.value }))
                  }
                />
              </ValueCell>
              <ValueCell width={100} className="bcEditSensualInputCell">
                <input
                  className="bcEditSensualInput"
                  type="text"
                  inputMode="decimal"
                  value={form.sensualTestAroma}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sensualTestAroma: e.target.value }))
                  }
                />
              </ValueCell>
              <ValueCell width={100} align="right">
                <ReadonlyText value={overallJudge} align="right" />
              </ValueCell>
            </div>
            <div className="bcEditSensualSpacerRow">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="bcEditSensualSpacer" style={{ width: 100 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </EditModalOverlay>
  );
}
