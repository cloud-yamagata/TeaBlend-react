@echo off
chcp 65001 >nul
setlocal

rem 開発 PC: TeaBlend 帳票ヘルパー起動
rem デスクトップショートカットのリンク先に指定してください。

set "ROOT=%~dp0..\..\.."
pushd "%ROOT%" || (
  echo [ERROR] TeaBlend-react ルートに移動できません: %ROOT%
  pause
  exit /b 1
)

echo TeaBlend Report Helper ^(開発^) を起動します...
echo ルート: %CD%
echo URL: http://127.0.0.1:48721
echo.

dotnet run --project tools/TeaBlendReportHelper --no-build
if errorlevel 1 (
  echo.
  echo --no-build で失敗したため、ビルド付きで再試行します...
  dotnet run --project tools/TeaBlendReportHelper
)

popd
endlocal
