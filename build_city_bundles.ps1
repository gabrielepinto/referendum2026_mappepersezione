$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cityDir = Join-Path $root "city-data"
$dataDir = Join-Path $root "data"
$geoDir = Join-Path $root "geoframes"

if (-not (Test-Path $cityDir)) {
  New-Item -ItemType Directory -Path $cityDir | Out-Null
}

$cities = "roma","milano","napoli","bologna","torino","genova","firenze","palermo","reggiocalabria","taranto"

foreach ($city in $cities) {
  $geoPath = Join-Path $geoDir ("precincts_{0}_bulding.geojson" -f $city)
  if (-not (Test-Path $geoPath)) {
    continue
  }

  $turnoutPath = Join-Path $dataDir ("turnout_{0}.json" -f $city)
  $sections = @()
  $turnoutSlots = @()

  if (Test-Path $turnoutPath) {
    $turnoutPayload = Get-Content $turnoutPath -Raw | ConvertFrom-Json
    if ($turnoutPayload.turnout_slots) {
      $turnoutSlots = @($turnoutPayload.turnout_slots)
    }

    foreach ($row in $turnoutPayload.sections) {
      $turnout = [ordered]@{}
      if ($row.turnout -ne $null) {
        foreach ($prop in $row.turnout.PSObject.Properties) {
          $turnout[$prop.Name] = if ($null -ne $prop.Value) { [double]$prop.Value } else { $null }
        }
      } else {
        if ($row.PSObject.Properties.Name -contains "turnout12") {
          $turnout["12"] = if ($null -ne $row.turnout12) { [double]$row.turnout12 } else { $null }
        }
        if ($row.PSObject.Properties.Name -contains "turnout15") {
          $turnout["15"] = if ($null -ne $row.turnout15) { [double]$row.turnout15 } else { $null }
        }
        if ($row.PSObject.Properties.Name -contains "turnout19") {
          $turnout["19"] = if ($null -ne $row.turnout19) { [double]$row.turnout19 } else { $null }
        }
      }

      if (-not $turnoutSlots.Count -and $turnout.Count) {
        $turnoutSlots = @($turnout.Keys | Sort-Object {[int]$_})
      }

      $sections += [pscustomobject]@{
        section = [int]$row.section
        name = [string]$row.name
        turnout = $turnout
        results = $null
      }
    }
  }

  $payload = [ordered]@{
    slug = $city
    meta = [ordered]@{
      turnout_slots = $turnoutSlots
      results_available = $false
      updated_at = "2026-03-22T19:00:00+01:00"
    }
    sections = $sections
    geojson = Get-Content $geoPath -Raw | ConvertFrom-Json
  }

  $json = $payload | ConvertTo-Json -Depth 100 -Compress
  $content = "window.CITY_DATA = window.CITY_DATA || {}; window.CITY_DATA['$city'] = $json;"
  $bundlePath = Join-Path $cityDir ("{0}.bundle.js" -f $city)
  Set-Content -Path $bundlePath -Value $content -Encoding UTF8
}

Get-ChildItem $cityDir -Filter "*.bundle.js" | Select-Object Name, Length
