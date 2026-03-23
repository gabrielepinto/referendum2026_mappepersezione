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
  $resultsPath = Join-Path $dataDir ("results_{0}.json" -f $city)
  $politiche2022Path = Join-Path $dataDir ("politiche2022_{0}.json" -f $city)
  $turnoutSlots = @()
  $turnoutUpdatedAt = $null
  $resultsUpdatedAt = $null
  $politiche2022UpdatedAt = $null
  $turnoutLookup = @{}
  $resultsLookup = @{}
  $politiche2022Lookup = @{}

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
      $turnoutUpdatedAt = [string]$turnoutPayload.updated_at
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

      $turnoutLookup[[int]$row.section] = [pscustomobject]@{
        section = [int]$row.section
        name = [string]$row.name
        turnout = $turnout
      }
    }
  }

  if (Test-Path $resultsPath) {
    $resultsPayload = Get-Content $resultsPath -Raw | ConvertFrom-Json
    if ($resultsPayload.updated_at) {
      $resultsUpdatedAt = [string]$resultsPayload.updated_at
    }

    foreach ($row in $resultsPayload.sections) {
      $resultsLookup[[int]$row.section] = [pscustomobject]@{
        section = [int]$row.section
        name = [string]$row.name
        results = [ordered]@{
          yes = if ($null -ne $row.results.yes) { [double]$row.results.yes } else { $null }
          no = if ($null -ne $row.results.no) { [double]$row.results.no } else { $null }
          yes_pct = if ($null -ne $row.results.yes_pct) { [double]$row.results.yes_pct } else { $null }
          no_pct = if ($null -ne $row.results.no_pct) { [double]$row.results.no_pct } else { $null }
          blank = if ($null -ne $row.results.blank) { [double]$row.results.blank } else { $null }
          null = if ($null -ne $row.results.null) { [double]$row.results.null } else { $null }
          turnout = if ($null -ne $row.results.turnout) { [double]$row.results.turnout } else { $null }
        }
      }
    }
  }

  if (Test-Path $politiche2022Path) {
    $politiche2022Payload = Get-Content $politiche2022Path -Raw | ConvertFrom-Json
    if ($politiche2022Payload.updated_at) {
      $politiche2022UpdatedAt = [string]$politiche2022Payload.updated_at
    }

    foreach ($row in $politiche2022Payload.sections) {
      $politiche2022Lookup[[int]$row.section] = [pscustomobject]@{
        section = [int]$row.section
        politiche2022 = [ordered]@{
          cdx_votes = if ($null -ne $row.politiche2022.cdx_votes) { [double]$row.politiche2022.cdx_votes } else { $null }
          cdx_pct = if ($null -ne $row.politiche2022.cdx_pct) { [double]$row.politiche2022.cdx_pct } else { $null }
          csxm5s_votes = if ($null -ne $row.politiche2022.csxm5s_votes) { [double]$row.politiche2022.csxm5s_votes } else { $null }
          csxm5s_pct = if ($null -ne $row.politiche2022.csxm5s_pct) { [double]$row.politiche2022.csxm5s_pct } else { $null }
          total_votes = if ($null -ne $row.politiche2022.total_votes) { [double]$row.politiche2022.total_votes } else { $null }
          turnout = if ($null -ne $row.politiche2022.turnout) { [double]$row.politiche2022.turnout } else { $null }
        }
      }
    }
  }

  $allSections = @($turnoutLookup.Keys + $resultsLookup.Keys + $politiche2022Lookup.Keys | Sort-Object -Unique)
  $sections = @()

  foreach ($sectionId in $allSections) {
    $turnoutRow = if ($turnoutLookup.ContainsKey($sectionId)) { $turnoutLookup[$sectionId] } else { $null }
    $resultsRow = if ($resultsLookup.ContainsKey($sectionId)) { $resultsLookup[$sectionId] } else { $null }
    $politiche2022Row = if ($politiche2022Lookup.ContainsKey($sectionId)) { $politiche2022Lookup[$sectionId] } else { $null }

    $sections += [pscustomobject]@{
      section = [int]$sectionId
      name = if ($turnoutRow) { [string]$turnoutRow.name } elseif ($resultsRow) { [string]$resultsRow.name } else { "SEZIONE $sectionId" }
      turnout = if ($turnoutRow) { $turnoutRow.turnout } else { $null }
      results = if ($resultsRow) { $resultsRow.results } else { $null }
      politiche2022 = if ($politiche2022Row) { $politiche2022Row.politiche2022 } else { $null }
    }
  }

  $payload = [ordered]@{
    slug = $city
    meta = [ordered]@{
      turnout_slots = $turnoutSlots
      results_available = $resultsLookup.Count -gt 0
      politiche2022_available = $politiche2022Lookup.Count -gt 0
      turnout_updated_at = $turnoutUpdatedAt
      results_updated_at = $resultsUpdatedAt
      politiche2022_updated_at = $politiche2022UpdatedAt
      updated_at = if ($resultsUpdatedAt) { $resultsUpdatedAt } elseif ($turnoutUpdatedAt) { $turnoutUpdatedAt } else { "2026-03-23T00:00:00+01:00" }
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
