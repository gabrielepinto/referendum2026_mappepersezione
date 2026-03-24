const CITY_CONFIG = [
  {
    slug: "roma",
    label: "Roma",
    dataScript: "city-data/roma.bundle.js",
    geojsonDownload: "geoframes/precincts_roma_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_roma.csv",
    turnoutJsonDownload: "data/turnout_roma.json",
    resultsCsvDownload: "scrutini_sezioni/roma.csv",
    resultsJsonDownload: "data/results_roma.json"
  },
  {
    slug: "milano",
    label: "Milano",
    dataScript: "city-data/milano.bundle.js",
    geojsonDownload: "geoframes/precincts_milano_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_milano.csv",
    turnoutJsonDownload: "data/turnout_milano.json",
    resultsCsvDownload: "scrutini_sezioni/milano.csv",
    resultsJsonDownload: "data/results_milano.json"
  },
  {
    slug: "napoli",
    label: "Napoli",
    dataScript: "city-data/napoli.bundle.js",
    geojsonDownload: "geoframes/precincts_napoli_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_napoli.csv",
    turnoutJsonDownload: "data/turnout_napoli.json",
    resultsCsvDownload: "scrutini_sezioni/napoli.csv",
    resultsJsonDownload: "data/results_napoli.json"
  },
  {
    slug: "bologna",
    label: "Bologna",
    dataScript: "city-data/bologna.bundle.js",
    geojsonDownload: "geoframes/precincts_bologna_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_bologna.csv",
    turnoutJsonDownload: "data/turnout_bologna.json",
    resultsCsvDownload: "scrutini_sezioni/bologna.csv",
    resultsJsonDownload: "data/results_bologna.json"
  },
  {
    slug: "torino",
    label: "Torino",
    dataScript: "city-data/torino.bundle.js",
    geojsonDownload: "geoframes/precincts_torino_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_torino.csv",
    turnoutJsonDownload: "data/turnout_torino.json",
    resultsCsvDownload: "scrutini_sezioni/torino.csv",
    resultsJsonDownload: "data/results_torino.json"
  },
  {
    slug: "genova",
    label: "Genova",
    dataScript: "city-data/genova.bundle.js",
    geojsonDownload: "geoframes/precincts_genova_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_genova.csv",
    turnoutJsonDownload: "data/turnout_genova.json",
    resultsCsvDownload: "scrutini_sezioni/genova.csv",
    resultsJsonDownload: "data/results_genova.json"
  },
  {
    slug: "firenze",
    label: "Firenze",
    dataScript: "city-data/firenze.bundle.js",
    geojsonDownload: "geoframes/precincts_firenze_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_firenze.csv",
    turnoutJsonDownload: "data/turnout_firenze.json",
    resultsCsvDownload: "scrutini_sezioni/firenze.csv",
    resultsJsonDownload: "data/results_firenze.json"
  },
  {
    slug: "palermo",
    label: "Palermo",
    dataScript: "city-data/palermo.bundle.js",
    geojsonDownload: "geoframes/precincts_palermo_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_palermo.csv",
    turnoutJsonDownload: "data/turnout_palermo.json",
    resultsCsvDownload: "scrutini_sezioni/palermo.csv",
    resultsJsonDownload: "data/results_palermo.json"
  },
  {
    slug: "reggiocalabria",
    label: "Reggio Calabria",
    dataScript: "city-data/reggiocalabria.bundle.js",
    geojsonDownload: "geoframes/precincts_reggiocalabria_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_reggiocalabria.csv",
    turnoutJsonDownload: "data/turnout_reggiocalabria.json",
    resultsCsvDownload: "scrutini_sezioni/reggiocalabria.csv",
    resultsJsonDownload: "data/results_reggiocalabria.json"
  },
  {
    slug: "taranto",
    label: "Taranto",
    dataScript: "city-data/taranto.bundle.js",
    geojsonDownload: "geoframes/precincts_taranto_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_taranto.csv",
    turnoutJsonDownload: "data/turnout_taranto.json",
    resultsCsvDownload: "scrutini_sezioni/taranto.csv",
    resultsJsonDownload: "data/results_taranto.json"
  }
];

