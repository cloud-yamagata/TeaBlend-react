@echo off
chcp 65001 >nul
setlocal

rem 利用者 PC: 公開済み TeaBlendReportHelper.exe を起動
rem
rem 【使い方】
rem 1. この bat を配布フォルダ（TeaBlendReportHelper.exe と同じ場所）に置く
rem 2. HELPER_DIR を空のまま（同階層起動）か、絶対パスに書き換える
rem 3. デスクトップにショートカットを作成する

rem 空 = この bat と同じフォルダ
set "HELPER_DIR="

if "%HELPER_DIR%"=="" set "HELPER_DIR=%~dp0"
if "%HELPER_DIR:~-1%"=="\" set "HELPER_DIR=%HELPER_DIR:~0,-1%"

set "EXE=%HELPER_DIR%\TeaBlendReportHelper.exe"
if not exist "%EXE%" (
  echo [ERROR] 見つかりません: %EXE%
  echo 配布フォルダに TeaBlendReportHelper.exe と本 bat を配置してください。
  pause
  exit /b 1
)

echo TeaBlend 帳票ヘルパーを起動します...
echo パス: %EXE%
echo URL: http://127.0.0.1:48721
echo.

start "" "%EXE%"
endlocal
