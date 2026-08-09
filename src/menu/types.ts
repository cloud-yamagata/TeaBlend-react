/**
 * 【処理概要】
 *   メニュー YAML の最小スキーマ型（グループ→項目）。`menuStore.decodeMenuConfig` の戻り値。
 *
 * 【パラメータ仕様】
 *   - `MenuItem.screenKey` … `/screen/:screenKey` または `path` があればそちら
 */

export type MenuItem = {
  label: string;
  screenKey: string;
  path?: string;
};

export type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export type MenuConfig = {
  version: number;
  title?: string;
  groups: MenuGroup[];
};

