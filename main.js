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
      zoomControl: true,
      scrollWheelZoom: false
    });

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
  const turnout = record?.turnout || {};
  return [
    `Affluenza ore 12: ${formatPercent(turnout["12"])}`,
    `Affluenza ore 15: ${formatPercent(turnout["15"])}`,
    `Affluenza ore 19: ${formatPercent(turnout["19"])}`
  ];
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
  if (value < 25) return "#1f3947";
  if (value < 35) return "#2d5d69";
  if (value < 45) return "#4e8b7b";
  if (value < 55) return "#98c379";
  return "#f2c14e";
}

function styleFeature(feature, lookup) {
  const section = Number(feature?.properties?.SEZIONE);
  const record = lookup.get(section);
  const turnout19 = record?.turnout?.["19"] ?? null;

  return {
    color: "#1d2a34",
    weight: 0.35,
    opacity: 0.7,
    fillColor: VIEW_MODE === "results" ? "#3b4654" : colorFromTurnout(turnout19),
    fillOpacity: VIEW_MODE === "results" ? 0.35 : 0.84
  };
}

function popupHtml(cityLabel, feature, lookup) {
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
    ...turnoutRecordToLines(record)
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

function renderLayer(city, payload) {
  const map = ensureMap();
  const lookup = buildLookup(payload);

  if (currentLayer) {
    currentMap.removeLayer(currentLayer);
    currentLayer = null;
  }

  currentLayer = L.geoJSON(payload.geojson, {
    style: (feature) => styleFeature(feature, lookup),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(popupHtml(city.label, feature, lookup));
    }
  }).addTo(map);

  map.fitBounds(currentLayer.getBounds(), { padding: [10, 10] });

  if (VIEW_MODE === "results") {
    setStatus("Pagina risultati pronta");
  } else {
    const availableSlots = payload?.meta?.turnout_slots || [];
    const label = availableSlots.length
      ? `Affluenza aggiornata: ${availableSlots.map((slot) => `ore ${slot}`).join(", ")}`
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
