/**
 * 原料一覧の結果テーブル領域（検索適用後の derived atom のみ購読）。
 */
import { useAtomValue } from "jotai";
import { MantineZoomProvider } from "../mantine/MantineZoomProvider";
import { MaterialListMantineTable } from "./materialListMantineTable";
import { filteredMaterialListAtom, materialSearchExecutedAtom } from "./store";

export function MaterialListTableSection() {
  const materialList = useAtomValue(filteredMaterialListAtom);
  const searchExecuted = useAtomValue(materialSearchExecutedAtom);

  return (
    <section className="tableWrap materialListTableWrap">
      <MantineZoomProvider>
        <MaterialListMantineTable rows={materialList} searchExecuted={searchExecuted} />
      </MantineZoomProvider>
    </section>
  );
}
