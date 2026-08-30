/**
 * 【処理概要】
 *   `te_material` / `te_monthly_plan` / `tr_item` / `te_blend_lot` の API 行を、画面用の camelCase 型へ正規化。
 *
 * 【パラメータ仕様】
 *   各 `normalize*` は `Record<string, unknown>` を受け、PascalCase / snake の両方のキーを許容
 *
 * 【メンテナンス】
 *   FastAPI が `response_model` で alias する場合でも、ここで吸収する。
 */
import type { TeBlendLot } from "../BlendLot/types";
import type { TeMaterial } from "../MaterialList/types";
import type { TeMonthlyPlan, TrItem } from "../MonthlyPlan/types";

export const asStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" ? value : value == null ? null : String(value);
};

export const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const asLotPartInfo = (value: unknown): unknown => value ?? null;

export function normalizeMaterial(row: Record<string, unknown>): TeMaterial {
  return {
    materialNo: asNumberOrNull(row.materialNo ?? row.material_no ?? row.MaterialNo),
    year: asNumberOrNull(row.year ?? row.Year),
    purchase: asStringOrNull(row.purchase ?? row.Purchase),
    purchaseNo: asStringOrNull(row.purchaseNo ?? row.purchase_no ?? row.PurchaseNo),
    purchaseDate: asStringOrNull(row.purchaseDate ?? row.purchase_date ?? row.PurchaseDate),
    variety: asStringOrNull(row.variety ?? row.Variety),
    teaLife: asStringOrNull(row.teaLife ?? row.tea_life ?? row.TeaLife),
    organicClass: asStringOrNull(row.organicClass ?? row.organic_class ?? row.OrganicClass),
    teaType: asStringOrNull(row.teaType ?? row.tea_type ?? row.TeaType),
    teaRank: asStringOrNull(row.teaRank ?? row.tea_rank ?? row.TeaRank),
    fieldNo: asStringOrNull(row.fieldNo ?? row.field_no ?? row.FieldNo),
    producer: asStringOrNull(row.producer ?? row.Producer),
    cost: asNumberOrNull(row.cost ?? row.Cost),
    materialName: asStringOrNull(row.materialName ?? row.material_name ?? row.MaterialName),
    unitWeight: asNumberOrNull(row.unitWeight ?? row.unit_weight ?? row.UnitWeight),
    unitNumber: asNumberOrNull(row.unitNumber ?? row.unit_number ?? row.UnitNumber),
    fractionWeight: asNumberOrNull(row.fractionWeight ?? row.fraction_weight ?? row.FractionWeight),
    fractionNumber: asNumberOrNull(row.fractionNumber ?? row.fraction_number ?? row.FractionNumber),
    remarks: asStringOrNull(row.remarks ?? row.Remarks),
    updateTime: asStringOrNull(row.updateTime ?? row.update_time ?? row.UpdateTime)
  };
}

export function normalizeMonthlyPlan(row: Record<string, unknown>): TeMonthlyPlan {
  return {
    planNo: asNumberOrNull(row.planNo ?? row.plan_no ?? row.PlanNo),
    year: asNumberOrNull(row.year ?? row.Year),
    month: asNumberOrNull(row.month ?? row.Month),
    processType: asStringOrNull(row.processType ?? row.process_type ?? row.ProcessType),
    lotName: asStringOrNull(row.lotName ?? row.lot_name ?? row.LotName),
    workDate: asStringOrNull(row.workDate ?? row.work_date ?? row.WorkDate),
    workTime: asStringOrNull(row.workTime ?? row.work_time ?? row.WorkTime),
    unitWeight: asNumberOrNull(row.unitWeight ?? row.unit_weight ?? row.UnitWeight),
    itemNo: asNumberOrNull(row.itemNo ?? row.item_no ?? row.ItemNo),
    remarks: asStringOrNull(row.remarks ?? row.Remarks),
    lotPartInfo: asLotPartInfo(row.lotPartInfo ?? row.lot_part_info ?? row.LotPartInfo)
  };
}

export function normalizeItem(row: Record<string, unknown>): TrItem {
  return {
    itemNo: asNumberOrNull(row.itemNo ?? row.item_no ?? row.ItemNo),
    systemClass: asStringOrNull(row.systemClass ?? row.system_class ?? row.SystemClass),
    organicClass: asStringOrNull(row.organicClass ?? row.organic_class ?? row.OrganicClass),
    itemGroupNo: asNumberOrNull(row.itemGroupNo ?? row.item_group_no ?? row.ItemGroupNo),
    itemName: asStringOrNull(row.itemName ?? row.item_name ?? row.ItemName),
    janCode: asStringOrNull(row.janCode ?? row.jan_code ?? row.JanCode),
    packageSize: asNumberOrNull(row.packageSize ?? row.package_size ?? row.PackageSize),
    displayOrder: asNumberOrNull(row.displayOrder ?? row.display_order ?? row.DisplayOrder),
    display: asStringOrNull(row.display ?? row.Display),
    remarks: asStringOrNull(row.remarks ?? row.Remarks)
  };
}

export function normalizeBlendLot(row: Record<string, unknown>): TeBlendLot {
  return {
    productNo: asNumberOrNull(row.productNo ?? row.product_no ?? row.ProductNo),
    lotStatus: asStringOrNull(row.lotStatus ?? row.lot_status ?? row.LotStatus),
    organicClass: asStringOrNull(row.organicClass ?? row.organic_class ?? row.OrganicClass),
    workDate: asStringOrNull(row.workDate ?? row.work_date ?? row.WorkDate),
    itemNo: asNumberOrNull(row.itemNo ?? row.item_no ?? row.ItemNo),
    itemName: asStringOrNull(row.itemName ?? row.item_name ?? row.ItemName),
    unitWeight: asNumberOrNull(row.unitWeight ?? row.unit_weight ?? row.UnitWeight),
    lotPartInfo: asLotPartInfo(row.lotPartInfo ?? row.lot_part_info ?? row.LotPartInfo),
    remarks: asStringOrNull(row.remarks ?? row.Remarks)
  };
}
