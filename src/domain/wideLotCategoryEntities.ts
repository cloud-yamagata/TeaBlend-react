/**
 * 【処理概要】
 *   列数の多いロットカテゴリ系（共通チェックリスト・仕上個別フィールド）のエンティティ定義。
 *
 * 【パラメータ仕様】
 *   `TeLotCategorysCommon.parse(r)` / `TeLotCategorysFinish.parse(r)` … API 1行 `Record<string, unknown>` を受けクラス化
 *
 * 【メンテナンス】
 *   `masterTableEntityModels.ts` の `MasterEntityCache` にキーが既にぶら下がっている。DB 列追加時は parse と型の両方を更新。
 */

import {
  asBoolOrNull,
  asInt,
  asIsoDateTimeStrOrNull,
  asStrOrNull
} from "./masterRowPrimitives";

export type TeLotCategorysCommonData = {
  lot_no: number;
  temperature: string | null;
  humidity: string | null;
  work_start_hh: string | null;
  work_start_mm: string | null;
  work_end_hh: string | null;
  work_end_mm: string | null;
  work_before_cleaning_start_hh: string | null;
  work_before_cleaning_start_mm: string | null;
  work_before_cleaning_end_hh: string | null;
  work_before_cleaning_end_mm: string | null;
  work_end_cleaning_start_hh: string | null;
  work_end_cleaning_start_mm: string | null;
  work_end_cleaning_end_hh: string | null;
  work_end_cleaning_end_mm: string | null;
  work_before_cleaning_chk: boolean | null;
  work_after_cleaning_chk: boolean | null;
  device_chk: boolean | null;
  operation_chk: boolean | null;
  rest_chk: boolean | null;
  magnet_cleaning_chk: boolean | null;
  use_device_unit1_chk: boolean | null;
  use_device_unit2_chk: boolean | null;
  use_device_unit3_chk: boolean | null;
  packing_case1_chk: boolean | null;
  packing_case2_chk: boolean | null;
  remarks: string | null;
  update_time: string | null;
};

