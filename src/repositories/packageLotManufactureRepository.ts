/**
 * パッケージ製造報告書登録：登録・変更・削除 API
 */
import { getMaterialApiBaseUrl } from "../config/api";
import type {
  PackageLotApiCreateBody,
  PackageLotApiUpdateBody,
  PackageLotConfirmStockApiBody
} from "../PackageReport/collectPackageLotEditPayload";

const base = () => `${getMaterialApiBaseUrl()}/package_lot_manufacture`;

export type PackageLotMutationApiResult = {
  ok: boolean;
  product_no: number;
};

async function postMutation(path: string, body: unknown): Promise<PackageLotMutationApiResult> {
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as PackageLotMutationApiResult;
  if (data.ok !== true || !Number.isFinite(data.product_no)) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}

export async function createPackageLotManufacture(
  body: PackageLotApiCreateBody
): Promise<PackageLotMutationApiResult> {
  return postMutation("/create", body);
}

export async function updatePackageLotManufacture(
  body: PackageLotApiUpdateBody
): Promise<PackageLotMutationApiResult> {
  return postMutation("/update", body);
}

export async function deletePackageLotManufacture(productNo: number): Promise<void> {
  await postMutation("/delete", { product_no: productNo });
}

export type PackageLotConfirmStockApiResult = {
  ok: boolean;
  product_no: number;
  transfer_nos: number[];
  lot_status: string;
};

export async function confirmPackageLotStockManufacture(
  body: PackageLotConfirmStockApiBody
): Promise<PackageLotConfirmStockApiResult> {
  const response = await fetch(`${base()}/confirm_stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  const data = (await response.json()) as PackageLotConfirmStockApiResult;
  if (
    data.ok !== true ||
    !Number.isFinite(data.product_no) ||
    !Array.isArray(data.transfer_nos) ||
    data.transfer_nos.length !== body.transfer_rows.length ||
    data.transfer_nos.some((no) => !Number.isFinite(no))
  ) {
    throw new Error("API returned unsuccessful status");
  }
  return data;
}
