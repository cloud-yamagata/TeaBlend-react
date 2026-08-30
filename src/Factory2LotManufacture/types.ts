/** 第二工場ロット製造登録一覧行（旧 CroudeTea MainWindow DataGrid 相当） */
export type Factory2LotRow = {
  id: string;
  workDate: string | null;
  lotNo: number | null;
  /** 工程区分コード（tr_constant.process_type） */
  processTypeCode: string;
  processTypeName: string | null;
  productNo: number | null;
  /** ロット状態コード（tr_constant.lot_status） */
  lotStatusCode: string;
  lotStatusName: string | null;
  lotName: string | null;
  makeYear: number | null;
  itemName: string | null;
  count: number | null;
  /** 有機区分コード（te_lot_base.organic_class → tr_constant.grade 等） */
  organicClassCode: string;
  organicClass: string | null;
  unitWeight: number | null;
  unitNumber: number | null;
  fractionWeight: number | null;
  remarks: string | null;
};

export type Factory2ProcessFilter = "02" | "03" | "04" | "05";

/** 1段目登録メニュー用（未選択 = ""） */
export type Factory2LotRegistProcessFilter = Factory2ProcessFilter | "";

/** ロット状態チェック（1=仕掛, 2=完了, 3=確定） */
export type Factory2LotStatusCheck = {
  active: boolean;
  complete: boolean;
  confirm: boolean;
};

export type Factory2ProcessCheck = Record<Factory2ProcessFilter, boolean>;

export type Factory2OrganicCheck = {
  organic: boolean;
  pesticideFree: boolean;
  general: boolean;
};

/** 検索ボタン押下時に確定する2段目の条件 */
export type Factory2AppliedSearchCriteria = {
  year: string | null;
  lotStatusCheck: Factory2LotStatusCheck;
  processCheck: Factory2ProcessCheck;
  organicCheck: Factory2OrganicCheck;
  workDate: string | null;
  itemNameQuery: string;
};
