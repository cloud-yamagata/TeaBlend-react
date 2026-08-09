/**
 * パッケージ製造報告書用マスタ（te_package_base_new / te_package_categorys_new）
 */
import {
  asBoolOrNull,
  asInt,
  asIntOrNull,
  asIsoDateStr,
  asJsonArrayOrNull,
  asStrOrNull
} from "./masterRowPrimitives";

export type TePackageLotPartInfo = {
  part_lot_no: number;
  out_quantity?: number;
  rem_quantity?: number;
  use_quantity?: number;
};

export type TePackageBaseNewData = {
  product_no: number;
  lot_status: string;
  organic_class: string;
  item_no: number;
  product_name: string;
  work_date: string;
  complete_quantity: number;
  sample_quantity: number;
  fail_quantity: number;
  use_tea_no: number | null;
  part_name: string | null;
  remarks: string | null;
  lot_part_info: TePackageLotPartInfo[] | null;
};

export class TePackageBaseNew {
  private constructor(readonly data: TePackageBaseNewData) {}
  static parse(r: Record<string, unknown>): TePackageBaseNew {
    return new TePackageBaseNew({
      product_no: asInt(r.product_no),
      lot_status: asStrOrNull(r.lot_status) ?? "",
      organic_class: asStrOrNull(r.organic_class) ?? "",
      item_no: asInt(r.item_no),
      product_name: asStrOrNull(r.product_name) ?? "",
      work_date: asIsoDateStr(r.work_date),
      complete_quantity: asInt(r.complete_quantity),
      sample_quantity: asInt(r.sample_quantity),
      fail_quantity: asInt(r.fail_quantity),
      use_tea_no: asIntOrNull(r.use_tea_no),
      part_name: asStrOrNull(r.part_name),
      remarks: asStrOrNull(r.remarks),
      lot_part_info: asJsonArrayOrNull(r.lot_part_info) as TePackageLotPartInfo[] | null
    });
  }
}

export type TePackageCategorysNewData = {
  product_no: number;
  temperature: string | null;
  humidity: string | null;
  packing_start_hh: string | null;
  packing_start_mm: string | null;
  packing_end_hh: string | null;
  packing_end_mm: string | null;
  work_before_cleaning_start_hh: string | null;
  work_before_cleaning_start_mm: string | null;
  work_before_cleaning_end_hh: string | null;
  work_before_cleaning_end_mm: string | null;
  work_end_cleaning_start_hh: string | null;
  work_end_cleaning_start_mm: string | null;
  work_end_cleaning_end_hh: string | null;
  work_end_cleaning_end_mm: string | null;
  hp500_no1_chk: boolean | null;
  hp500_no2_chk: boolean | null;
  fr2_chk: boolean | null;
  fpg_chk: boolean | null;
  uba_chk: boolean | null;
  lift_cleaning_before_chk: boolean | null;
  lift_cleaning_after_chk: boolean | null;
  lift_operation_before_chk: boolean | null;
  lift_operation_after_chk: boolean | null;
  lift_rem_before_chk: boolean | null;
  lift_rem_after_chk: boolean | null;
  packing_filter_before_chk: boolean | null;
  packing_filter_after_chk: boolean | null;
  packing_seal_before_chk: boolean | null;
  packing_seal_after_chk: boolean | null;
  packing_conveyor_before_chk: boolean | null;
  packing_conveyor_after_chk: boolean | null;
  packing_magnet_before_chk: boolean | null;
  packing_magnet_after_chk: boolean | null;
  packing_operation_before_chk: boolean | null;
  packing_operation_after_chk: boolean | null;
  packing_rem_before_chk: boolean | null;
  packing_rem_after_chk: boolean | null;
  tool_cleaning_before_chk: boolean | null;
  tool_cleaning_after_chk: boolean | null;
  uba3_cleaning_before_chk: boolean | null;
  uba3_cleaning_after_chk: boolean | null;
  weight_test_before_chk: string | null;
  weight_test_after_chk: string | null;
  residual_oxygen_am: string | null;
  residual_oxygen_pm: string | null;
  weight_no_1: string | null;
  weight_no_2: string | null;
  weight_no_3: string | null;
  weight_no_4: string | null;
  weight_no_5: string | null;
  weight_chk_1: string | null;
  weight_chk_2: string | null;
  weight_chk_3: string | null;
  weight_chk_4: string | null;
  weight_chk_5: string | null;
  remarks: string | null;
};

