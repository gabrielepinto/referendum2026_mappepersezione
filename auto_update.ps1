$ErrorActionPreference = "Stop"

param(
  [int]$IntervalMinutes = 10,
  [switch]$RunOnce,
  [switch]$PushToGitHub
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$pythonCandidates = @(
  "C:\Users\gabri\anaconda3\python.exe",
  "python"
)

$pythonExe = $null
foreach ($candidate in $pythonCandidates) {
  if (Test-Path $candidate) {
    $pythonExe = $candidate
    break
  }

  $command = Get-Command $candidate -ErrorAction SilentlyContinue
  if ($command) {
    $pythonExe = $command.Source
    break
  }
}

if (-not $pythonExe) {
  throw "Python non trovato. Aggiorna la lista in auto_update.ps1."
}

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$logPath = Join-Path $logDir "auto_update.log"

function Write-Log {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$timestamp] $Message"
  Write-Host $line
  Add-Content -Path $logPath -Value $line
}

function Invoke-CheckedCommand {
  param(
    [string]$Label,
    [string]$FilePath,
    [string[]]$Arguments
  )

  Write-Log "Avvio: $Label"
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label fallito con codice $LASTEXITCODE"
  }
  Write-Log "Completato: $Label"
}

function Run-UpdateCycle {
  Write-Log "Inizio ciclo di aggiornamento"

  Invoke-CheckedCommand `
    -Label "Esecuzione notebook" `
    -FilePath $pythonExe `
    -Arguments @(
      "-m",
      "jupyter",
      "nbconvert",
      "--to",
      "notebook",
      "--execute",
      "--inplace",
      "--ExecutePreprocessor.timeout=-1",
      "scraping_referendum_sezioni.ipynb"
    )

  Invoke-CheckedCommand `
    -Label "Calcolo benchmark Politiche 2022" `
    -FilePath $pythonExe `
    -Arguments @("build_politiche2022.py")

  Write-Log "Avvio: Ricostruzione bundle città"
  & (Join-Path $root "build_city_bundles.ps1")
  if ($LASTEXITCODE -ne 0) {
    throw "Ricostruzione bundle città fallita con codice $LASTEXITCODE"
  }
  Write-Log "Completato: Ricostruzione bundle città"

  if ($PushToGitHub) {
    Write-Log "Controllo modifiche Git"
    $statusOutput = git status --porcelain
    if ($LASTEXITCODE -ne 0) {
      throw "git status fallito con codice $LASTEXITCODE"
    }

    if ($statusOutput) {
      $commitMessage = "Auto update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

      Write-Log "Avvio: git add"
      git add .
      if ($LASTEXITCODE -ne 0) {
        throw "git add fallito con codice $LASTEXITCODE"
      }
      Write-Log "Completato: git add"

      Write-Log "Avvio: git commit"
      git commit -m $commitMessage
      if ($LASTEXITCODE -ne 0) {
        throw "git commit fallito con codice $LASTEXITCODE"
      }
      Write-Log "Completato: git commit"

      Write-Log "Avvio: git push"
      git push
      if ($LASTEXITCODE -ne 0) {
        throw "git push fallito con codice $LASTEXITCODE"
      }
      Write-Log "Completato: git push"
    } else {
      Write-Log "Nessuna modifica Git da pubblicare"
    }
  }

  Write-Log "Fine ciclo di aggiornamento"
}

if ($RunOnce) {
  Run-UpdateCycle
  exit 0
}

while ($true) {
  try {
    Run-UpdateCycle
  } catch {
    Write-Log "Errore nel ciclo: $($_.Exception.Message)"
  }

  Write-Log "Attesa di $IntervalMinutes minuti prima del prossimo ciclo"
  Start-Sleep -Seconds ($IntervalMinutes * 60)
}
