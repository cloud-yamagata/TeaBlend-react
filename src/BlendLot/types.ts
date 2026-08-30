/**
 * ブレンドロット（te_blend_lot）のフロント型。
 * `lotPartInfo` は API が JSON 文字列／オブジェクト混在しうるため `unknown`。
 */
export type TeBlendLot = {
  productNo: number | null;
  lotStatus: string | null;
  organicClass: string | null;
  workDate: string | null;
  itemNo: number | null;
  itemName: string | null;
  unitWeight: number | null;
  lotPartInfo: unknown;
  remarks: string | null;
};

/** ブレンドロット登録一覧行 */
export type BlendLotListRow = {
  id: string;
  workDate: string | null;
  lotStatus: string;
  lotStatusCode: string;
  productNo: number | null;
  itemNo: number | null;
  organicClassCode: string;
  organicName: string;
  itemName: string;
  unitWeight: number | null;
  remarks: string;
};

/** ロット状態チェック（1=仕掛, 2=完了, 3=確定） */
export type BlendLotStatusCheck = {
  active: boolean;
  complete: boolean;
  confirm: boolean;
};

export type BlendLotOrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 検索ボタン押下時に確定する条件 */
export type BlendLotAppliedSearchCriteria = {
  lotStatusCheck: BlendLotStatusCheck;
  organicCheck: BlendLotOrganicCheck;
  workDate: string | null;
  itemNo: number | null;
  itemNameQuery: string;
};
