/**
 * 【処理概要】
 *   月次計画（te_monthly_plan）と商品マスタ（tr_item）のフロント型。
 *
 * 【パラメータ仕様】
 *   - `TeMonthlyPlan.lotPartInfo` … API が JSON 文字列／オブジェクト混在しうるため `unknown`
 */

export type TeMonthlyPlan = {
  planNo: number | null;
  year: number | null;
  month: number | null;
  processType: string | null;
  lotName: string | null;
  workDate: string | null;
  workTime: string | null;
  unitWeight: number | null;
  itemNo: number | null;
  remarks: string | null;
  lotPartInfo: unknown;
};

export type TrItem = {
  itemNo: number | null;
  systemClass: string | null;
  organicClass: string | null;
  itemGroupNo: number | null;
  itemName: string | null;
  janCode: string | null;
  packageSize: number | null;
  displayOrder: number | null;
  display: string | null;
  remarks: string | null;
};
