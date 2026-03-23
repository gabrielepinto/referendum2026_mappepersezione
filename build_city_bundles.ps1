$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cityDir = Join-Path $root "city-data"
$dataDir = Join-Path $root "data"
$geoDir = Join-Path $root "geoframes"
$slotOrder = @("sun_12", "sun_19", "sun_23", "mon_12", "mon_15")
$legacySlotMap = @{
  "12" = "sun_12"
  "19" = "sun_19"
  "23" = "sun_23"
  "15" = "mon_15"
  "turnout12" = "sun_12"
  "turnout19" = "sun_19"
  "turnout23" = "sun_23"
  "turnout15" = "mon_15"
  "turnout_mon_12" = "mon_12"
  "turnout_mon_15" = "mon_15"
}

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
  $updatedAt = $null

  if (Test-Path $turnoutPath) {
    $turnoutPayload = Get-Content $turnoutPath -Raw | ConvertFrom-Json
    if ($turnoutPayload.turnout_slots) {
      $normalizedDeclared = @()
      foreach ($slot in $turnoutPayload.turnout_slots) {
        $slotName = [string]$slot
        if ($legacySlotMap.ContainsKey($slotName)) {
          $slotName = $legacySlotMap[$slotName]
        }
        $normalizedDeclared += $slotName
      }
      $turnoutSlots = @($slotOrder | Where-Object { $normalizedDeclared -contains $_ })
    }
    if ($turnoutPayload.updated_at) {
      $updatedAt = [string]$turnoutPayload.updated_at
    }

    foreach ($row in $turnoutPayload.sections) {
      $turnout = [ordered]@{}

      if ($row.turnout -ne $null) {
        foreach ($prop in $row.turnout.PSObject.Properties) {
          $slotName = [string]$prop.Name
          if ($legacySlotMap.ContainsKey($slotName)) {
            $slotName = $legacySlotMap[$slotName]
          }
          $turnout[$slotName] = if ($null -ne $prop.Value) { [double]$prop.Value } else { $null }
        }
      } else {
        foreach ($legacyKey in $legacySlotMap.Keys) {
          if ($row.PSObject.Properties.Name -contains $legacyKey) {
            $slotName = $legacySlotMap[$legacyKey]
            $turnout[$slotName] = if ($null -ne $row.$legacyKey) { [double]$row.$legacyKey } else { $null }
          }
        }
      }

      if (-not $turnoutSlots.Count -and $turnout.Count) {
        $turnoutSlots = @($slotOrder | Where-Object { $turnout.Keys -contains $_ })
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
      updated_at = if ($updatedAt) { $updatedAt } else { "2026-03-23T00:00:00+01:00" }
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