export class TeLotCategorysCommon {
  private constructor(readonly data: TeLotCategorysCommonData) {}
  static parse(r: Record<string, unknown>): TeLotCategorysCommon {
    return new TeLotCategorysCommon({
      lot_no: asInt(r.lot_no),
      temperature: asStrOrNull(r.temperature),
      humidity: asStrOrNull(r.humidity),
      work_start_hh: asStrOrNull(r.work_start_hh),
      work_start_mm: asStrOrNull(r.work_start_mm),
      work_end_hh: asStrOrNull(r.work_end_hh),
      work_end_mm: asStrOrNull(r.work_end_mm),
      work_before_cleaning_start_hh: asStrOrNull(r.work_before_cleaning_start_hh),
      work_before_cleaning_start_mm: asStrOrNull(r.work_before_cleaning_start_mm),
      work_before_cleaning_end_hh: asStrOrNull(r.work_before_cleaning_end_hh),
      work_before_cleaning_end_mm: asStrOrNull(r.work_before_cleaning_end_mm),
      work_end_cleaning_start_hh: asStrOrNull(r.work_end_cleaning_start_hh),
      work_end_cleaning_start_mm: asStrOrNull(r.work_end_cleaning_start_mm),
      work_end_cleaning_end_hh: asStrOrNull(r.work_end_cleaning_end_hh),
      work_end_cleaning_end_mm: asStrOrNull(r.work_end_cleaning_end_mm),
      work_before_cleaning_chk: asBoolOrNull(r.work_before_cleaning_chk),
      work_after_cleaning_chk: asBoolOrNull(r.work_after_cleaning_chk),
      device_chk: asBoolOrNull(r.device_chk),
      operation_chk: asBoolOrNull(r.operation_chk),
      rest_chk: asBoolOrNull(r.rest_chk),
      magnet_cleaning_chk: asBoolOrNull(r.magnet_cleaning_chk),
      use_device_unit1_chk: asBoolOrNull(r.use_device_unit1_chk),
      use_device_unit2_chk: asBoolOrNull(r.use_device_unit2_chk),
      use_device_unit3_chk: asBoolOrNull(r.use_device_unit3_chk),
      packing_case1_chk: asBoolOrNull(r.packing_case1_chk),
      packing_case2_chk: asBoolOrNull(r.packing_case2_chk),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeLotCategorysFinishData = {
  lot_no: number;
  sp1_use_chk: boolean | null;
  sp1_value_1: string | null;
  sp1_value_2a: string | null;
  sp1_value_2b: string | null;
  sp1_value_2c: string | null;
  sp1_value_3a: string | null;
  sp1_value_3b: string | null;
  sp1_value_4: string | null;
  sp1_value_5: string | null;
  sp1_value_6a: string | null;
  sp1_value_6b: string | null;
  sp2_use_chk: boolean | null;
  sp2_value_1: string | null;
  sp2_value_2a: string | null;
  sp2_value_2b: string | null;
  sp2_value_2c: string | null;
  sp2_value_2d: string | null;
  sp2_value_3a: string | null;
  sp2_value_3b: string | null;
  sp2_value_4a: string | null;
  sp2_value_4b: string | null;
  sp2_value_5: string | null;
  etc_value_1a: string | null;
  etc_value_1b: string | null;
  etc_value_1c: string | null;
  etc_value_2a: string | null;
  etc_value_2b: string | null;
  etc_value_2c: string | null;
  etc_value_2d: string | null;
  etc_use_chk3a: boolean | null;
  etc_use_chk3b: boolean | null;
  etc_value_3: string | null;
  pickup1_name: string | null;
  pickup1_weight: string | null;
  pickup1_number: string | null;
  pickup1_fraction: string | null;
  pickup2_name: string | null;
  pickup2_weight: string | null;
  pickup2_number: string | null;
  pickup2_fraction: string | null;
  pickup3_name: string | null;
  pickup3_weight: string | null;
  pickup3_number: string | null;
  pickup3_fraction: string | null;
  pickup4_name: string | null;
  pickup4_weight: string | null;
  pickup4_number: string | null;
  pickup4_fraction: string | null;
  remarks: string | null;
  update_time: string | null;
};

export class TeLotCategorysFinish {
  private constructor(readonly data: TeLotCategorysFinishData) {}
  static parse(r: Record<string, unknown>): TeLotCategorysFinish {
    return new TeLotCategorysFinish({
      lot_no: asInt(r.lot_no),
      sp1_use_chk: asBoolOrNull(r.sp1_use_chk),
      sp1_value_1: asStrOrNull(r.sp1_value_1),
      sp1_value_2a: asStrOrNull(r.sp1_value_2a),
      sp1_value_2b: asStrOrNull(r.sp1_value_2b),
      sp1_value_2c: asStrOrNull(r.sp1_value_2c),
      sp1_value_3a: asStrOrNull(r.sp1_value_3a),
      sp1_value_3b: asStrOrNull(r.sp1_value_3b),
      sp1_value_4: asStrOrNull(r.sp1_value_4),
      sp1_value_5: asStrOrNull(r.sp1_value_5),
      sp1_value_6a: asStrOrNull(r.sp1_value_6a),
      sp1_value_6b: asStrOrNull(r.sp1_value_6b),
      sp2_use_chk: asBoolOrNull(r.sp2_use_chk),
      sp2_value_1: asStrOrNull(r.sp2_value_1),
      sp2_value_2a: asStrOrNull(r.sp2_value_2a),
      sp2_value_2b: asStrOrNull(r.sp2_value_2b),
      sp2_value_2c: asStrOrNull(r.sp2_value_2c),
      sp2_value_2d: asStrOrNull(r.sp2_value_2d),
      sp2_value_3a: asStrOrNull(r.sp2_value_3a),
      sp2_value_3b: asStrOrNull(r.sp2_value_3b),
      sp2_value_4a: asStrOrNull(r.sp2_value_4a),
      sp2_value_4b: asStrOrNull(r.sp2_value_4b),
      sp2_value_5: asStrOrNull(r.sp2_value_5),
      etc_value_1a: asStrOrNull(r.etc_value_1a),
      etc_value_1b: asStrOrNull(r.etc_value_1b),
      etc_value_1c: asStrOrNull(r.etc_value_1c),
      etc_value_2a: asStrOrNull(r.etc_value_2a),
      etc_value_2b: asStrOrNull(r.etc_value_2b),
      etc_value_2c: asStrOrNull(r.etc_value_2c),
      etc_value_2d: asStrOrNull(r.etc_value_2d),
      etc_use_chk3a: asBoolOrNull(r.etc_use_chk3a),
      etc_use_chk3b: asBoolOrNull(r.etc_use_chk3b),
      etc_value_3: asStrOrNull(r.etc_value_3),
      pickup1_name: asStrOrNull(r.pickup1_name),
      pickup1_weight: asStrOrNull(r.pickup1_weight),
      pickup1_number: asStrOrNull(r.pickup1_number),
      pickup1_fraction: asStrOrNull(r.pickup1_fraction),
      pickup2_name: asStrOrNull(r.pickup2_name),
      pickup2_weight: asStrOrNull(r.pickup2_weight),
      pickup2_number: asStrOrNull(r.pickup2_number),
      pickup2_fraction: asStrOrNull(r.pickup2_fraction),
      pickup3_name: asStrOrNull(r.pickup3_name),
      pickup3_weight: asStrOrNull(r.pickup3_weight),
      pickup3_number: asStrOrNull(r.pickup3_number),
      pickup3_fraction: asStrOrNull(r.pickup3_fraction),
      pickup4_name: asStrOrNull(r.pickup4_name),
      pickup4_weight: asStrOrNull(r.pickup4_weight),
      pickup4_number: asStrOrNull(r.pickup4_number),
      pickup4_fraction: asStrOrNull(r.pickup4_fraction),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}