const VIEW_MODE = document.body.dataset.view || "turnout";
const DEFAULT_CITY = "roma";
const TURNOUT_SLOTS = [
  { key: "sun_12", label: "Domenica ore 12" },
  { key: "sun_19", label: "Domenica ore 19" },
  { key: "sun_23", label: "Domenica ore 23" },
  { key: "mon_12", label: "Lunedì ore 12" },
  { key: "mon_15", label: "Lunedì ore 15" }
];
const TURNOUT_SLOT_LABELS = Object.fromEntries(TURNOUT_SLOTS.map((slot) => [slot.key, slot.label]));
const TURNOUT_LEGEND = [
  { color: "#1c2f57", label: "< 40%" },
  { color: "#243b6b", label: "40-44%" },
  { color: "#2a527f", label: "44-48%" },
  { color: "#2f6c9e", label: "48-52%" },
  { color: "#2d879d", label: "52-56%" },
  { color: "#2f9f9c", label: "56-60%" },
  { color: "#43b58e", label: "60-64%" },
  { color: "#57c785", label: "64-68%" },
  { color: "#86de89", label: "68-72%" },
  { color: "#b8f28f", label: "> 72%" }
];

let currentMap = null;
let currentLayer = null;
let currentCitySlug = DEFAULT_CITY;
let currentResultsAverage = null;

function getResultsLegend(cityAverage = 60) {
  const avg = typeof cityAverage === "number" && !Number.isNaN(cityAverage) ? Number(cityAverage.toFixed(1)) : 60;
  const avgPlus4 = Number((avg + 4).toFixed(1));
  const avgPlus8 = Number((avg + 8).toFixed(1));

  return [
    { color: "#1f4e9e", label: "No sotto 42%" },
    { color: "#3b73c7", label: "No 42-46%" },
    { color: "#6d8fe6", label: "No 46-50%" },
    { color: "#b33fb8", label: "No 50-54%" },
    { color: "#d84db7", label: "No 54-58%" },
    { color: "#f0619b", label: `No 58-${avg}%` },
    { color: "#f28f38", label: `No sopra media città (${avg}-${avgPlus4}%)` },
    { color: "#f6bf3a", label: `No ${avgPlus4}-${avgPlus8}%` },
    { color: "#f3eb57", label: `No oltre ${avgPlus8}%` }
  ];
}

function getCityConfig(slug) {
  return CITY_CONFIG.find((city) => city.slug === slug) || CITY_CONFIG[0];
}

function setStatus(message) {
  const node = document.getElementById("status-current");
  if (node) {
    node.textContent = message;
  }
}

function renderCityTabs() {
  const container = document.getElementById("city-tabs");
  container.innerHTML = CITY_CONFIG.map((city) => {
    const activeClass = city.slug === currentCitySlug ? " is-active" : "";
    return `<button class="city-tab${activeClass}" type="button" data-city="${city.slug}">${city.label}</button>`;
  }).join("");

  container.querySelectorAll(".city-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const slug = button.dataset.city;
      if (slug && slug !== currentCitySlug) {
        loadCity(slug);
      }
    });
  });
}

function getSlotLabel(slot) {
  return TURNOUT_SLOT_LABELS[slot] || slot;
}

function normalizeLegacySlot(slot) {
  if (slot === "12") return "sun_12";
  if (slot === "19") return "sun_19";
  if (slot === "23") return "sun_23";
  if (slot === "15") return "mon_15";
  return slot;
}

function normalizeTurnoutRecord(record) {
  const turnout = record?.turnout || {};
  const normalized = {};

  Object.entries(turnout).forEach(([slot, value]) => {
    normalized[normalizeLegacySlot(slot)] = value;
  });

  return normalized;
}

function getOrderedSlots(slots = []) {
  const normalized = new Set(slots.map((slot) => normalizeLegacySlot(slot)));
  return TURNOUT_SLOTS.map((slot) => slot.key).filter((slotKey) => normalized.has(slotKey));
}

function updateHeader(city) {
  document.getElementById("current-city").textContent = city.label;
  document.getElementById("current-kicker").textContent =
    VIEW_MODE === "results" ? "Risultati per sezione" : "Sezioni elettorali";
}

