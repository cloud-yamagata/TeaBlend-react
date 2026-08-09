/** 工程種別コード → 表示名（旧 Store.process_type_name） */
export function processTypeName(code: string): string {
  switch (code) {
    case "01":
      return "荒茶原料";
    case "02":
      return "荒茶配合";
    case "03":
      return "仕上製造";
    case "04":
      return "火入製造";
    case "05":
      return "仕上配合";
    default:
      return "";
  }
}

/** 移動種別コード → 表示名 */
export function transferTypeName(code: string): string {
  switch (code) {
    case "1":
      return "入庫";
    case "2":
      return "出庫";
    case "3":
      return "移動";
    default:
      return "";
  }
}

/** 実績種別コード → 表示名 */
export function resultTypeName(code: string): string {
  switch (code) {
    case "1":
      return "生産";
    case "2":
      return "使用";
    case "3":
      return "受入";
    case "4":
      return "入荷";
    case "5":
      return "出荷";
    case "6":
      return "引当";
    case "7":
      return "返品";
    case "8":
      return "調整";
    default:
      return "";
  }
}

/** ロットタイプコード → 表示名 */
export function lotTypeName(code: string): string {
  switch (code) {
    case "1":
      return "原料";
    case "2":
      return "仕上";
    case "3":
      return "商品";
    default:
      return "";
  }
}

/** 入庫調整・出庫調整の対象か（移動種別=入庫 かつ 実績種別=生産） */
export function isAdjustableRow(transferType: string, resultType: string): boolean {
  return transferType === "1" && resultType === "1";
}
