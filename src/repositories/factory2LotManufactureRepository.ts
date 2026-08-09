/**
 * 第二工場ロット製造登録：変更・削除 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import type {
  Factory2LotCreatePayload,
  Factory2LotUpdatePayload
} from "../Factory2LotManufacture/collectFactory2LotEditPayload";
import type { Factory2LotEditPartRow } from "../Factory2LotManufacture/factory2LotEditTypes";

const base = () => `${getMaterialApiBaseUrl()}/factory2_lot_manufacture`;

function toApiPartRows(rows: Factory2LotEditPartRow[]) {
  return rows.map((r) => ({
    lot_no: Number(r.lotNo),
    part_no: Number(r.partNo) || Number(r.lotNo),
    part_name: r.partName.trim() || null,
    make_year: r.makeYear.trim() || null,
    count: r.count.trim() || null,
    use_quantity: (() => {
      const t = r.useQuantity.trim().replace(/,/g, "");
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
    })(),
    remarks: r.remarks.trim() || null
  }));
}

export function toApiUpdateBody(payload: Factory2LotUpdatePayload): Record<string, unknown> {
  const bf = payload.baseFields;
  const cf = payload.categoryFields;
  return {
    parent_lot_no: payload.parentLotNo,
    organic_class: payload.organic_class,
    base_fields: {
      lot_name: bf.lot_name,
      work_date: bf.work_date,
      unit_weight: bf.unit_weight,
      unit_number: bf.unit_number,
      fraction_weight: bf.fraction_weight,
      fraction_number: bf.fraction_number,
      remarks: bf.remarks,
      make_year: bf.make_year,
      count: bf.count,
      use_name: bf.use_name
    },
    category_fields: { ...cf },
    part_rows: toApiPartRows(payload.partRows)
  };
}

export type Factory2LotMutationApiResult = {
  ok: boolean;
  lot_no: number;
  product_no: number | null;
};

async function postMutation(path: string, body: unknown): Promise<Factory2LotMutationApiResult> {
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as Factory2LotMutationApiResult;
  if (data.ok !== true || !Number.isFinite(data.lot_no)) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}

export function toApiCreateBody(payload: Factory2LotCreatePayload): Record<string, unknown> {
  const bf = payload.baseFields;
  const cf = payload.categoryFields;
  return {
    process_type: payload.process_type,
    organic_class: payload.organic_class,
    base_fields: {
      lot_name: bf.lot_name,
      work_date: bf.work_date,
      unit_weight: bf.unit_weight,
      unit_number: bf.unit_number,
      fraction_weight: bf.fraction_weight,
      fraction_number: bf.fraction_number,
      remarks: bf.remarks,
      make_year: bf.make_year,
      count: bf.count,
      use_name: bf.use_name
    },
    category_fields: { ...cf },
    part_rows: toApiPartRows(payload.partRows)
  };
}

export async function createFactory2LotManufacture(
  payload: Factory2LotCreatePayload
): Promise<Factory2LotMutationApiResult> {
  const data = await postMutation("/create", toApiCreateBody(payload));
  if (data.product_no == null || !Number.isFinite(data.product_no)) {
    throw new Error("API returned invalid product_no");
  }
  return data;
}

export async function updateFactory2LotManufacture(payload: Factory2LotUpdatePayload): Promise<void> {
  await postMutation("/update", toApiUpdateBody(payload));
}

export async function deleteFactory2LotManufacture(lotNo: number): Promise<void> {
  await postMutation("/delete", { lot_no: lotNo });
}