function renderDownloads(city) {
  const container = document.getElementById("downloads-panel");
  const dataCsv = VIEW_MODE === "results" ? city.resultsCsvDownload : city.turnoutCsvDownload;
  const dataJson = VIEW_MODE === "results" ? city.resultsJsonDownload : city.turnoutJsonDownload;
  const csvLabel = VIEW_MODE === "results" ? "CSV risultati" : "CSV affluenza";
  const jsonLabel = VIEW_MODE === "results" ? "JSON risultati" : "JSON affluenza";

  container.innerHTML = [
    `<a class="download-link" href="${city.geojsonDownload}" download>Scarica poligoni GeoJSON</a>`,
    `<a class="download-link" href="${dataCsv}" download>${csvLabel}</a>`,
    `<a class="download-link" href="${dataJson}" download>${jsonLabel}</a>`
  ].join("");
}

function renderLegendContent() {
  const rows = VIEW_MODE === "results" ? getResultsLegend(currentResultsAverage) : TURNOUT_LEGEND;
  const title = VIEW_MODE === "results" ? "Risultati" : "Affluenza";

  return [
    `<strong>${title}</strong>`,
    ...rows.map(
      (row) =>
        `<div class="legend-row"><span class="legend-swatch" style="background:${row.color}"></span><span>${row.label}</span></div>`
    )
  ].join("");
}

function renderLegendScaleHtml(rows, ariaLabel) {
  return `<div class="legend-scale" aria-label="${ariaLabel}">${rows
    .map((row) => `<span><i style="background:${row.color}"></i><small>${row.label}</small></span>`)
    .join("")}</div>`;
}

function updateExternalLegend() {
  const panel = document.getElementById("external-legend-scale");
  if (!panel) {
    return;
  }

  const rows = VIEW_MODE === "results" ? getResultsLegend(currentResultsAverage) : TURNOUT_LEGEND;
  const label = VIEW_MODE === "results" ? "Legenda risultati" : "Legenda affluenza";
  panel.innerHTML = renderLegendScaleHtml(rows, label);
}

function updateLegend() {
  return;
}

function ensureMap() {
  if (!currentMap) {
    currentMap = L.map("map-current", {
      preferCanvas: true,
      zoomControl: true,
      scrollWheelZoom: false
    });

    currentMap.attributionControl.setPrefix(
      'Elaborazioni di <a href="https://www.gabrielepinto.com" target="_blank" rel="noreferrer">Gabriele Pinto</a> | Dati: risultati per sezione <a href="https://elezioni.interno.gov.it/" target="_blank" rel="noreferrer">eligendo</a> poligoni <a href="https://github.com/gabrielepinto/dati-sezioni-elettorali" target="_blank" rel="noreferrer">datisezionielettorali</a> |'
    );

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(currentMap);

  }

  return currentMap;
}

function loadCityDataScript(city) {
  if (window.CITY_DATA && window.CITY_DATA[city.slug]) {
    return Promise.resolve(window.CITY_DATA[city.slug]);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = city.dataScript;
    script.onload = () => {
      const payload = window.CITY_DATA ? window.CITY_DATA[city.slug] : null;
      if (payload) {
        resolve(payload);
      } else {
        reject(new Error(`Bundle loaded but CITY_DATA missing for ${city.slug}`));
      }
    };
    script.onerror = () => reject(new Error(`Cannot load ${city.dataScript}`));
    document.head.appendChild(script);
  });
}

function turnoutRecordToLines(record) {
  const turnout = normalizeTurnoutRecord(record);
  return TURNOUT_SLOTS.map((slot) => `${slot.label}: ${formatPercent(turnout[slot.key])}`);
}

function computeCityAverages(lookup) {
  const averages = {};

  TURNOUT_SLOTS.forEach((slot) => {
    const values = [];
    lookup.forEach((record) => {
      const value = normalizeTurnoutRecord(record)[slot.key];
      if (typeof value === "number" && !Number.isNaN(value)) {
        values.push(value);
      }
    });

    averages[slot.key] = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  });

  return averages;
}

function computeCityResultAverage(lookup) {
  const values = [];

  lookup.forEach((record) => {
    const value = getResultsRecord(record)?.no_pct;
    if (typeof value === "number" && !Number.isNaN(value)) {
      values.push(value);
    }
  });

  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n.d.";
  }
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function formatCount(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n.d.";
  }
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(value);
}

