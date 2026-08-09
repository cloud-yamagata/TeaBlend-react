@echo off
chcp 65001 >nul
setlocal

rem 開発 PC: 帳票ヘルパーを停止してから再起動（C# 変更反映用）

set "ROOT=%~dp0..\..\.."
pushd "%ROOT%" || (
  echo [ERROR] TeaBlend-react ルートに移動できません: %ROOT%
  pause
  exit /b 1
)

echo 既存の TeaBlendReportHelper を停止します...
taskkill /IM TeaBlendReportHelper.exe /F >nul 2>&1

echo.
echo TeaBlend Report Helper ^(開発・再起動^) を起動します...
echo ルート: %CD%
echo URL: http://127.0.0.1:48721
echo.

dotnet run --project tools/TeaBlendReportHelper

popd
endlocal
