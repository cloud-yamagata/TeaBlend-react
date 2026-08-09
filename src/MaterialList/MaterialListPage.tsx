/**
 * 【処理概要】
 *   原料一覧画面のコンポーネント。検索パネルと Mantine Table（ページングなし・件数検証用）。
 *
 * 【パラメータ仕様】
 *   ルート要素のみ。状態は Jotai (`MaterialList/store.ts`) と `repository/masterData` のエラー atom。
 *
 * 【メンテナンス】
 *   - 検索ドラフトは `materialSearchDraftAtom`（検索パネルのみ購読。年変更で一覧を再描画しない）
 *   - 列定義は `materialListMantineTable.tsx`
 */
import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { TrConstantZoomModal } from "../components/TrConstantZoomModal";
import { MaterialListSearchPanel } from "./MaterialListSearchPanel";
import { MaterialListTableSection } from "./MaterialListTableSection";
import {
  materialListAtom,
  materialSearchAppliedFiltersAtom,
  materialSearchDraftAtom,
  materialSearchExecutedAtom,
  trConstantListAtom,
  type MaterialSearchFilters
} from "./store";
import { materialListMasterErrorAtom, masterDataLoadingAtom } from "../repository/masterData";
import "./styles.css";

export default function MaterialListPage() {
  const allMaterials = useAtomValue(materialListAtom);
  const trConstantList = useAtomValue(trConstantListAtom);
  const masterLoading = useAtomValue(masterDataLoadingAtom);
  const masterError = useAtomValue(materialListMasterErrorAtom);
  const setAppliedFilters = useSetAtom(materialSearchAppliedFiltersAtom);
  const setSearchExecuted = useSetAtom(materialSearchExecutedAtom);
  const setDraft = useSetAtom(materialSearchDraftAtom);

  const [purchaseZoomOpen, setPurchaseZoomOpen] = useState(false);
  const [producerZoomOpen, setProducerZoomOpen] = useState(false);

  const handleSearch = (filters: MaterialSearchFilters) => {
    setAppliedFilters({ ...filters });
    setSearchExecuted(true);
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">原料一覧</h1>
        <p className="materialListVerifyBadge">
          検証: Mantine Table・ページングなし（マスタ {allMaterials.length.toLocaleString("ja-JP")} 件）
        </p>
      </header>

      {masterLoading && <p className="status">マスタ読み込み中...</p>}
      {masterError && <p className="status error">{masterError}</p>}

      <MaterialListSearchPanel
        onSearch={handleSearch}
        onOpenPurchaseZoom={() => setPurchaseZoomOpen(true)}
        onOpenProducerZoom={() => setProducerZoomOpen(true)}
      />

      <MaterialListTableSection />

      <TrConstantZoomModal
        open={purchaseZoomOpen}
        onClose={() => setPurchaseZoomOpen(false)}
        constField="purchase"
        title="システム定数（仕入先）"
        constants={trConstantList}
        onSelect={(_code, constName) => {
          setDraft((p) => ({ ...p, purchase: constName }));
        }}
      />
      <TrConstantZoomModal
        open={producerZoomOpen}
        onClose={() => setProducerZoomOpen(false)}
        constField="producer"
        title="システム定数（生産者）"
        constants={trConstantList}
        onSelect={(_code, constName) => {
          setDraft((p) => ({ ...p, producer: constName }));
        }}
      />
    </main>
  );
}
