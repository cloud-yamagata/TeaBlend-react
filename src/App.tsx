/**
 * 【処理概要】
 *   アプリケーションシェル全体: サイドメニュー（YAML 由来）、ルーティング、起動時マスタ bootstrap、
 *   レポート画面は `screenKey` が registry にあれば `ReportPage`、なければ `DummyPage`。
 *
 * 【主なルート／パラメータ】
 *   - `/` … ホーム
 *   - `/material-list` … 原料一覧
 *   - `/purchase-resale-list` … 振分実績一覧
 *   - `/monthly-plan` … 月次計画
 *   - `/menu-editor` … メニュー YAML 編集（localStorage 保存）
 *   - `/api-target` … FastAPI 接続先の選択・候補 YAML 編集
 *   - `/screen/:screenKey` … メニューから遷移。`hasReportDef(screenKey)` でレポートかダミーか切替
 *
 * 【メンテナンス】
 *   - 新画面をルートに足す: `<Routes>` に `<Route>` を追加し、必要ならメニュー YAML に `screenKey` または `path` を追加。
 *   - マスタ追加: `repository/masterData.ts` の bootstrap と API 側 `main.py` の router 登録を同期させる。
 *   - API 接続先候補: `public/api-targets.yaml`
 */
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { bootstrapMasterDataAtom } from "./repository/masterData";
import MaterialListPage from "./MaterialList/MaterialListPage";
import MaterialPurchasePage from "./MaterialPurchase/MaterialPurchasePage";
import ItemCorrectPage from "./ItemCorrect/ItemCorrectPage";
import SalesPlanItemCorrectPage from "./SalesPlanItemCorrect/SalesPlanItemCorrectPage";
import MonthlySalesPlanCorrectPage from "./MonthlySalesPlanCorrect/MonthlySalesPlanCorrectPage";
import SalesPlanExcelImportPage from "./SalesPlanExcelImport/SalesPlanExcelImportPage";
import ShipmentCorrectPage from "./ShipmentCorrect/ShipmentCorrectPage";
import ItemBomCorrectPage from "./ItemBomCorrect/ItemBomCorrectPage";
import TrConstantCorrectPage from "./TrConstantCorrect/TrConstantCorrectPage";
import MonthlyPlanPage from "./MonthlyPlan/MonthlyPlanPage";
import Factory2LotManufacturePage from "./Factory2LotManufacture/Factory2LotManufacturePage";
import PackageLotRegistPage from "./PackageReport/PackageLotRegistPage";
import PurchaseTtransferPage from "./PurchaseTtransfer/PurchaseTtransferPage";
import PurchaseReceivePage from "./PurchaseReceive/PurchaseReceivePage";
import PurchaseResaleListPage from "./PurchaseResaleList/PurchaseResaleListPage";
import BlendCategorysPage from "./BlendCategorys/BlendCategorysPage";
import FinishCategorysPage from "./FinishCategorys/FinishCategorysPage";
import FirepanCategorysPage from "./FirepanCategorys/FirepanCategorysPage";
import StoreTransferFa2Page from "./StoreTransferFa2/StoreTransferFa2Page";
import Factory1RresultPage from "./Factory1Rresult/Factory1RresultPage";
import MaterialRresultPage from "./MaterialRresult/MaterialRresultPage";
import DummyPage from "./pages/DummyPage";
import MenuEditorPage from "./pages/MenuEditorPage";
import ApiTargetPage from "./pages/ApiTargetPage";
import type { MenuConfig, MenuItem } from "./menu/types";
import { fetchDefaultMenuYaml, loadUserMenuYaml, parseMenuYaml } from "./menu/menuStore";
import {
  API_TARGET_CHANGED_EVENT,
  getApiTargetsYamlText,
  getEffectiveApiTarget,
  initApiTargets
} from "./config/apiTargetsStore";
import { getMaterialApiBaseUrl } from "./config/api";
import ReportPage from "./reports/ReportPage";
import { hasReportDef } from "./reports/registry";
import LoadingOverlay from "./components/LoadingOverlay";
import { useBusyTask } from "./ui/useBusyTask";
import { busySplashAtom } from "./ui/busy";
import "./app-shell.css";

function MasterDataBootstrap({ ready }: { ready: boolean }) {
  const run = useSetAtom(bootstrapMasterDataAtom);
  const setSplash = useSetAtom(busySplashAtom);
  const runBusy = useBusyTask();
  useEffect(() => {
    if (!ready) return;
    // 接続先 YAML 準備後にマスタ取得。接続先変更後の再取得は ApiTargetPage 側で行う。
    void runBusy(async () => {
      setSplash(true);
      try {
        await run();
      } finally {
        setSplash(false);
      }
    }, "マスタ取得中...");
  }, [ready, run, setSplash]);
  return null;
}

const defaultPathForScreenKey = (screenKey: string): string => `/screen/${encodeURIComponent(screenKey)}`;

const getItemPath = (item: MenuItem): string => item.path ?? defaultPathForScreenKey(item.screenKey);

function useActivePath(): string {
  const loc = useLocation();
  return loc.pathname;
}

