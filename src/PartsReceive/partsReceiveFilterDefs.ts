/**
 * 仕上品受入 … 検索条件定義（ロット別仕上茶在庫一覧 LotBulkTeaStockList 相当）
 */
import type { ReportFilterDef } from "../reports/registry";

export const PARTS_RECEIVE_FILTER_DEFS: ReportFilterDef[] = [
  {
    key: "make_year",
    label: "年度",
    type: "makeYear"
  },
  {
    key: "quantity_filter",
    label: "移動量",
    type: "checkGroup",
    options: [
      { key: "product_quantity", label: "生産量", field: "product_quantity" },
      { key: "factory2_stock", label: "第2工場在庫量", field: "factory2_stock" },
      { key: "factory3_stock", label: "第3工場在庫量", field: "factory3_stock" }
    ]
  },
  {
    key: "item_no",
    label: "商品NO",
    type: "text",
    default: "",
    placeholder: "商品NOを入力"
  },
  {
    key: "item_name",
    label: "商品名",
    type: "itemZoom",
    default: "",
    placeholder: "商品名を入力",
    zoomCodeKey: "item_no",
    zoomButtonLabel: "仕上茶"
  }
];
