$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDirectory = Join-Path $projectRoot "backend"
$frontendDirectory = Join-Path $projectRoot "frontend"
$pythonExecutable = Join-Path $projectRoot ".venv\Scripts\python.exe"
$npmExecutable = (Get-Command npm.cmd -ErrorAction Stop).Source
$startedProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()

function Test-LocalUrl {
    param([string]$Url)
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForUrl {
    param([string]$Url, [int]$Attempts = 30)
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        if (Test-LocalUrl -Url $Url) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

if (-not (Test-Path -LiteralPath $pythonExecutable)) {
    throw "Python do projeto nao encontrado em: $pythonExecutable"
}

Write-Host ""
Write-Host "Iniciando o Painel de Produtividade Operacional..." -ForegroundColor Yellow

try {
    if (Test-LocalUrl -Url "http://127.0.0.1:8000/api/v1/health") {
        Write-Host "Backend ja estava ativo." -ForegroundColor DarkYellow
    }
    else {
        $backendProcess = Start-Process -FilePath $pythonExecutable -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru
        $startedProcesses.Add($backendProcess)
    }

    if (Test-LocalUrl -Url "http://127.0.0.1:5173") {
        Write-Host "Frontend ja estava ativo." -ForegroundColor DarkYellow
    }
    else {
        $frontendProcess = Start-Process -FilePath $npmExecutable -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1") -WorkingDirectory $frontendDirectory -WindowStyle Hidden -PassThru
        $startedProcesses.Add($frontendProcess)
    }

    $backendReady = Wait-ForUrl -Url "http://127.0.0.1:8000/api/v1/health"
    $frontendReady = Wait-ForUrl -Url "http://127.0.0.1:5173"

    if (-not $backendReady -or -not $frontendReady) {
        throw "Um dos servicos nao iniciou dentro do tempo esperado."
    }

    Write-Host ""
    Write-Host "Sistema iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Dashboard: http://127.0.0.1:5173" -ForegroundColor Cyan
    Write-Host "API:       http://127.0.0.1:8000/docs" -ForegroundColor Cyan
    Write-Host ""

    if ($startedProcesses.Count -gt 0) {
        Write-Host "Mantenha esta janela aberta. Pressione Ctrl+C para encerrar." -ForegroundColor Gray
        while ($true) {
            foreach ($process in $startedProcesses) {
                if ($process.HasExited) { throw "Um dos servicos foi encerrado inesperadamente." }
            }
            Start-Sleep -Seconds 1
        }
    }
}
finally {
    foreach ($process in $startedProcesses) {
        if (-not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
