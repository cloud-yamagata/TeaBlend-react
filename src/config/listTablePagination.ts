/**
 * 一覧テーブルのページング設定（画面単位・開発者のみ変更）。
 * ユーザー向けの ON/OFF 切替は行わない。
 *
 * - false … ページングなし（全件をスクロール表示）
 * - 100   … ページングあり（1 ページ 100 件固定）
 */
export const LIST_TABLE_PAGE_SIZE = 100 as const;

/** false = なし、数値 = 有（現状は LIST_TABLE_PAGE_SIZE のみ） */
export type ListTablePaginationMode = false | typeof LIST_TABLE_PAGE_SIZE;

export const listTablePagination = {
  /** 原料一覧（件数検証: 無。条件必須運用で当年絞りが主） */
  materialList: false,
  /** 第2工場ロット在庫 ZOOM */
  factory2StockZoom: false,
  /** 第2工場ロット登録モーダル … 使用部品一覧 */
  factory2LotEditParts: false,
  /** 第2工場ロット製造 … メイン一覧 */
  factory2LotManufacture: LIST_TABLE_PAGE_SIZE,
  /** 月次計画 … メイン一覧 */
  monthlyPlan: LIST_TABLE_PAGE_SIZE,
  /** 月次計画 … 使用部品（モーダル・編集） */
  monthlyPlanParts: false,
  /** ブレンドロット … メイン一覧 */
  blendLot: LIST_TABLE_PAGE_SIZE,
  /** ブレンドロット … 部品（モーダル・編集） */
  blendLotParts: false,
  /** 各種レポート（ReportGrid） */
  reportGrid: LIST_TABLE_PAGE_SIZE,
  /** パッケージロット登録 … 製造報告書一覧 */
  packageLotRegist: LIST_TABLE_PAGE_SIZE,
  /** 仕入実績情報一覧 */
  purchaseTtransfer: LIST_TABLE_PAGE_SIZE,
  /** 仕入受入情報一覧 */
  purchaseReceive: LIST_TABLE_PAGE_SIZE,
  /** 振分実績一覧 */
  purchaseResaleList: LIST_TABLE_PAGE_SIZE,
  /** 配合個別情報登録 */
  blendCategorys: LIST_TABLE_PAGE_SIZE,
  /** 仕上個別情報登録 */
  finishCategorys: LIST_TABLE_PAGE_SIZE,
  /** 火入個別情報登録 */
  firepanCategorys: LIST_TABLE_PAGE_SIZE,
  /** 第2工場入出庫実績 */
  storeTransferFa2: LIST_TABLE_PAGE_SIZE,
  /** 第3工場入出庫実績 */
  storeTransfer: LIST_TABLE_PAGE_SIZE,
  /** 仕上品仕入登録 */
  materialPurchase: LIST_TABLE_PAGE_SIZE,
  /** 第1工場生産実績情報一覧 */
  factory1Rresult: LIST_TABLE_PAGE_SIZE,
  /** 原料実績情報一覧 */
  materialRresult: LIST_TABLE_PAGE_SIZE,
  /** 商品マスタメンテナンス（Item） */
  itemCorrect: LIST_TABLE_PAGE_SIZE,
  /** 直送先マスタメンテナンス */
  shipmentCorrect: LIST_TABLE_PAGE_SIZE,
  /** 転売先マスタメンテナンス */
  resaleCorrect: LIST_TABLE_PAGE_SIZE,
  /** 商品原料対照表メンテナンス */
  itemBomCorrect: LIST_TABLE_PAGE_SIZE,
  /** 販売計画商品マスタメンテナンス */
  salesPlanItemCorrect: LIST_TABLE_PAGE_SIZE,
  /** 月次販売計画 */
  monthlySalesPlanCorrect: LIST_TABLE_PAGE_SIZE,
  /** システム定数メンテナンス */
  trConstantCorrect: LIST_TABLE_PAGE_SIZE
} as const satisfies Record<string, ListTablePaginationMode>;

export type ListTableScreenId = keyof typeof listTablePagination;

export function isListTablePaged(mode: ListTablePaginationMode): mode is typeof LIST_TABLE_PAGE_SIZE {
  return mode === LIST_TABLE_PAGE_SIZE;
}

export function resolvePageSize(mode: ListTablePaginationMode): number | null {
  return isListTablePaged(mode) ? LIST_TABLE_PAGE_SIZE : null;
}
