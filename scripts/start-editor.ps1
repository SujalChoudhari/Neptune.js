$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$tools = Join-Path (Split-Path -Parent $repo) 'DevTools'
$nodePathFile = Join-Path $tools 'node-path.txt'
if (Test-Path -LiteralPath $nodePathFile) {
    $nodeBin = (Get-Content -LiteralPath $nodePathFile -Raw).Trim()
    $env:Path = "$nodeBin;$tools\npm-global;$tools\cargo\bin;$env:Path"
    $env:CARGO_HOME = Join-Path $tools 'cargo'
    $env:RUSTUP_HOME = Join-Path $tools 'rustup'
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $tools 'playwright'
}
Set-Location -LiteralPath $repo
$yarn = Get-Command yarn.cmd -ErrorAction Stop
Write-Host 'Starting Neptune editor...'
& $yarn.Source --cwd (Join-Path $repo 'triton') tauri dev
exit $LASTEXITCODE
