# TeaBlend Report Helper

React 版 TeaBlend から `localhost` 経由で呼び出す、ローカル帳票ヘルパーです。

## 現在できること

- `GET /api/v1/health`
- `GET /api/v1/reports`
- `POST /api/v1/reports/package_report/preview`
  - `Templates/package_report.rrpt` を RapidReport でプレビュー表示
- `POST /api/v1/reports/package_grade_report/preview`
  - `Templates/grade_report.rrpt` を RapidReport でプレビュー表示（格付表）
- `POST /api/v1/reports/factory2_report/preview`
  - 工程に応じて `blend_report.rrpt` / `finish_report.rrpt` / `firepan_report.rrpt` をプレビュー表示（第2工場製造報告書）
- `POST /api/v1/reports/factory2_grade_report/preview`
  - `Templates/grade_report_fa2.rrpt` を RapidReport でプレビュー表示（第2工場格付表）

## 依存ファイル

| 種別 | パス |
|------|------|
| 帳票定義 | `tools/TeaBlendReportHelper/Templates/*.rrpt` |
| RapidReport DLL | `tools/TeaBlendReportHelper/ThirdParty/RapidReport/dotnetcore/` |
| GDI プレビュー | `tools/TeaBlendReportHelper/ThirdParty/RapidReport/dotnetcore_gdi/` |

ビルド時に帳票定義は出力フォルダの `Templates/` にコピーされます。

## 起動方法

```powershell
dotnet run --project tools/TeaBlendReportHelper
```

**既にヘルパーが起動しているとき**は、もう一度 `dotnet run` すると exe がロックされてビルドに失敗します（MSB3026 / MSB3027）。  
先に停止してから起動し直してください。

```powershell
Stop-Process -Name TeaBlendReportHelper -Force -ErrorAction SilentlyContinue
dotnet run --project tools/TeaBlendReportHelper
```

コードを変えていないときは、ビルドを省略して起動だけできます。

```powershell
dotnet run --project tools/TeaBlendReportHelper --no-build
```

起動後:

```text
http://127.0.0.1:48721
```

`GET /api/v1/health` の `rapidReportReady: true` なら RapidReport 接続準備完了です。

### デスクトップ起動・利用者配布

開発／利用者 PC 向けのコマンド一覧・ショートカット配置手順は次を参照してください。

- [docs/REPORT_HELPER_DESKTOP_LAUNCH.md](../../docs/REPORT_HELPER_DESKTOP_LAUNCH.md)
- 開発用 bat: `scripts/Start-ReportHelper-Dev.bat` / `scripts/Restart-ReportHelper-Dev.bat`
- 開発用ショートカット一括作成: `scripts/Install-DesktopShortcuts-Dev.ps1`
- 利用者用 bat: `scripts/Start-ReportHelper-User.bat`

## React 側

製造報告書登録画面の「報告書」ボタンから、現在のフォーム内容を helper に POST します。

## 受信 JSON の保存先（デバッグ用）

```text
%LocalAppData%\TeaBlend\ReportHelper\payloads
```

## 拡張ポイント

- `Mapping/PackageReportPayloadMapper.cs` … React JSON → 帳票 DTO
- `RapidReport/RapidReportPreviewService.cs` … rrpt 読込・プレビュー
- `Reports/PackageReportHandler.cs` … `package_report` 帳票ハンドラ

他帳票を追加する場合は `IReportHandler` 実装を増やし、`ReportHandlerRegistry` に登録します。
