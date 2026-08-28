/**
 * 【処理概要】
 *   `GENERIC_MASTER_TABLE_SPECS` に対応する DB 行を、テーブルごとのクラス（`*.parse`）へマッピングし、`MasterEntityCache` を組む。
 *   各クラスは `readonly data` を持ち、画面からは `.data.xxx` で列にアクセスする想定。
 *
 * 【パラメータ仕様】
 *   - `parseMasterRowsForTable(id, rows)` … `GenericMasterTableId` と生行配列から型付き配列へ
 *   - `mergeParsedTable(cache, id, rows)` … immutable にキャッシュを更新
 *   - `emptyMasterEntityCache()` … 空のキャッシュ生成
 *
 * 【メンテナンス】
 *   - 新テーブルを足す手順: (1) `repositories/masterTableRepository.ts` の `GENERIC_MASTER_TABLE_SPECS` に URL 追加
 *     (2) 本ファイルに class + `MasterEntityCache` キー + `PARSERS` 追記 (3) FastAPI `main.py` で router 有効化
 *   - 1テーブルあたりのクラスは冗長だが、列名タイプミスをコンパイル時に寄せられる。
 */

import type { GenericMasterTableId } from "../repositories/masterTableRepository";
import {
  asBoolOrNull,
  asFiniteNumber,
  asFiniteNumberOrNull,
  asInt,
  asIntOrNull,
  asIsoDateStr,
  asIsoDateTimeStrOrNull,
  asStrOrNull
} from "./masterRowPrimitives";
import { TePackageBaseNew, TePackageCategorysNew } from "./packageReportEntities";
import { TeLotCategorysCommon, TeLotCategorysFinish } from "./wideLotCategoryEntities";

// --- 番号系（serial + create_date） ---

export type SerialDateData = { serial_no: number; create_date: string | null };
export class BlendNo {
  private constructor(readonly data: SerialDateData) {}
  static parse(r: Record<string, unknown>): BlendNo {
    return new BlendNo({
      serial_no: asInt(r.serial_no),
      create_date: asIsoDateTimeStrOrNull(r.create_date)
    });
  }
}
export class BulkNo {
  private constructor(readonly data: SerialDateData) {}
  static parse(r: Record<string, unknown>): BulkNo {
    return new BulkNo({
      serial_no: asInt(r.serial_no),
      create_date: asIsoDateTimeStrOrNull(r.create_date)
    });
  }
}

export class FinishNo {
  private constructor(readonly data: SerialDateData) {}
  static parse(r: Record<string, unknown>): FinishNo {
    return new FinishNo({
      serial_no: asInt(r.serial_no),
      create_date: asIsoDateTimeStrOrNull(r.create_date)
    });
  }
}
export class FirepanNo {
  private constructor(readonly data: SerialDateData) {}
  static parse(r: Record<string, unknown>): FirepanNo {
    return new FirepanNo({
      serial_no: asInt(r.serial_no),
      create_date: asIsoDateTimeStrOrNull(r.create_date)
    });
  }
}

// --- 工場・ロット他 ---