function colorFromTurnout(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "#94a3b8";
  }
  if (value < 40) return "#1c2f57";
  if (value < 44) return "#243b6b";
  if (value < 48) return "#2a527f";
  if (value < 52) return "#2f6c9e";
  if (value < 56) return "#2d879d";
  if (value < 60) return "#2f9f9c";
  if (value < 64) return "#43b58e";
  if (value < 68) return "#57c785";
  if (value < 72) return "#86de89";
  return "#b8f28f";
}

function colorFromNoShare(value, cityAverage = 60) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "#94a3b8";
  }
  const avg = typeof cityAverage === "number" && !Number.isNaN(cityAverage) ? cityAverage : 60;
  const avgStart = Math.max(58, avg);
  const avgPlus4 = avgStart + 4;
  const avgPlus8 = avgStart + 8;

  if (value < 42) return "#1f4e9e";
  if (value < 46) return "#3b73c7";
  if (value < 50) return "#6d8fe6";
  if (value < 54) return "#b33fb8";
  if (value < 58) return "#d84db7";
  if (value < avgStart) return "#f0619b";
  if (value < avgPlus4) return "#f28f38";
  if (value < avgPlus8) return "#f6bf3a";
  return "#f3eb57";
}

function getLatestTurnoutSlot(slots) {
  const ordered = getOrderedSlots(slots);
  return ordered.length ? ordered[ordered.length - 1] : null;
}

function getTurnoutValueForSlot(record, slot) {
  if (!slot) {
    return null;
  }
  const turnout = normalizeTurnoutRecord(record);
  const value = turnout[slot];
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

function getLatestTurnoutValue(record, activeSlot) {
  if (activeSlot) {
    return getTurnoutValueForSlot(record, activeSlot);
  }

  const turnout = normalizeTurnoutRecord(record);
  const latestSlot = getLatestTurnoutSlot(Object.keys(turnout));
  return latestSlot ? turnout[latestSlot] : null;
}

function getResultsRecord(record) {
  return record?.results || null;
}

function getPolitiche2022Record(record) {
  return record?.politiche2022 || null;
}

function styleFeature(feature, lookup, activeSlot, resultsAverage) {
  const section = Number(feature?.properties?.SEZIONE);
  const record = lookup.get(section);
  const fillColor =
    VIEW_MODE === "results"
      ? colorFromNoShare(getResultsRecord(record)?.no_pct, resultsAverage)
      : colorFromTurnout(getLatestTurnoutValue(record, activeSlot));

  return {
    color: fillColor,
    weight: 0.28,
    opacity: 0.9,
    fillColor,
    fillOpacity: VIEW_MODE === "results" ? 0.88 : 0.84
  };
}

function getLatestTurnoutLine(record) {
  const turnout = normalizeTurnoutRecord(record);
  const latestSlot = getLatestTurnoutSlot(Object.keys(turnout).filter((slot) => turnout[slot] != null));
  if (!latestSlot) {
    const fallbackTurnout = getResultsRecord(record)?.turnout;
    if (typeof fallbackTurnout === "number" && !Number.isNaN(fallbackTurnout)) {
      return `Affluenza: ${formatPercent(fallbackTurnout)}`;
    }
    return "Affluenza: n.d.";
  }
  return `Affluenza - ${getSlotLabel(latestSlot)}: ${formatPercent(turnout[latestSlot])}`;
}

function popupHtml(cityLabel, feature, lookup, cityAverages, latestCitySlot) {
  const section = Number(feature?.properties?.SEZIONE);
  const record = lookup.get(section) || {
    section,
    name: `SEZIONE ${section}`,
    turnout: { sun_12: null, sun_19: null, sun_23: null, mon_12: null, mon_15: null },
    results: null
  };

  if (VIEW_MODE === "results") {
    const results = getResultsRecord(record) || {};
    const politiche2022 = getPolitiche2022Record(record);
    const storicoLine = politiche2022
      ? `Risultati Politiche 2022, CDX: ${formatPercent(politiche2022.cdx_pct)}, CSX+M5S: ${formatPercent(
          politiche2022.csxm5s_pct
        )}`
      : "Risultati Politiche 2022: n.d.";
    return [
      `<strong>${cityLabel}</strong>`,
      `Sezione: ${record.name}`,
      `Sì: ${formatPercent(results.yes_pct)}`,
      `No: ${formatPercent(results.no_pct)}`,
      `Schede bianche: ${formatCount(results.blank)}`,
      `Schede nulle: ${formatCount(results.null)}`,
      getLatestTurnoutLine(record),
      `(${storicoLine})`
    ].join("<br>");
  }

  return [
    `<strong>${cityLabel}</strong>`,
    `Sezione: ${record.name}`,
    ...turnoutRecordToLines(record),
    latestCitySlot
      ? `Media in città - ${getSlotLabel(latestCitySlot)}: ${formatPercent(cityAverages[latestCitySlot])}`
      : "Media in città: n.d."
  ].join("<br>");
}

function buildLookup(payload) {
  const lookup = new Map();
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];

  sections.forEach((section) => {
    lookup.set(Number(section.section), section);
  });

  return lookup;
}

