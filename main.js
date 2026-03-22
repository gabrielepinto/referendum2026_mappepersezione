const CITY_CONFIG = [
  {
    slug: "roma",
    label: "Roma",
    dataScript: "city-data/roma.bundle.js",
    geojsonDownload: "geoframes/precincts_roma_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_roma.csv",
    turnoutJsonDownload: "data/turnout_roma.json"
  },
  {
    slug: "milano",
    label: "Milano",
    dataScript: "city-data/milano.bundle.js",
    geojsonDownload: "geoframes/precincts_milano_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_milano.csv",
    turnoutJsonDownload: "data/turnout_milano.json"
  },
  {
    slug: "napoli",
    label: "Napoli",
    dataScript: "city-data/napoli.bundle.js",
    geojsonDownload: "geoframes/precincts_napoli_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_napoli.csv",
    turnoutJsonDownload: "data/turnout_napoli.json"
  },
  {
    slug: "bologna",
    label: "Bologna",
    dataScript: "city-data/bologna.bundle.js",
    geojsonDownload: "geoframes/precincts_bologna_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_bologna.csv",
    turnoutJsonDownload: "data/turnout_bologna.json"
  },
  {
    slug: "torino",
    label: "Torino",
    dataScript: "city-data/torino.bundle.js",
    geojsonDownload: "geoframes/precincts_torino_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_torino.csv",
    turnoutJsonDownload: "data/turnout_torino.json"
  },
  {
    slug: "genova",
    label: "Genova",
    dataScript: "city-data/genova.bundle.js",
    geojsonDownload: "geoframes/precincts_genova_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_genova.csv",
    turnoutJsonDownload: "data/turnout_genova.json"
  },
  {
    slug: "firenze",
    label: "Firenze",
    dataScript: "city-data/firenze.bundle.js",
    geojsonDownload: "geoframes/precincts_firenze_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_firenze.csv",
    turnoutJsonDownload: "data/turnout_firenze.json"
  },
  {
    slug: "palermo",
    label: "Palermo",
    dataScript: "city-data/palermo.bundle.js",
    geojsonDownload: "geoframes/precincts_palermo_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_palermo.csv",
    turnoutJsonDownload: "data/turnout_palermo.json"
  },
  {
    slug: "reggiocalabria",
    label: "Reggio Calabria",
    dataScript: "city-data/reggiocalabria.bundle.js",
    geojsonDownload: "geoframes/precincts_reggiocalabria_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_reggiocalabria.csv",
    turnoutJsonDownload: "data/turnout_reggiocalabria.json"
  },
  {
    slug: "taranto",
    label: "Taranto",
    dataScript: "city-data/taranto.bundle.js",
    geojsonDownload: "geoframes/precincts_taranto_bulding.geojson",
    turnoutCsvDownload: "downloads_csv/2026-03-22_taranto.csv",
    turnoutJsonDownload: "data/turnout_taranto.json"
  }
];

const VIEW_MODE = document.body.dataset.view || "turnout";
const DEFAULT_CITY = "roma";

let currentMap = null;
let currentLayer = null;
let currentCitySlug = DEFAULT_CITY;

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
  if (slot === "12") return "Domenica ore 12";
  if (slot === "19") return "Domenica ore 19";
  if (slot === "15") return "Lunedì ore 15";
  return `Ore ${slot}`;
}

function updateHeader(city) {
  document.getElementById("current-city").textContent = city.label;
  document.getElementById("current-kicker").textContent =
    VIEW_MODE === "results" ? "Risultati per sezione" : "Sezioni elettorali";
}

function renderDownloads(city) {
  const container = document.getElementById("downloads-panel");
  const turnoutLabel = VIEW_MODE === "results" ? "Dati risultati" : "CSV affluenza";
  const jsonLabel = VIEW_MODE === "results" ? "JSON risultati" : "JSON affluenza";

  container.innerHTML = [
    `<a class="download-link" href="${city.geojsonDownload}" download>Scarica poligoni GeoJSON</a>`,
    `<a class="download-link" href="${city.turnoutCsvDownload}" download>${turnoutLabel}</a>`,
    `<a class="download-link" href="${city.turnoutJsonDownload}" download>${jsonLabel}</a>`
  ].join("");
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

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "map-legend");
      div.innerHTML = [
        "<strong>Affluenza</strong>",
        '<div class="legend-row"><span class="legend-swatch" style="background:#243b6b"></span><span>&lt; 25%</span></div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#2f6c9e"></span><span>25-35%</span></div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#2f9f9c"></span><span>35-45%</span></div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#57c785"></span><span>45-55%</span></div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#b8f28f"></span><span>&gt; 55%</span></div>'
      ].join("");
      return div;
    };
    legend.addTo(currentMap);
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
  const turnout = record?.turnout || {};
  return [
    `${getSlotLabel("12")}: ${formatPercent(turnout["12"])}`,
    `${getSlotLabel("19")}: ${formatPercent(turnout["19"])}`,
    `${getSlotLabel("15")}: ${formatPercent(turnout["15"])}`
  ];
}

