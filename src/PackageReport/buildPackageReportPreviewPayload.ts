import type { PackageLotEditFormData, PackageLotEditTimeHm, PackageLotEditTimeRange } from "./packageLotEditTypes";
import type { PackageReportPreviewPayload, PackageReportWeightPayload } from "./reportHelperTypes";

const formatTime = (value: PackageLotEditTimeHm): string => {
  const hh = value.hh.trim();
  const mm = value.mm.trim();
  if (!hh && !mm) return "";
  return `${String(Number(hh || "0")).padStart(2, "0")}:${String(Number(mm || "0")).padStart(2, "0")}`;
};

const formatRange = (value: PackageLotEditTimeRange) => ({
  start: formatTime(value.start),
  end: formatTime(value.end)
});

const buildWeights = (form: PackageLotEditFormData): PackageReportWeightPayload[] =>
  [
    { no: form.weightNo1.trim(), value: form.weightChk1.trim() },
    { no: form.weightNo2.trim(), value: form.weightChk2.trim() },
    { no: form.weightNo3.trim(), value: form.weightChk3.trim() },
    { no: form.weightNo4.trim(), value: form.weightChk4.trim() },
    { no: form.weightNo5.trim(), value: form.weightChk5.trim() }
  ].filter((row) => row.no !== "" || row.value !== "");

export function buildPackageReportPreviewPayload(form: PackageLotEditFormData): PackageReportPreviewPayload {
  return {
    productNo: form.productNo.trim(),
    organicClass: form.organicClass.trim(),
    itemNo: form.itemNo.trim(),
    productName: form.productName.trim(),
    workDate: form.workDate.trim(),
    completeQuantity: form.completeQuantity.trim(),
    sampleQuantity: form.sampleQuantity.trim(),
    failQuantity: form.failQuantity.trim(),
    gradeNo: form.gradeNo.trim(),
    temperature: form.temperature.trim(),
    humidity: form.humidity.trim(),
    useTea: {
      itemNo: form.useTeaItemNo1.trim(),
      itemName: form.useTeaItemName1.trim() || form.partName.trim()
    },
    lotRows: [
      {
        rowNo: 1,
        partLotNo: form.partLotNo1.trim(),
        outQuantity: form.outQuantity1.trim(),
        useQuantity: form.useQuantity1.trim(),
        remQuantity: form.remQuantity1.trim()
      },
      {
        rowNo: 2,
        partLotNo: form.partLotNo2.trim(),
        outQuantity: form.outQuantity2.trim(),
        useQuantity: form.useQuantity2.trim(),
        remQuantity: form.remQuantity2.trim()
      },
      {
        rowNo: 3,
        partLotNo: form.partLotNo3.trim(),
        outQuantity: form.outQuantity3.trim(),
        useQuantity: form.useQuantity3.trim(),
        remQuantity: form.remQuantity3.trim()
      }
    ],
    packingTime: {
      start: formatTime(form.packingStart),
      end: formatTime(form.packingEnd)
    },
    cleaningTime: {
      before: formatRange(form.cleaningBefore),
      after: formatRange(form.cleaningAfter)
    },
    machineChecks: {
      hp500No1Chk: form.hp500No1Chk,
      hp500No2Chk: form.hp500No2Chk,
      fr2Chk: form.fr2Chk,
      fpgChk: form.fpgChk,
      ubaChk: form.ubaChk
    },
    beforeAfterChecks: {
      liftCleaning: form.liftCleaning,
      liftOperation: form.liftOperation,
      liftRem: form.liftRem,
      packingFilter: form.packingFilter,
      packingSeal: form.packingSeal,
      packingConveyor: form.packingConveyor,
      packingMagnet: form.packingMagnet,
      packingOperation: form.packingOperation,
      packingRem: form.packingRem,
      toolCleaning: form.toolCleaning,
      uba3Cleaning: form.uba3Cleaning
    },
    weightTest: {
      before: form.weightTestBefore.trim(),
      after: form.weightTestAfter.trim()
    },
    residualOxygen: {
      am: form.residualOxygenAm.trim(),
      pm: form.residualOxygenPm.trim()
    },
    weights: buildWeights(form),
    remarks: form.categorysRemarks.trim()
  };
}