function HomePage() {
  return (
    <main className="page">
      <header className="toolbar">
        <h1 className="title">メニュー</h1>
      </header>
      <section className="card">
        <p className="status">左のメニューから画面を選択してください。</p>
      </section>
    </main>
  );
}

type GlobalMenuProps = {
  config: MenuConfig;
  menuOpen: boolean;
  onToggleMenu: () => void;
  apiTargetLabel: string;
  apiTargetUrl: string;
};

function GlobalMenu({ config, menuOpen, onToggleMenu, apiTargetLabel, apiTargetUrl }: GlobalMenuProps) {
  const activePath = useActivePath();
  const storageKey = "teablend.menuExpandedGroups.v1";
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(expandedGroups)));
    } catch {
      // ignore
    }
  }, [expandedGroups]);

  const expandAll = () => setExpandedGroups(new Set(config.groups.map((g) => g.title)));
  const collapseAll = () => setExpandedGroups(new Set());
  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <aside className={`sideNav${menuOpen ? "" : " isCollapsed"}`} aria-label="メニュー">
      <div className="sideNavHeader">
        <div className="sideNavHeaderRow">
          {menuOpen && (
            <div className="brand">
              <div className="brandTitle">{config.title ?? "TeaBlend"}</div>
              <div className="brandSub">お茶屋さん業務システム</div>
            </div>
          )}
          <button
            type="button"
            className="sideNavCollapseToggle"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            title={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            <span>{menuOpen ? "メニュー" : "M"}</span>
            <span className="sideNavCollapseToggleIcon">{menuOpen ? " ▼" : " ▶"}</span>
          </button>
        </div>
        {menuOpen && (
          <div className="sideNavControls" aria-label="メニュー展開操作">
            <button type="button" className="sideNavControlButton" onClick={expandAll}>
              全て開く
            </button>
            <button type="button" className="sideNavControlButton ghost" onClick={collapseAll}>
              閉じる
            </button>
          </div>
        )}
      </div>
      {menuOpen && (
        <>
          <nav className="sideNavBody">
            {config.groups.map((group) => (
              <section key={group.title} className="sideNavGroup">
                <button
                  type="button"
                  className="sideNavGroupToggle"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={expandedGroups.has(group.title)}
                >
                  <span className="sideNavGroupToggleIcon">{expandedGroups.has(group.title) ? "▼" : "▶"}</span>
                  <span className="sideNavGroupTitleText">{group.title}</span>
                </button>
                {expandedGroups.has(group.title) && (
                  <div className="sideNavItems">
                    {group.items.map((item) => {
                      const to = getItemPath(item);
                      const isActive = activePath === to;
                      return (
                        <NavLink key={`${group.title}-${item.screenKey}-${item.label}`} to={to} className={`sideNavLink${isActive ? " isActive" : ""}`}>
                          <span className="sideNavLinkLabel">{item.label}</span>
                          <span className="sideNavLinkKey">{item.screenKey}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </nav>
          <div className="sideNavFooter">
            <div className="sideNavFooterMeta" title={apiTargetUrl}>
              接続先: {apiTargetLabel}
            </div>
            <NavLink to="/api-target" className={({ isActive }) => `sideNavFooterLink${isActive ? " isActive" : ""}`}>
              API接続先設定
            </NavLink>
            <NavLink to="/menu-editor" className={({ isActive }) => `sideNavFooterLink${isActive ? " isActive" : ""}`}>
              メニュー編集（YAML）
            </NavLink>
          </div>
        </>
      )}
    </aside>
  );
}

export default function App() {
  const [menuYaml, setMenuYaml] = useState<string>("");
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const [menuError, setMenuError] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  const [apiYaml, setApiYaml] = useState<string>("");
  const [apiTargetLabel, setApiTargetLabel] = useState<string>("…");
  const [apiTargetUrl, setApiTargetUrl] = useState<string>("");

  const refreshApiTargetDisplay = () => {
    const effective = getEffectiveApiTarget();
    setApiTargetLabel(effective?.label ?? (import.meta.env.DEV ? "開発プロキシ" : "本社（既定）"));
    setApiTargetUrl(getMaterialApiBaseUrl());
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await initApiTargets();
        if (cancelled) return;
        setApiYaml(getApiTargetsYamlText());
        refreshApiTargetDisplay();
        setApiReady(true);
      } catch (e) {
        if (cancelled) return;
        console.error("[initApiTargets]", e);
        // 接続先YAMLが取れなくても env フォールバックで起動を継続
        setApiReady(true);
        refreshApiTargetDisplay();
      }
      try {
        const userYaml = loadUserMenuYaml();
        const yaml = userYaml ?? (await fetchDefaultMenuYaml());
        const cfg = parseMenuYaml(yaml);
        if (cancelled) return;
        setMenuYaml(yaml);
        setMenuConfig(cfg);
        setMenuError("");
      } catch (e) {
        if (cancelled) return;
        setMenuError(e instanceof Error ? e.message : String(e));
      }
    };
    void run();
    const onApiChanged = () => refreshApiTargetDisplay();
    window.addEventListener(API_TARGET_CHANGED_EVENT, onApiChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(API_TARGET_CHANGED_EVENT, onApiChanged);
    };
  }, []);

  const dummyLabelByScreenKey = useMemo(() => {
    const m = new Map<string, string>();
    if (!menuConfig) return m;
    for (const g of menuConfig.groups) {
      for (const item of g.items) {
        if (!m.has(item.screenKey)) m.set(item.screenKey, item.label);
      }
    }
    return m;
  }, [menuConfig]);

  function ScreenRoute() {
    const loc = useLocation();
    const m = loc.pathname.match(/^\/screen\/([^/]+)$/);
    const screenKey = m ? decodeURIComponent(m[1]) : "";
    if (screenKey === "CroudeTea") {
      return <Factory2LotManufacturePage />;
    }
    if (screenKey === "PackageReport") {
      return <PackageLotRegistPage />;
    }
    if (screenKey === "PurchaseTtransfer") {
      return <PurchaseTtransferPage />;
    }
    if (screenKey === "PurchaseReceive") {
      return <PurchaseReceivePage />;
    }
    if (screenKey === "PurchaseResaleList") {
      return <PurchaseResaleListPage />;
    }
    if (screenKey === "BlendCategorys") {
      return <BlendCategorysPage />;
    }
    if (screenKey === "FinishCategorys") {
      return <FinishCategorysPage />;
    }
    if (screenKey === "FirepanCategorys") {
      return <FirepanCategorysPage />;
    }
    if (screenKey === "StoreTransferFa2") {
      return <StoreTransferFa2Page />;
    }
    if (screenKey === "MaterialPurchase") {
      return <MaterialPurchasePage />;
    }
    if (screenKey === "ItemCorrect") {
      return <ItemCorrectPage />;
    }
    if (screenKey === "SalesPlanItemCorrect") {
      return <SalesPlanItemCorrectPage />;
    }
    if (screenKey === "MonthlySalesPlanCorrect") {
      return <MonthlySalesPlanCorrectPage />;
    }
    if (screenKey === "SalesPlanExcelImport") {
      return <SalesPlanExcelImportPage />;
    }
    if (screenKey === "ShipmentCorrect") {
      return <ShipmentCorrectPage />;
    }
    if (screenKey === "ItemBomCorrect") {
      return <ItemBomCorrectPage />;
    }
    if (screenKey === "TrConstantCorrect") {
      return <TrConstantCorrectPage />;
    }
    if (screenKey === "Factory1Rresult") {
      return <Factory1RresultPage />;
    }
    if (screenKey === "MaterialRresult") {
      return <MaterialRresultPage />;
    }
    // メニュー定義の screenKey とレポート registry の ID を一致させる
    if (hasReportDef(screenKey)) {
      return <ReportPage reportId={screenKey} />;
    }
    return <DummyPage label={dummyLabelByScreenKey.get(screenKey)} />;
  }

  return (
    <BrowserRouter>
      <MasterDataBootstrap ready={apiReady} />
      <div className={`appShell${menuOpen ? "" : " menuCollapsed"}`}>
        {menuConfig ? (
          <GlobalMenu
            config={menuConfig}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            apiTargetLabel={apiTargetLabel}
            apiTargetUrl={apiTargetUrl}
          />
        ) : (
          <aside className="sideNav sideNavLoading">メニュー読み込み中...</aside>
        )}
        <div className="appMain">
          <LoadingOverlay />
          {menuError && (
            <div className="topErrorBar" role="alert">
              メニュー読み込みエラー: {menuError}
            </div>
          )}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/material-list" element={<MaterialListPage />} />
            <Route path="/material-purchase" element={<MaterialPurchasePage />} />
            <Route path="/purchase-resale-list" element={<PurchaseResaleListPage />} />
            <Route path="/monthly-plan" element={<MonthlyPlanPage />} />
            <Route path="/factory2-lot-manufacture" element={<Factory2LotManufacturePage />} />
            <Route path="/blend-categorys" element={<BlendCategorysPage />} />
            <Route path="/finish-categorys" element={<FinishCategorysPage />} />
            <Route path="/firepan-categorys" element={<FirepanCategorysPage />} />
            <Route
              path="/menu-editor"
              element={
                <MenuEditorPage
                  initialYaml={menuYaml}
                  onYamlChange={(yamlText) => {
                    try {
                      const cfg = parseMenuYaml(yamlText);
                      setMenuYaml(yamlText);
                      setMenuConfig(cfg);
                      setMenuError("");
                    } catch (e) {
                      setMenuError(e instanceof Error ? e.message : String(e));
                    }
                  }}
                />
              }
            />
            <Route
              path="/api-target"
              element={
                <ApiTargetPage
                  initialYaml={apiYaml}
                  onYamlChange={(yamlText) => {
                    setApiYaml(yamlText);
                    refreshApiTargetDisplay();
                  }}
                  onTargetChange={refreshApiTargetDisplay}
                />
              }
            />
            <Route
              path="/screen/:screenKey"
              element={<ScreenRoute />}
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