export class TePackageCategorysNew {
  private constructor(readonly data: TePackageCategorysNewData) {}
  static parse(r: Record<string, unknown>): TePackageCategorysNew {
    return new TePackageCategorysNew({
      product_no: asInt(r.product_no),
      temperature: asStrOrNull(r.temperature),
      humidity: asStrOrNull(r.humidity),
      packing_start_hh: asStrOrNull(r.packing_start_hh),
      packing_start_mm: asStrOrNull(r.packing_start_mm),
      packing_end_hh: asStrOrNull(r.packing_end_hh),
      packing_end_mm: asStrOrNull(r.packing_end_mm),
      work_before_cleaning_start_hh: asStrOrNull(r.work_before_cleaning_start_hh),
      work_before_cleaning_start_mm: asStrOrNull(r.work_before_cleaning_start_mm),
      work_before_cleaning_end_hh: asStrOrNull(r.work_before_cleaning_end_hh),
      work_before_cleaning_end_mm: asStrOrNull(r.work_before_cleaning_end_mm),
      work_end_cleaning_start_hh: asStrOrNull(r.work_end_cleaning_start_hh),
      work_end_cleaning_start_mm: asStrOrNull(r.work_end_cleaning_start_mm),
      work_end_cleaning_end_hh: asStrOrNull(r.work_end_cleaning_end_hh),
      work_end_cleaning_end_mm: asStrOrNull(r.work_end_cleaning_end_mm),
      hp500_no1_chk: asBoolOrNull(r.hp500_no1_chk),
      hp500_no2_chk: asBoolOrNull(r.hp500_no2_chk),
      fr2_chk: asBoolOrNull(r.fr2_chk),
      fpg_chk: asBoolOrNull(r.fpg_chk),
      uba_chk: asBoolOrNull(r.uba_chk),
      lift_cleaning_before_chk: asBoolOrNull(r.lift_cleaning_before_chk),
      lift_cleaning_after_chk: asBoolOrNull(r.lift_cleaning_after_chk),
      lift_operation_before_chk: asBoolOrNull(r.lift_operation_before_chk),
      lift_operation_after_chk: asBoolOrNull(r.lift_operation_after_chk),
      lift_rem_before_chk: asBoolOrNull(r.lift_rem_before_chk),
      lift_rem_after_chk: asBoolOrNull(r.lift_rem_after_chk),
      packing_filter_before_chk: asBoolOrNull(r.packing_filter_before_chk),
      packing_filter_after_chk: asBoolOrNull(r.packing_filter_after_chk),
      packing_seal_before_chk: asBoolOrNull(r.packing_seal_before_chk),
      packing_seal_after_chk: asBoolOrNull(r.packing_seal_after_chk),
      packing_conveyor_before_chk: asBoolOrNull(r.packing_conveyor_before_chk),
      packing_conveyor_after_chk: asBoolOrNull(r.packing_conveyor_after_chk),
      packing_magnet_before_chk: asBoolOrNull(r.packing_magnet_before_chk),
      packing_magnet_after_chk: asBoolOrNull(r.packing_magnet_after_chk),
      packing_operation_before_chk: asBoolOrNull(r.packing_operation_before_chk),
      packing_operation_after_chk: asBoolOrNull(r.packing_operation_after_chk),
      packing_rem_before_chk: asBoolOrNull(r.packing_rem_before_chk),
      packing_rem_after_chk: asBoolOrNull(r.packing_rem_after_chk),
      tool_cleaning_before_chk: asBoolOrNull(r.tool_cleaning_before_chk),
      tool_cleaning_after_chk: asBoolOrNull(r.tool_cleaning_after_chk),
      uba3_cleaning_before_chk: asBoolOrNull(r.uba3_cleaning_before_chk),
      uba3_cleaning_after_chk: asBoolOrNull(r.uba3_cleaning_after_chk),
      weight_test_before_chk: asStrOrNull(r.weight_test_before_chk),
      weight_test_after_chk: asStrOrNull(r.weight_test_after_chk),
      residual_oxygen_am: asStrOrNull(r.residual_oxygen_am),
      residual_oxygen_pm: asStrOrNull(r.residual_oxygen_pm),
      weight_no_1: asStrOrNull(r.weight_no_1),
      weight_no_2: asStrOrNull(r.weight_no_2),
      weight_no_3: asStrOrNull(r.weight_no_3),
      weight_no_4: asStrOrNull(r.weight_no_4),
      weight_no_5: asStrOrNull(r.weight_no_5),
      weight_chk_1: asStrOrNull(r.weight_chk_1),
      weight_chk_2: asStrOrNull(r.weight_chk_2),
      weight_chk_3: asStrOrNull(r.weight_chk_3),
      weight_chk_4: asStrOrNull(r.weight_chk_4),
      weight_chk_5: asStrOrNull(r.weight_chk_5),
      remarks: asStrOrNull(r.remarks)
    });
  }
}
