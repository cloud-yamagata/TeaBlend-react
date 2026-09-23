/**
 * 生産者別の格付・品種自動補正（WPF StoreDetail.StoreSet 相当）
 */
import type { PurchaseTtransferEditForm } from "./purchaseTtransferEditForm";

const applyToyoryokuen = (form: PurchaseTtransferEditForm): PurchaseTtransferEditForm => {
  let grade = "有機";
  let variety = form.variety;
  switch (form.fieldNo.trim()) {
    case "2":
      grade = "無農薬";
      variety = "ﾔﾌﾞｷﾀ";
      break;
    case "3":
    case "4":
    case "5":
    case "12":
      variety = "ﾔﾌﾞｷﾀ";
      break;
    case "6":
    case "7":
      variety = "ﾔﾏﾅﾐ";
      break;
    case "8":
      variety = "ﾐﾅﾐｻﾔｶ";
      break;
    case "9":
    case "10":
      variety = "在来";
      break;
    case "11":
    case "17":
      variety = "ｻｴﾐﾄﾞﾘ";
      break;
    case "13":
    case "16":
      variety = "ﾒｲﾘｮｸ";
      break;
    case "14":
      variety = "ﾐﾅﾐｶｵﾘ";
      break;
    default:
      break;
  }
  return { ...form, grade, variety };
};

const applyZenkaya = (form: PurchaseTtransferEditForm): PurchaseTtransferEditForm => {
  let variety = form.variety;
  switch (form.fieldNo.trim()) {
    case "1":
      variety = "ｵｸﾐﾄﾞﾘ";
      break;
    case "2":
      variety = "ｻｴﾐﾄﾞﾘ";
      break;
    case "3":
      variety = "ﾔﾌﾞｷﾀ";
      break;
    case "4":
      variety = "ｱｻﾂﾕ";
      break;
    default:
      break;
  }
  return { ...form, grade: "無農薬", variety };
};

const applyTsutsumiishiChaen = (form: PurchaseTtransferEditForm): PurchaseTtransferEditForm => {
  let variety = form.variety;
  if (form.fieldNo.trim() === "2･14") {
    variety = "ｵｸﾕﾀｶ";
  }
  return { ...form, grade: "有機", variety };
};

const applyTsutsumiishiSeicha = (form: PurchaseTtransferEditForm): PurchaseTtransferEditForm => {
  let variety = form.variety;
  switch (form.fieldNo.trim()) {
    case "7":
      variety = "ｵｸﾕﾀｶ";
      break;
    case "8":
      variety = "ﾕﾀｶﾐﾄﾞﾘ";
      break;
    case "9":
      variety = "ｱｻﾉｶ";
      break;
    case "10":
    case "12":
      variety = "ﾔﾌﾞｷﾀ";
      break;
    case "11":
      variety = "ﾔﾏｶｲ";
      break;
    case "13":
      variety = "ｻｴﾐﾄﾞﾘ";
      break;
    default:
      break;
  }
  return { ...form, grade: "有機", variety };
};

/** 登録・変更時に生産者別の既定格付・品種を上書きする */
export function applyPurchaseTeaStoreSet(form: PurchaseTtransferEditForm): PurchaseTtransferEditForm {
  const producer = form.producer.trim();
  if (producer === "豊緑園") return applyToyoryokuen(form);
  if (producer === "善家") return applyZenkaya(form);
  if (producer === "堤石茶園" || producer === "堤石和春") return applyTsutsumiishiChaen(form);
  if (producer === "堤石製茶" || producer === "堤石正男") return applyTsutsumiishiSeicha(form);
  return form;
}