export type TeFactory1ResultData = {
  lot_no: string;
  year: number;
  work_date: string;
  variety: string;
  tea_life: string;
  grade: string;
  tea_rank: string;
  field_no: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  target: string | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeFactory1Result {
  private constructor(readonly data: TeFactory1ResultData) {}
  static parse(r: Record<string, unknown>): TeFactory1Result {
    return new TeFactory1Result({
      lot_no: asStrOrNull(r.lot_no) ?? "",
      year: asInt(r.year),
      work_date: asIsoDateStr(r.work_date),
      variety: asStrOrNull(r.variety) ?? "",
      tea_life: asStrOrNull(r.tea_life) ?? "",
      grade: asStrOrNull(r.grade) ?? "",
      tea_rank: asStrOrNull(r.tea_rank) ?? "",
      field_no: asStrOrNull(r.field_no) ?? "",
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      target: asStrOrNull(r.target),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeFactory1TransferData = {
  lot_no: string;
  transfer_date: string;
  transfer: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  remarks: string | null;
  update_time: string | null;
};
export class TeFactory1Transfer {
  private constructor(readonly data: TeFactory1TransferData) {}
  static parse(r: Record<string, unknown>): TeFactory1Transfer {
    return new TeFactory1Transfer({
      lot_no: asStrOrNull(r.lot_no) ?? "",
      transfer_date: asIsoDateStr(r.transfer_date),
      transfer: asStrOrNull(r.transfer) ?? "",
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeFactory2ResultData = {
  work_date: string;
  use_tea_no: number;
  make_year: number;
  count: number;
  quantity: number;
  result_type: string;
  remarks: string | null;
};
export class TeFactory2Result {
  private constructor(readonly data: TeFactory2ResultData) {}
  static parse(r: Record<string, unknown>): TeFactory2Result {
    return new TeFactory2Result({
      work_date: asIsoDateStr(r.work_date),
      use_tea_no: asInt(r.use_tea_no),
      make_year: asInt(r.make_year),
      count: asInt(r.count),
      quantity: asFiniteNumber(r.quantity),
      result_type: asStrOrNull(r.result_type) ?? "",
      remarks: asStrOrNull(r.remarks)
    });
  }
}

/** 第二工場ロット在庫（vi_factory2_stock ビュー） */
export type ViFactory2StockData = {
  lot_no: number;
  process_type: string;
  process_type_name: string | null;
  product_no: number;
  product_date: string | null;
  item_name: string | null;
  lot_name: string | null;
  organic_class: string | null;
  make_year: string | null;
  count: string | null;
  product_quantity: number | null;
  factory2_stock: number | null;
};

export class ViFactory2Stock {
  private constructor(readonly data: ViFactory2StockData) {}

  static fromData(data: ViFactory2StockData): ViFactory2Stock {
    return new ViFactory2Stock({ ...data });
  }

  static parse(r: Record<string, unknown>): ViFactory2Stock {
    return new ViFactory2Stock({
      lot_no: asInt(r.lot_no),
      process_type: asStrOrNull(r.process_type) ?? "",
      process_type_name: asStrOrNull(r.process_type_name),
      product_no: asInt(r.product_no),
      product_date: (() => {
        const pd = asIsoDateTimeStrOrNull(r.product_date);
        if (!pd) return null;
        return pd.length >= 10 ? pd.slice(0, 10) : pd;
      })(),
      item_name: asStrOrNull(r.item_name),
      lot_name: asStrOrNull(r.lot_name),
      organic_class: asStrOrNull(r.organic_class),
      make_year: asStrOrNull(r.make_year),
      count: asStrOrNull(r.count),
      product_quantity: asFiniteNumberOrNull(r.product_quantity),
      factory2_stock: asFiniteNumberOrNull(r.factory2_stock)
    });
  }
}

/** 在庫重量 > 0 の行のみ（API 側でも絞るがキャッシュ確定時にも適用） */
export function parseViFactory2StockRows(rows: Record<string, unknown>[]): ViFactory2Stock[] {
  return rows
    .map((r) => ViFactory2Stock.parse(r))
    .filter((e) => (e.data.factory2_stock ?? 0) > 0);
}

/** 第3工場仕上茶在庫（vi_factory3_stoc ビュー） */
export type ViFactory3StocData = {
  item_no: number;
  item_name: string | null;
  product_no: number;
  stoc_quantity: number | null;
};

export class ViFactory3Stoc {
  private constructor(readonly data: ViFactory3StocData) {}

  static fromData(data: ViFactory3StocData): ViFactory3Stoc {
    return new ViFactory3Stoc({ ...data });
  }

  static parse(r: Record<string, unknown>): ViFactory3Stoc {
    return new ViFactory3Stoc({
      item_no: asInt(r.item_no),
      item_name: asStrOrNull(r.item_name),
      product_no: asInt(r.product_no),
      stoc_quantity: asFiniteNumberOrNull(r.stoc_quantity)
    });
  }
}

export type TeFactory3ResultData = {
  work_date: string;
  item_no: number;
  quantity: number;
  sample_quantity: number;
  use_tea_no: number;
  use_quantity: number;
  result_type: string;
  remarks: string | null;
};
export class TeFactory3Result {
  private constructor(readonly data: TeFactory3ResultData) {}
  static parse(r: Record<string, unknown>): TeFactory3Result {
    return new TeFactory3Result({
      work_date: asIsoDateStr(r.work_date),
      item_no: asInt(r.item_no),
      quantity: asInt(r.quantity),
      sample_quantity: asInt(r.sample_quantity),
      use_tea_no: asInt(r.use_tea_no),
      use_quantity: asFiniteNumber(r.use_quantity),
      result_type: asStrOrNull(r.result_type) ?? "",
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export type TeFactory3StockData = {
  stock_date: string;
  use_tea_no: number;
  make_year: number;
  count: number;
  stock_quantity: number;
  stock_type: string;
  remarks: string | null;
};
export class TeFactory3Stock {
  private constructor(readonly data: TeFactory3StockData) {}
  static parse(r: Record<string, unknown>): TeFactory3Stock {
    return new TeFactory3Stock({
      stock_date: asIsoDateStr(r.stock_date),
      use_tea_no: asInt(r.use_tea_no),
      make_year: asInt(r.make_year),
      count: asInt(r.count),
      stock_quantity: asFiniteNumber(r.stock_quantity),
      stock_type: asStrOrNull(r.stock_type) ?? "",
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export type TeGradeData = { grade_no: number; lot_no: number };
export class TeGrade {
  private constructor(readonly data: TeGradeData) {}
  static parse(r: Record<string, unknown>): TeGrade {
    return new TeGrade({ grade_no: asInt(r.grade_no), lot_no: asInt(r.lot_no) });
  }
}

export type TeLotData = {
  lot_no: number;
  product_no: number | null;
  work_date: string;
  process_type: string;
  process_name: string | null;
  lot_name: string | null;
  lot_description: string | null;
};
export class TeLot {
  private constructor(readonly data: TeLotData) {}
  static parse(r: Record<string, unknown>): TeLot {
    return new TeLot({
      lot_no: asInt(r.lot_no),
      product_no: asIntOrNull(r.product_no),
      work_date: asIsoDateTimeStrOrNull(r.work_date) ?? "",
      process_type: asStrOrNull(r.process_type) ?? "",
      process_name: asStrOrNull(r.process_name),
      lot_name: asStrOrNull(r.lot_name),
      lot_description: asStrOrNull(r.lot_description)
    });
  }
}

export type TeLotBaseData = {
  lot_no: number;
  process_type: string;
  product_no: number;
  lot_status: string;
  lot_name: string;
  work_date: string;
  organic_class: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number | null;
  fraction_number: number | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeLotBase {
  private constructor(readonly data: TeLotBaseData) {}
  static parse(r: Record<string, unknown>): TeLotBase {
    return new TeLotBase({
      lot_no: asInt(r.lot_no),
      process_type: asStrOrNull(r.process_type) ?? "",
      product_no: asInt(r.product_no),
      lot_status: asStrOrNull(r.lot_status) ?? "",
      lot_name: asStrOrNull(r.lot_name) ?? "",
      work_date: asIsoDateStr(r.work_date),
      organic_class: asStrOrNull(r.organic_class) ?? "",
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumberOrNull(r.fraction_weight),
      fraction_number: asIntOrNull(r.fraction_number),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeLotUseItemData = {
  lot_no: number;
  use_no: number;
  use_name: string | null;
  make_year: string | null;
  count: string | null;
};
export class TeLotUseItem {
  private constructor(readonly data: TeLotUseItemData) {}
  static parse(r: Record<string, unknown>): TeLotUseItem {
    return new TeLotUseItem({
      lot_no: asInt(r.lot_no),
      use_no: asInt(r.use_no),
      use_name: asStrOrNull(r.use_name),
      make_year: asStrOrNull(r.make_year),
      count: asStrOrNull(r.count)
    });
  }
}

export type TeLotCategorysBlendData = {
  lot_no: number;
  sensual_test_color: string | null;
  sensual_test_taste: string | null;
  sensual_test_aroma: string | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeLotCategorysBlend {
  private constructor(readonly data: TeLotCategorysBlendData) {}
  static parse(r: Record<string, unknown>): TeLotCategorysBlend {
    return new TeLotCategorysBlend({
      lot_no: asInt(r.lot_no),
      sensual_test_color: asStrOrNull(r.sensual_test_color),
      sensual_test_taste: asStrOrNull(r.sensual_test_taste),
      sensual_test_aroma: asStrOrNull(r.sensual_test_aroma),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeLotCategorysFirepanData = {
  lot_no: number;
  fir_value_1: string | null;
  fir_value_2: string | null;
  fir_value_3a: string | null;
  fir_value_3b: string | null;
  fir_value_4a: string | null;
  fir_value_4b: string | null;
  fir_value_4c: string | null;
  fir_value_5: string | null;
  fir_value_6: string | null;
  fir_value_7: string | null;
  sensual_test_color_before: string | null;
  sensual_test_taste_before: string | null;
  sensual_test_aroma_before: string | null;
  sensual_test_comment_before: string | null;
  sensual_test_color_after: string | null;
  sensual_test_taste_after: string | null;
  sensual_test_aroma_after: string | null;
  sensual_test_comment_after: string | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeLotCategorysFirepan {
  private constructor(readonly data: TeLotCategorysFirepanData) {}
  static parse(r: Record<string, unknown>): TeLotCategorysFirepan {
    return new TeLotCategorysFirepan({
      lot_no: asInt(r.lot_no),
      fir_value_1: asStrOrNull(r.fir_value_1),
      fir_value_2: asStrOrNull(r.fir_value_2),
      fir_value_3a: asStrOrNull(r.fir_value_3a),
      fir_value_3b: asStrOrNull(r.fir_value_3b),
      fir_value_4a: asStrOrNull(r.fir_value_4a),
      fir_value_4b: asStrOrNull(r.fir_value_4b),
      fir_value_4c: asStrOrNull(r.fir_value_4c),
      fir_value_5: asStrOrNull(r.fir_value_5),
      fir_value_6: asStrOrNull(r.fir_value_6),
      fir_value_7: asStrOrNull(r.fir_value_7),
      sensual_test_color_before: asStrOrNull(r.sensual_test_color_before),
      sensual_test_taste_before: asStrOrNull(r.sensual_test_taste_before),
      sensual_test_aroma_before: asStrOrNull(r.sensual_test_aroma_before),
      sensual_test_comment_before: asStrOrNull(r.sensual_test_comment_before),
      sensual_test_color_after: asStrOrNull(r.sensual_test_color_after),
      sensual_test_taste_after: asStrOrNull(r.sensual_test_taste_after),
      sensual_test_aroma_after: asStrOrNull(r.sensual_test_aroma_after),
      sensual_test_comment_after: asStrOrNull(r.sensual_test_comment_after),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeLotDivideData = {
  lot_no: number;
  divide_no: number;
  divide_date: string;
  divide_type: string;
  reason: string | null;
  divide_quantity: number | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeLotDivide {
  private constructor(readonly data: TeLotDivideData) {}
  static parse(r: Record<string, unknown>): TeLotDivide {
    return new TeLotDivide({
      lot_no: asInt(r.lot_no),
      divide_no: asInt(r.divide_no),
      divide_date: asIsoDateStr(r.divide_date),
      divide_type: asStrOrNull(r.divide_type) ?? "",
      reason: asStrOrNull(r.reason),
      divide_quantity: asFiniteNumberOrNull(r.divide_quantity),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeLotPartData = {
  lot_no: number;
  part_no: number;
  use_quantity: number | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeLotPart {
  private constructor(readonly data: TeLotPartData) {}
  static parse(r: Record<string, unknown>): TeLotPart {
    return new TeLotPart({
      lot_no: asInt(r.lot_no),
      part_no: asInt(r.part_no),
      use_quantity: asFiniteNumberOrNull(r.use_quantity),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeMaterialPurchaseData = {
  purchase_no: number;
  purchase_date: string | null;
  item_no: number;
  item_name: string | null;
  purchase_lot_no: string | null;
  purchase_quantity: number | null;
  supplier: string | null;
};
export class TeMaterialPurchase {
  private constructor(readonly data: TeMaterialPurchaseData) {}
  static parse(r: Record<string, unknown>): TeMaterialPurchase {
    return new TeMaterialPurchase({
      purchase_no: asInt(r.purchase_no),
      purchase_date: asIsoDateTimeStrOrNull(r.purchase_date),
      item_no: asInt(r.item_no),
      item_name: asStrOrNull(r.item_name),
      purchase_lot_no: asStrOrNull(r.purchase_lot_no),
      purchase_quantity: asFiniteNumberOrNull(r.purchase_quantity),
      supplier: asStrOrNull(r.supplier)
    });
  }
}

export type TeMaterialResultData = {
  year: number;
  purchase: string;
  product_no: string;
  purchase_date: string;
  tea_rank: string;
  rank: string;
  tea_type: string | null;
  tea_life: string | null;
  organic_class: string;
  producer: string | null;
  material_name: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  remarks: string | null;
  update_time: string | null;
};
export type TePackageBaseData = {
  product_no: number;
  organic_class: string;
  item_no: number;
  product_name: string;
  work_date: string;
  complete_quantity: number;
  sample_quantity: number;
  fail_quantity: number;
  use_tea_no: number | null;
  part_name: string | null;
  part_lot_no_1: number | null;
  out_quantity_1: number | null;
  rem_quantity_1: number | null;
  part_lot_no_2: number | null;
  out_quantity_2: number | null;
  rem_quantity_2: number | null;
  part_lot_no_3: number | null;
  out_quantity_3: number | null;
  rem_quantity_3: number | null;
  grade_no: number | null;
  remarks: string | null;
};
export class TePackageBase {
  private constructor(readonly data: TePackageBaseData) {}
  static parse(r: Record<string, unknown>): TePackageBase {
    return new TePackageBase({
      product_no: asInt(r.product_no),
      organic_class: asStrOrNull(r.organic_class) ?? "",
      item_no: asInt(r.item_no),
      product_name: asStrOrNull(r.product_name) ?? "",
      work_date: asIsoDateStr(r.work_date),
      complete_quantity: asInt(r.complete_quantity),
      sample_quantity: asInt(r.sample_quantity),
      fail_quantity: asInt(r.fail_quantity),
      use_tea_no: asIntOrNull(r.use_tea_no),
      part_name: asStrOrNull(r.part_name),
      part_lot_no_1: asIntOrNull(r.part_lot_no_1),
      out_quantity_1: asFiniteNumberOrNull(r.out_quantity_1),
      rem_quantity_1: asFiniteNumberOrNull(r.rem_quantity_1),
      part_lot_no_2: asIntOrNull(r.part_lot_no_2),
      out_quantity_2: asFiniteNumberOrNull(r.out_quantity_2),
      rem_quantity_2: asFiniteNumberOrNull(r.rem_quantity_2),
      part_lot_no_3: asIntOrNull(r.part_lot_no_3),
      out_quantity_3: asFiniteNumberOrNull(r.out_quantity_3),
      rem_quantity_3: asFiniteNumberOrNull(r.rem_quantity_3),
      grade_no: asIntOrNull(r.grade_no),
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export class TeMaterialResult {
  private constructor(readonly data: TeMaterialResultData) {}
  static parse(r: Record<string, unknown>): TeMaterialResult {
    return new TeMaterialResult({
      year: asInt(r.year),
      purchase: asStrOrNull(r.purchase) ?? "",
      product_no: asStrOrNull(r.product_no) ?? "",
      purchase_date: asIsoDateStr(r.purchase_date),
      tea_rank: asStrOrNull(r.tea_rank) ?? "",
      rank: asStrOrNull(r.rank) ?? "",
      tea_type: asStrOrNull(r.tea_type),
      tea_life: asStrOrNull(r.tea_life),
      organic_class: asStrOrNull(r.organic_class) ?? "",
      producer: asStrOrNull(r.producer),
      material_name: asStrOrNull(r.material_name) ?? "",
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TePurchaseReceiveData = {
  year: number;
  purchase: string;
  bid_no: string;
  receive_date: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  remarks: string | null;
  update_time: string | null;
};
export class TePurchaseReceive {
  private constructor(readonly data: TePurchaseReceiveData) {}
  static parse(r: Record<string, unknown>): TePurchaseReceive {
    return new TePurchaseReceive({
      year: asInt(r.year),
      purchase: asStrOrNull(r.purchase) ?? "",
      bid_no: asStrOrNull(r.bid_no) ?? "",
      receive_date: asIsoDateStr(r.receive_date),
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TePurchaseTeaData = {
  year: number;
  purchase: string;
  bid_no: string;
  purchase_date: string;
  variety: string | null;
  tea_life: string | null;
  grade: string | null;
  tea_type: string | null;
  tea_rank: string | null;
  field_no: string | null;
  producer: string | null;
  cost: number | null;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  discount: number;
  target: string | null;
  target_plan: string | null;
  lot_no: string | null;
  remarks: string | null;
  update_time: string | null;
};
export class TePurchaseTea {
  private constructor(readonly data: TePurchaseTeaData) {}
  static parse(r: Record<string, unknown>): TePurchaseTea {
    return new TePurchaseTea({
      year: asInt(r.year),
      purchase: asStrOrNull(r.purchase) ?? "",
      bid_no: asStrOrNull(r.bid_no) ?? "",
      purchase_date: asIsoDateStr(r.purchase_date),
      variety: asStrOrNull(r.variety),
      tea_life: asStrOrNull(r.tea_life),
      grade: asStrOrNull(r.grade),
      tea_type: asStrOrNull(r.tea_type),
      tea_rank: asStrOrNull(r.tea_rank),
      field_no: asStrOrNull(r.field_no),
      producer: asStrOrNull(r.producer),
      cost: asIntOrNull(r.cost),
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      discount: asInt(r.discount),
      target: asStrOrNull(r.target),
      target_plan: asStrOrNull(r.target_plan),
      lot_no: asStrOrNull(r.lot_no),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TePurchaseTransferData = {
  year: number;
  purchase: string;
  bid_no: string;
  result_type: string;
  transfer: string;
  transfer_date: string;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  unit_price: number | null;
  remarks: string | null;
  update_time: string | null;
};
export class TePurchaseTransfer {
  private constructor(readonly data: TePurchaseTransferData) {}
  static parse(r: Record<string, unknown>): TePurchaseTransfer {
    return new TePurchaseTransfer({
      year: asInt(r.year),
      purchase: asStrOrNull(r.purchase) ?? "",
      bid_no: asStrOrNull(r.bid_no) ?? "",
      result_type: asStrOrNull(r.result_type) ?? "",
      transfer: asStrOrNull(r.transfer) ?? "",
      transfer_date: asIsoDateStr(r.transfer_date),
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      unit_price: asFiniteNumberOrNull(r.unit_price),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TeStoreTransferData = {
  transfer_no: number;
  transfer_date: string;
  item_no: number;
  product_no: number;
  transfer_type: string;
  result_type: string;
  lot_no: string;
  lot_type: string;
  reason: string | null;
  store_no: number;
  store_party_name: string | null;
  unit_weight: number;
  unit_number: number;
  fraction_weight: number;
  fraction_number: number;
  transfer_quantity: number;
  unit_type: string | null;
  remarks: string | null;
};
export class TeStoreTransfer {
  private constructor(readonly data: TeStoreTransferData) {}
  static parse(r: Record<string, unknown>): TeStoreTransfer {
    return new TeStoreTransfer({
      transfer_no: asInt(r.transfer_no),
      transfer_date: asIsoDateTimeStrOrNull(r.transfer_date) ?? "",
      item_no: asInt(r.item_no),
      product_no: asInt(r.product_no),
      transfer_type: asStrOrNull(r.transfer_type) ?? "",
      result_type: asStrOrNull(r.result_type) ?? "",
      lot_no: asStrOrNull(r.lot_no) ?? "",
      lot_type: asStrOrNull(r.lot_type) ?? "",
      reason: asStrOrNull(r.reason),
      store_no: asInt(r.store_no),
      store_party_name: asStrOrNull(r.store_party_name),
      unit_weight: asFiniteNumber(r.unit_weight),
      unit_number: asInt(r.unit_number),
      fraction_weight: asFiniteNumber(r.fraction_weight),
      fraction_number: asInt(r.fraction_number),
      transfer_quantity: asFiniteNumber(r.transfer_quantity),
      unit_type: asStrOrNull(r.unit_type),
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export type TeStoreTransferFa2Data = {
  transfer_no: number;
  transfer_date: string;
  lot_no: number;
  process_type: string;
  product_no: number;
  lot_name: string | null;
  transfer_type: string;
  result_type: string;
  lot_type: string;
  reason: string | null;
  unit_weight: number | null;
  unit_number: number | null;
  fraction_weight: number | null;
  fraction_number: number | null;
  transfer_quantity: number;
  unit_type: string | null;
  remarks: string | null;
  update_time: string | null;
};
export class TeStoreTransferFa2 {
  private constructor(readonly data: TeStoreTransferFa2Data) {}
  static parse(r: Record<string, unknown>): TeStoreTransferFa2 {
    return new TeStoreTransferFa2({
      transfer_no: asInt(r.transfer_no),
      transfer_date: asIsoDateTimeStrOrNull(r.transfer_date) ?? "",
      lot_no: asInt(r.lot_no),
      process_type: asStrOrNull(r.process_type) ?? "",
      product_no: asInt(r.product_no),
      lot_name: asStrOrNull(r.lot_name),
      transfer_type: asStrOrNull(r.transfer_type) ?? "",
      result_type: asStrOrNull(r.result_type) ?? "",
      lot_type: asStrOrNull(r.lot_type) ?? "",
      reason: asStrOrNull(r.reason),
      unit_weight: asFiniteNumberOrNull(r.unit_weight),
      unit_number: asIntOrNull(r.unit_number),
      fraction_weight: asFiniteNumberOrNull(r.fraction_weight),
      fraction_number: asIntOrNull(r.fraction_number),
      transfer_quantity: asFiniteNumber(r.transfer_quantity),
      unit_type: asStrOrNull(r.unit_type),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TrCustomerData = {
  customer_no: number;
  customer_name: string;
  customer_kana: string | null;
  zip: string | null;
  address: string | null;
  phone_no: string | null;
  fax_no: string | null;
  prefecture: number | null;
  region: number | null;
  channel: number | null;
  age_group: number | null;
};
export class TrCustomer {
  private constructor(readonly data: TrCustomerData) {}
  static parse(r: Record<string, unknown>): TrCustomer {
    return new TrCustomer({
      customer_no: asInt(r.customer_no),
      customer_name: asStrOrNull(r.customer_name) ?? "",
      customer_kana: asStrOrNull(r.customer_kana),
      zip: asStrOrNull(r.zip),
      address: asStrOrNull(r.address),
      phone_no: asStrOrNull(r.phone_no),
      fax_no: asStrOrNull(r.fax_no),
      prefecture: asIntOrNull(r.prefecture),
      region: asIntOrNull(r.region),
      channel: asIntOrNull(r.channel),
      age_group: asIntOrNull(r.age_group)
    });
  }
}

export type TrDirectShipmentData = {
  direct_shipment_no: number;
  direct_shipment_name: string;
  direct_shipment_kana: string | null;
  zip: string | null;
  address: string | null;
  phone_no: string | null;
  fax_no: string | null;
  display_order: number | null;
  remarks: string | null;
};
export class TrDirectShipment {
  private constructor(readonly data: TrDirectShipmentData) {}
  static parse(r: Record<string, unknown>): TrDirectShipment {
    return new TrDirectShipment({
      direct_shipment_no: asInt(r.direct_shipment_no),
      direct_shipment_name: asStrOrNull(r.direct_shipment_name) ?? "",
      direct_shipment_kana: asStrOrNull(r.direct_shipment_kana),
      zip: asStrOrNull(r.zip),
      address: asStrOrNull(r.address),
      phone_no: asStrOrNull(r.phone_no),
      fax_no: asStrOrNull(r.fax_no),
      display_order: asIntOrNull(r.display_order),
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export type TrItemBomData = { parent_item_no: number; child_item_no: number };
export class TrItemBom {
  private constructor(readonly data: TrItemBomData) {}
  static parse(r: Record<string, unknown>): TrItemBom {
    return new TrItemBom({
      parent_item_no: asInt(r.parent_item_no),
      child_item_no: asInt(r.child_item_no)
    });
  }
}

export type TrItemGroupData = { item_group_no: number; item_group_name: string | null };
export class TrItemGroup {
  private constructor(readonly data: TrItemGroupData) {}
  static parse(r: Record<string, unknown>): TrItemGroup {
    return new TrItemGroup({
      item_group_no: asInt(r.item_group_no),
      item_group_name: asStrOrNull(r.item_group_name)
    });
  }
}

export type TrSalesPlanItemData = {
  item_no: number;
  display_order: number | null;
  display: boolean | null;
  remarks: string | null;
};
export class TrSalesPlanItem {
  private constructor(readonly data: TrSalesPlanItemData) {}
  static parse(r: Record<string, unknown>): TrSalesPlanItem {
    return new TrSalesPlanItem({
      item_no: asInt(r.item_no),
      display_order: asIntOrNull(r.display_order),
      display: asBoolOrNull(r.display),
      remarks: asStrOrNull(r.remarks)
    });
  }
}

export type TrPurchaseData = {
  purchase_no: number;
  purchase_name: string;
  purchase: string;
  purchase_short: string;
  purchase_kana: string | null;
  prefecture: string | null;
  zip: string | null;
  address: string | null;
  phone_no: string | null;
  fax_no: string | null;
};
export class TrPurchase {
  private constructor(readonly data: TrPurchaseData) {}
  static parse(r: Record<string, unknown>): TrPurchase {
    return new TrPurchase({
      purchase_no: asFiniteNumber(r.purchase_no),
      purchase_name: asStrOrNull(r.purchase_name) ?? "",
      purchase: asStrOrNull(r.purchase) ?? "",
      purchase_short: asStrOrNull(r.purchase_short) ?? "",
      purchase_kana: asStrOrNull(r.purchase_kana),
      prefecture: asStrOrNull(r.prefecture),
      zip: asStrOrNull(r.zip),
      address: asStrOrNull(r.address),
      phone_no: asStrOrNull(r.phone_no),
      fax_no: asStrOrNull(r.fax_no)
    });
  }
}

export type TrResaleData = {
  resale: string;
  rate: number;
  postage: number;
  limit_price: number;
  fixed_price: number;
  calc_type: number;
  remarks: string | null;
  update_time: string | null;
};
export class TrResale {
  private constructor(readonly data: TrResaleData) {}
  static parse(r: Record<string, unknown>): TrResale {
    return new TrResale({
      resale: asStrOrNull(r.resale) ?? "",
      rate: asInt(r.rate),
      postage: asInt(r.postage),
      limit_price: asInt(r.limit_price),
      fixed_price: asInt(r.fixed_price),
      calc_type: asInt(r.calc_type),
      remarks: asStrOrNull(r.remarks),
      update_time: asIsoDateTimeStrOrNull(r.update_time)
    });
  }
}

export type TrStoreData = { store_no: number; store_name: string };
export class TrStore {
  private constructor(readonly data: TrStoreData) {}
  static parse(r: Record<string, unknown>): TrStore {
    return new TrStore({
      store_no: asInt(r.store_no),
      store_name: asStrOrNull(r.store_name) ?? ""
    });
  }
}

export type TrSupplierData = {
  supplier_no: number;
  supplier_type: string;
  supplier_name: string;
  supplier_kana: string | null;
};
export class TrSupplier {
  private constructor(readonly data: TrSupplierData) {}
  static parse(r: Record<string, unknown>): TrSupplier {
    return new TrSupplier({
      supplier_no: asInt(r.supplier_no),
      supplier_type: asStrOrNull(r.supplier_type) ?? "",
      supplier_name: asStrOrNull(r.supplier_name) ?? "",
      supplier_kana: asStrOrNull(r.supplier_kana)
    });
  }
}

/** テーブル ID → エンティティ配列のキャッシュ形（リポジトリ領域の正） */
export type MasterEntityCache = {
  blend_no: BlendNo[];
  bulk_no: BulkNo[];
  finish_no: FinishNo[];
  firepan_no: FirepanNo[];
  te_factory1_result: TeFactory1Result[];
  te_factory1_transfer: TeFactory1Transfer[];
  te_factory2_result: TeFactory2Result[];
  vi_factory2_stock: ViFactory2Stock[];
  vi_factory3_stoc: ViFactory3Stoc[];
  te_factory3_result: TeFactory3Result[];
  te_factory3_stock: TeFactory3Stock[];
  te_grade: TeGrade[];
  te_lot: TeLot[];
  te_lot_base: TeLotBase[];
  te_lot_use_item: TeLotUseItem[];
  te_lot_categorys_blend: TeLotCategorysBlend[];
  te_lot_categorys_common: TeLotCategorysCommon[];
  te_lot_categorys_finish: TeLotCategorysFinish[];
  te_lot_categorys_firepan: TeLotCategorysFirepan[];
  te_lot_divide: TeLotDivide[];
  te_lot_part: TeLotPart[];
  te_material_purchase: TeMaterialPurchase[];
  te_material_result: TeMaterialResult[];
  te_package_base: TePackageBase[];
  te_package_base_new: TePackageBaseNew[];
  te_package_categorys_new: TePackageCategorysNew[];
  te_purchase_receive: TePurchaseReceive[];
  te_purchase_tea: TePurchaseTea[];
  te_purchase_transfer: TePurchaseTransfer[];
  te_store_transfer: TeStoreTransfer[];
  te_store_transfer_fa2: TeStoreTransferFa2[];
  tr_customer: TrCustomer[];
  tr_direct_shipment: TrDirectShipment[];
  tr_item_bom: TrItemBom[];
  tr_item_group: TrItemGroup[];
  tr_sales_plan_item: TrSalesPlanItem[];
  tr_purchase: TrPurchase[];
  tr_resale: TrResale[];
  tr_store: TrStore[];
  tr_supplier: TrSupplier[];
};

export function emptyMasterEntityCache(): MasterEntityCache {
  return {
    blend_no: [],
    bulk_no: [],
    finish_no: [],
    firepan_no: [],
    te_factory1_result: [],
    te_factory1_transfer: [],
    te_factory2_result: [],
    vi_factory2_stock: [],
    vi_factory3_stoc: [],
    te_factory3_result: [],
    te_factory3_stock: [],
    te_grade: [],
    te_lot: [],
    te_lot_base: [],
    te_lot_use_item: [],
    te_lot_categorys_blend: [],
    te_lot_categorys_common: [],
    te_lot_categorys_finish: [],
    te_lot_categorys_firepan: [],
    te_lot_divide: [],
    te_lot_part: [],
    te_material_purchase: [],
    te_material_result: [],
    te_package_base: [],
    te_package_base_new: [],
    te_package_categorys_new: [],
    te_purchase_receive: [],
    te_purchase_tea: [],
    te_purchase_transfer: [],
    te_store_transfer: [],
    te_store_transfer_fa2: [],
    tr_customer: [],
    tr_direct_shipment: [],
    tr_item_bom: [],
    tr_item_group: [],
    tr_sales_plan_item: [],
    tr_purchase: [],
    tr_resale: [],
    tr_store: [],
    tr_supplier: []
  };
}

const PARSERS: {
  [K in GenericMasterTableId]: (rows: Record<string, unknown>[]) => MasterEntityCache[K];
} = {
  blend_no: (rows) => rows.map((r) => BlendNo.parse(r)),
  bulk_no: (rows) => rows.map((r) => BulkNo.parse(r)),
  finish_no: (rows) => rows.map((r) => FinishNo.parse(r)),
  firepan_no: (rows) => rows.map((r) => FirepanNo.parse(r)),
  te_factory1_result: (rows) => rows.map((r) => TeFactory1Result.parse(r)),
  te_factory1_transfer: (rows) => rows.map((r) => TeFactory1Transfer.parse(r)),
  te_factory2_result: (rows) => rows.map((r) => TeFactory2Result.parse(r)),
  vi_factory2_stock: (rows) => parseViFactory2StockRows(rows),
  vi_factory3_stoc: (rows) => rows.map((r) => ViFactory3Stoc.parse(r)),
  te_factory3_result: (rows) => rows.map((r) => TeFactory3Result.parse(r)),
  te_factory3_stock: (rows) => rows.map((r) => TeFactory3Stock.parse(r)),
  te_grade: (rows) => rows.map((r) => TeGrade.parse(r)),
  te_lot: (rows) => rows.map((r) => TeLot.parse(r)),
  te_lot_base: (rows) => rows.map((r) => TeLotBase.parse(r)),
  te_lot_use_item: (rows) => rows.map((r) => TeLotUseItem.parse(r)),
  te_lot_categorys_blend: (rows) => rows.map((r) => TeLotCategorysBlend.parse(r)),
  te_lot_categorys_common: (rows) => rows.map((r) => TeLotCategorysCommon.parse(r)),
  te_lot_categorys_finish: (rows) => rows.map((r) => TeLotCategorysFinish.parse(r)),
  te_lot_categorys_firepan: (rows) => rows.map((r) => TeLotCategorysFirepan.parse(r)),
  te_lot_divide: (rows) => rows.map((r) => TeLotDivide.parse(r)),
  te_lot_part: (rows) => rows.map((r) => TeLotPart.parse(r)),
  te_material_purchase: (rows) => rows.map((r) => TeMaterialPurchase.parse(r)),
  te_material_result: (rows) => rows.map((r) => TeMaterialResult.parse(r)),
  te_package_base: (rows) => rows.map((r) => TePackageBase.parse(r)),
  te_package_base_new: (rows) => rows.map((r) => TePackageBaseNew.parse(r)),
  te_package_categorys_new: (rows) => rows.map((r) => TePackageCategorysNew.parse(r)),
  te_purchase_receive: (rows) => rows.map((r) => TePurchaseReceive.parse(r)),
  te_purchase_tea: (rows) => rows.map((r) => TePurchaseTea.parse(r)),
  te_purchase_transfer: (rows) => rows.map((r) => TePurchaseTransfer.parse(r)),
  te_store_transfer: (rows) => rows.map((r) => TeStoreTransfer.parse(r)),
  te_store_transfer_fa2: (rows) => rows.map((r) => TeStoreTransferFa2.parse(r)),
  tr_customer: (rows) => rows.map((r) => TrCustomer.parse(r)),
  tr_direct_shipment: (rows) => rows.map((r) => TrDirectShipment.parse(r)),
  tr_item_bom: (rows) => rows.map((r) => TrItemBom.parse(r)),
  tr_item_group: (rows) => rows.map((r) => TrItemGroup.parse(r)),
  tr_sales_plan_item: (rows) => rows.map((r) => TrSalesPlanItem.parse(r)),
  tr_purchase: (rows) => rows.map((r) => TrPurchase.parse(r)),
  tr_resale: (rows) => rows.map((r) => TrResale.parse(r)),
  tr_store: (rows) => rows.map((r) => TrStore.parse(r)),
  tr_supplier: (rows) => rows.map((r) => TrSupplier.parse(r))
};

/** API 生行をテーブル別エンティティ配列へ変換（リポジトリが呼ぶ） */
export function parseMasterRowsForTable<K extends GenericMasterTableId>(
  id: K,
  rows: Record<string, unknown>[]
): MasterEntityCache[K] {
  return PARSERS[id](rows) as MasterEntityCache[K];
}

/** 1テーブル分をキャッシュにマージする際のヘルプ */
export function mergeParsedTable<K extends GenericMasterTableId>(
  cache: MasterEntityCache,
  id: K,
  rows: Record<string, unknown>[]
): MasterEntityCache {
  return { ...cache, [id]: parseMasterRowsForTable(id, rows) };
}