function inferAvailableTurnoutSlots(payload) {
  const declared = Array.isArray(payload?.meta?.turnout_slots) ? payload.meta.turnout_slots : [];
  if (declared.length) {
    return getOrderedSlots(declared);
  }

  const found = new Set();
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  sections.forEach((section) => {
    const turnout = normalizeTurnoutRecord(section);
    Object.entries(turnout).forEach(([slot, value]) => {
      if (typeof value === "number" && !Number.isNaN(value)) {
        found.add(slot);
      }
    });
  });

  return getOrderedSlots(Array.from(found));
}

function inferResultsAvailable(payload) {
  if (payload?.meta?.results_available) {
    return true;
  }

  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  return sections.some((section) => {
    const results = getResultsRecord(section);
    return results && (
      typeof results.yes_pct === "number" ||
      typeof results.no_pct === "number" ||
      typeof results.yes === "number" ||
      typeof results.no === "number"
    );
  });
}

function inferResultsPartial(payload) {
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  return sections.some((section) => {
    const results = getResultsRecord(section);
    return results && (
      typeof results.blank === "number" ||
      typeof results.null === "number" ||
      typeof results.turnout === "number"
    );
  });
}

function renderLayer(city, payload) {
  const map = ensureMap();
  const lookup = buildLookup(payload);
  const cityAverages = computeCityAverages(lookup);
  currentResultsAverage = computeCityResultAverage(lookup);
  const availableSlots = inferAvailableTurnoutSlots(payload);
  const latestCitySlot = getLatestTurnoutSlot(availableSlots);

  if (currentLayer) {
    currentMap.removeLayer(currentLayer);
    currentLayer = null;
  }

  currentLayer = L.geoJSON(payload.geojson, {
    smoothFactor: 0,
    style: (feature) => styleFeature(feature, lookup, latestCitySlot, currentResultsAverage),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(popupHtml(city.label, feature, lookup, cityAverages, latestCitySlot));
    }
  }).addTo(map);

  map.fitBounds(currentLayer.getBounds(), { padding: [10, 10], maxZoom: 14 });

  if (VIEW_MODE === "results") {
    const label = inferResultsAvailable(payload)
      ? "Scrutinio disponibile"
      : inferResultsPartial(payload)
        ? "Scrutinio parziale"
        : "Scrutinio non ancora disponibile";
    setStatus(label);
  } else {
    const label = availableSlots.length
      ? `Affluenza aggiornata: ${availableSlots.map((slot) => getSlotLabel(slot)).join(", ")}`
      : "Affluenza disponibile";
    setStatus(label);
  }
}

async function loadCity(slug) {
  const city = getCityConfig(slug);
  currentCitySlug = city.slug;
  renderCityTabs();
  updateHeader(city);
  renderDownloads(city);
  updateExternalLegend();
  setStatus("Caricamento...");

  try {
    const payload = await loadCityDataScript(city);
    renderLayer(city, payload);
  } catch (error) {
    setStatus("Errore caricamento");
    const target = document.getElementById("map-current");
    target.innerHTML = `<div style="padding:24px;color:#24313d;background:#dfe6ec;height:100%;">Impossibile caricare ${city.label}.</div>`;
    console.error(error);
  }
}

function init() {
  renderCityTabs();
  updateHeader(getCityConfig(currentCitySlug));
  renderDownloads(getCityConfig(currentCitySlug));
  loadCity(currentCitySlug);
}

init();
