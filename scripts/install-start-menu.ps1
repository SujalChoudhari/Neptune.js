$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$programs = [Environment]::GetFolderPath('Programs')
if (-not $programs) { throw 'Windows could not locate your Start menu Programs folder.' }
$shortcutPath = Join-Path $programs 'Neptune.js Triton.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
# Keep startup errors visible, including missing build prerequisites.
$shortcut.Arguments = '-NoProfile -NoExit -ExecutionPolicy Bypass -File "' + (Join-Path $repo 'scripts\start-editor.ps1') + '"'
$shortcut.WorkingDirectory = $repo
$shortcut.IconLocation = (Join-Path $repo 'triton\src-tauri\icons\icon.ico') + ',0'
$shortcut.Description = 'Launch the Neptune.js Triton editor from this development checkout'
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Host "Installed $shortcutPath"
