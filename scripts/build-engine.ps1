$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$EngineSource = Join-Path $Root "engine\daemon.py"
$EngineDist = Join-Path $Root "engine\dist"
$EngineBuild = Join-Path $Root "engine\build"
$EngineExe = Join-Path $EngineDist "chupacabra-engine.exe"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python não foi encontrado no PATH. Instale Python 3.12+ para o ambiente de desenvolvimento."
}

Write-Host "[Chupacabra] Verificando PyInstaller..."
python -c "import PyInstaller" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Chupacabra] Instalando dependências de build..."
    python -m pip install -r (Join-Path $Root "requirements-build.txt")
}

New-Item -ItemType Directory -Force -Path $EngineDist | Out-Null

if (Test-Path $EngineBuild) {
    Remove-Item -Recurse -Force $EngineBuild
}

if (Test-Path $EngineExe) {
    Remove-Item -Force $EngineExe
}

Write-Host "[Chupacabra] Gerando engine Windows self-contained..."
python -m PyInstaller `
    --noconfirm `
    --clean `
    --onefile `
    --name chupacabra-engine `
    --paths $Root `
    --paths (Join-Path $Root "mapScraper") `
    --hidden-import pipeline.orchestrator `
    --hidden-import enrichment.features `
    --hidden-import enrichment.scoring `
    --hidden-import enrichment.web_scraper `
    --hidden-import mapScraper.placesCrawlerV2 `
    --collect-all aiohttp `
    --collect-all pandas `
    $EngineSource

if (-not (Test-Path $EngineExe)) {
    throw "PyInstaller terminou sem gerar $EngineExe"
}

Write-Host "[Chupacabra] Engine gerado em: $EngineExe"