# デスクトップに帳票ヘルパー起動ショートカットを作成（開発 PC 用）
# 使い方（TeaBlend-react ルートで）:
#   powershell -ExecutionPolicy Bypass -File tools/TeaBlendReportHelper/scripts/Install-DesktopShortcuts-Dev.ps1

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$desktop = [Environment]::GetFolderPath("Desktop")
$Wsh = New-Object -ComObject WScript.Shell

function New-BatShortcut([string]$Name, [string]$BatRelPath) {
  $bat = Join-Path $repoRoot $BatRelPath
  if (-not (Test-Path $bat)) {
    throw "bat が見つかりません: $bat"
  }
  $lnkPath = Join-Path $desktop "$Name.lnk"
  $s = $Wsh.CreateShortcut($lnkPath)
  $s.TargetPath = $bat
  $s.WorkingDirectory = $repoRoot
  $s.Description = "TeaBlend Report Helper"
  $s.Save()
  Write-Host "作成: $lnkPath"
}

New-BatShortcut "TeaBlend帳票ヘルパー（開発）" "tools\TeaBlendReportHelper\scripts\Start-ReportHelper-Dev.bat"
New-BatShortcut "TeaBlend帳票ヘルパー再起動（開発）" "tools\TeaBlendReportHelper\scripts\Restart-ReportHelper-Dev.bat"

Write-Host ""
Write-Host "完了しました。デスクトップのショートカットから起動できます。"
Write-Host "健康確認: Invoke-RestMethod http://127.0.0.1:48721/api/v1/health"