function computeCityAverages(lookup) {
  const slots = ["12", "19", "15"];
  const averages = {};

  slots.forEach((slot) => {
    const values = [];
    lookup.forEach((record) => {
      const value = record?.turnout?.[slot];
      if (typeof value === "number" && !Number.isNaN(value)) {
        values.push(value);
      }
    });

    averages[slot] = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  });

  return averages;
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n.d.";
  }
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function colorFromTurnout(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "#94a3b8";
  }
  if (value < 25) return "#243b6b";
  if (value < 35) return "#2f6c9e";
  if (value < 45) return "#2f9f9c";
  if (value < 55) return "#57c785";
  return "#b8f28f";
}

function getLatestTurnoutValue(record) {
  const turnout = record?.turnout || {};
  if (typeof turnout["15"] === "number" && !Number.isNaN(turnout["15"])) return turnout["15"];
  if (typeof turnout["19"] === "number" && !Number.isNaN(turnout["19"])) return turnout["19"];
  if (typeof turnout["12"] === "number" && !Number.isNaN(turnout["12"])) return turnout["12"];
  return null;
}

function styleFeature(feature, lookup) {
  const section = Number(feature?.properties?.SEZIONE);
  const record = lookup.get(section);
  const turnoutValue = getLatestTurnoutValue(record);

  return {
    color: "rgba(18, 28, 38, 0.18)",
    weight: 0.12,
    opacity: 0.25,
    fillColor: VIEW_MODE === "results" ? "#3b4654" : colorFromTurnout(turnoutValue),
    fillOpacity: VIEW_MODE === "results" ? 0.35 : 0.84
  };
}

function popupHtml(cityLabel, feature, lookup, cityAverages) {
  const section = Number(feature?.properties?.SEZIONE);
  const record = lookup.get(section) || {
    section,
    name: `SEZIONE ${section}`,
    turnout: { "12": null, "15": null, "19": null },
    results: null
  };

  if (VIEW_MODE === "results") {
    return [
      `<strong>${cityLabel}</strong>`,
      `Sezione: ${record.name}`,
      "Scrutinio non ancora disponibile"
    ].join("<br>");
  }

  return [
    `<strong>${cityLabel}</strong>`,
    `Sezione: ${record.name}`,
    ...turnoutRecordToLines(record),
    `Media in città - Domenica ore 12: ${formatPercent(cityAverages["12"])}`,
    `Media in città - Domenica ore 19: ${formatPercent(cityAverages["19"])}`,
    `Media in città - Lunedì ore 15: ${formatPercent(cityAverages["15"])}`
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
    return declared;
  }

  const found = new Set();
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  sections.forEach((section) => {
    const turnout = section?.turnout || {};
    Object.entries(turnout).forEach(([slot, value]) => {
      if (typeof value === "number" && !Number.isNaN(value)) {
        found.add(slot);
      }
    });
  });

  return Array.from(found).sort((a, b) => Number(a) - Number(b));
}

function renderLayer(city, payload) {
  const map = ensureMap();
  const lookup = buildLookup(payload);
  const cityAverages = computeCityAverages(lookup);

  if (currentLayer) {
    currentMap.removeLayer(currentLayer);
    currentLayer = null;
  }

  currentLayer = L.geoJSON(payload.geojson, {
    smoothFactor: 0,
    style: (feature) => styleFeature(feature, lookup),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(popupHtml(city.label, feature, lookup, cityAverages));
    }
  }).addTo(map);

  map.fitBounds(currentLayer.getBounds(), { padding: [10, 10], maxZoom: 12 });

  if (VIEW_MODE === "results") {
    setStatus("Pagina risultati pronta");
  } else {
    const availableSlots = inferAvailableTurnoutSlots(payload);
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
