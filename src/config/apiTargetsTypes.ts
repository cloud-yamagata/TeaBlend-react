/**
 * FastAPI 接続先候補（api-targets.yaml）の型。
 */
export type ApiTarget = {
  id: string;
  label: string;
  /** 末尾スラッシュなし */
  baseUrl: string;
};

export type ApiTargetsConfig = {
  version: number;
  /** ビルド済みで未選択時に使う候補 id */
  defaultId: string;
  targets: ApiTarget[];
};
