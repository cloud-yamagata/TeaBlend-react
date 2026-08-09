/**
 * ロット在庫 ZOOM 検証用 Mantine ラッパー（アプリ全体の MUI とは分離）。
 */
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function MantineZoomProvider({ children }: Props) {
  return (
    <MantineProvider defaultColorScheme="light" cssVariablesSelector=":root">
      {children}
    </MantineProvider>
  );
}
