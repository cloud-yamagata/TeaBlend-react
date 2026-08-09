/**
 * 直送先マスタ一覧の構築・絞り込み
 */
import { atom } from "jotai";
import { masterEntityCacheAtom } from "../repository/masterData";
import { matchesContains } from "../lib/searchNormalize";
import {
  defaultShipmentCorrectSearchFilters,
  trDirectShipmentToRow,
  type ShipmentCorrectRow,
  type ShipmentCorrectSearchFilters
} from "./types";

export const shipmentCorrectListAtom = atom((get): ShipmentCorrectRow[] => {
  const rows: ShipmentCorrectRow[] = [];
  for (const entity of get(masterEntityCacheAtom).tr_direct_shipment) {
    const row = trDirectShipmentToRow(entity);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.directShipmentNo - b.directShipmentNo);
  return rows;
});

export const shipmentCorrectSearchDraftAtom = atom<ShipmentCorrectSearchFilters>(
  defaultShipmentCorrectSearchFilters()
);
export const shipmentCorrectSearchAppliedFiltersAtom = atom<ShipmentCorrectSearchFilters | null>(null);
export const shipmentCorrectSearchExecutedAtom = atom(false);

export const isShipmentCorrectSearchEnabled = (): boolean => true;

const matchesFilters = (row: ShipmentCorrectRow, filters: ShipmentCorrectSearchFilters): boolean => {
  if (filters.shipmentName.trim() && !matchesContains(row.directShipmentName, filters.shipmentName)) {
    return false;
  }
  return true;
};

export const filteredShipmentCorrectListAtom = atom((get): ShipmentCorrectRow[] => {
  if (!get(shipmentCorrectSearchExecutedAtom)) return [];
  const filters = get(shipmentCorrectSearchAppliedFiltersAtom);
  const source = get(shipmentCorrectListAtom);
  if (!filters) return source;
  return source.filter((row) => matchesFilters(row, filters));
});
