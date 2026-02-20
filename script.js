const CSV_URL = "./sports.csv";

const METRIC_KEYS = ["athletics", "tactics", "spectacle", "pacing", "rules"];
const METRIC_LABELS = {
  athletics: "Athletics",
  tactics: "Tactics",
  spectacle: "Spectacle",
  pacing: "Pacing",
  rules: "Rules",
};

let sportsData = [];
let currentSort = { key: "overall", direction: "desc" };
let radarChart = null;
let selectedSportName = null;

async function loadData() {
  const response = await fetch(CSV_URL);
  const text = await response.text();
  sportsData = parseCsv(text);

  sortData(currentSort.key, currentSort.direction);
  renderTable();
  if (sportsData.length > 0) {
    const firstSport = sportsData[0];
    selectSport(firstSport.sport);
  }
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const sportIndex = headers.indexOf("Sport");
  const overallIndex = headers.indexOf("Overall Score");
  const athleticsIndex = headers.indexOf("Athletics Score");
  const tacticsIndex = headers.indexOf("Tactics Score");
  const spectacleIndex = headers.indexOf("Spectacle Score");
  const pacingIndex = headers.indexOf("Pacing Score");
  const rulesIndex = headers.indexOf("Rules Score");

  function toNumber(percentStr) {
    if (!percentStr) return 0;
    const cleaned = percentStr.replace("%", "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (!row[sportIndex]) continue;

    rows.push({
      sport: row[sportIndex],
      overall: toNumber(row[overallIndex]),
      athletics: toNumber(row[athleticsIndex]),
      tactics: toNumber(row[tacticsIndex]),
      spectacle: toNumber(row[spectacleIndex]),
      pacing: toNumber(row[pacingIndex]),
      rules: toNumber(row[rulesIndex]),
    });
  }

  return rows;
}

function sortData(key, direction) {
  sportsData.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) {
      return a.sport.localeCompare(b.sport);
    }
    if (direction === "asc") {
      return av - bv;
    }
    return bv - av;
  });
}

function renderTable() {
  const tbody = document.getElementById("sports-table-body");
  tbody.innerHTML = "";

  sportsData.forEach((sport, index) => {
    const tr = document.createElement("tr");
    if (sport.sport === selectedSportName) {
      tr.classList.add("selected-row");
    }

    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;
    tr.appendChild(rankCell);

    const sportCell = document.createElement("td");
    sportCell.textContent = titleCase(sport.sport);
    tr.appendChild(sportCell);

    const overallCell = document.createElement("td");
    overallCell.textContent = formatPercent(sport.overall);
    tr.appendChild(overallCell);

    const athleticsCell = document.createElement("td");
    athleticsCell.textContent = formatPercent(sport.athletics);
    tr.appendChild(athleticsCell);

    const tacticsCell = document.createElement("td");
    tacticsCell.textContent = formatPercent(sport.tactics);
    tr.appendChild(tacticsCell);

    const spectacleCell = document.createElement("td");
    spectacleCell.textContent = formatPercent(sport.spectacle);
    tr.appendChild(spectacleCell);

    const pacingCell = document.createElement("td");
    pacingCell.textContent = formatPercent(sport.pacing);
    tr.appendChild(pacingCell);

    const rulesCell = document.createElement("td");
    rulesCell.textContent = formatPercent(sport.rules);
    tr.appendChild(rulesCell);

    tr.addEventListener("click", () => {
      selectSport(sport.sport);
    });

    tbody.appendChild(tr);
  });

  updateSortIndicators();
}

function titleCase(text) {
  return text
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function selectSport(sportName) {
  selectedSportName = sportName;
  const sport = sportsData.find((s) => s.sport === sportName);
  if (!sport) return;

  const titleEl = document.getElementById("detail-title");
  const subtitleEl = document.getElementById("detail-subtitle");
  const metaEl = document.getElementById("detail-meta");
  const statsEl = document.getElementById("radar-stats");

  titleEl.textContent = titleCase(sport.sport);
  subtitleEl.textContent =
    "Radar profile across Athletics, Tactics, Spectacle, Pacing, and Rules.";
  metaEl.textContent = `Overall score: ${formatPercent(sport.overall)}`;

  const metricValues = METRIC_KEYS.map((key) => sport[key]);
  renderRadarChart(titleCase(sport.sport), metricValues);
  renderRadarStats(statsEl, sport);
  highlightSelectedRow(sportName);
}

function renderRadarStats(container, sport) {
  container.innerHTML = "";
  METRIC_KEYS.forEach((key) => {
    const item = document.createElement("div");
    item.className = "radar-stat-item";

    const label = document.createElement("div");
    label.className = "radar-stat-label";
    label.textContent = METRIC_LABELS[key];

    const value = document.createElement("div");
    value.className = "radar-stat-value";
    value.textContent = formatPercent(sport[key]);

    item.appendChild(label);
    item.appendChild(value);
    container.appendChild(item);
  });
}

function renderRadarChart(label, values) {
  const ctx = document.getElementById("radar-canvas").getContext("2d");

  const data = {
    labels: METRIC_KEYS.map((key) => METRIC_LABELS[key]),
    datasets: [
      {
        label,
        data: values,
        borderColor: "rgba(96, 165, 250, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.35)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(248, 250, 252, 1)",
        pointBorderColor: "rgba(15, 23, 42, 1)",
        pointRadius: 3.5,
        pointHoverRadius: 4.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            return `${ctx.label}: ${ctx.parsed.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      r: {
        angleLines: {
          color: "rgba(75, 85, 99, 0.7)",
        },
        grid: {
          color: "rgba(55, 65, 81, 0.7)",
        },
        pointLabels: {
          color: "#e5e7eb",
          font: {
            size: 11,
          },
        },
        ticks: {
          display: false,
          beginAtZero: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  if (radarChart) {
    radarChart.data = data;
    radarChart.options = options;
    radarChart.update();
  } else {
    radarChart = new Chart(ctx, {
      type: "radar",
      data,
      options,
    });
  }
}

function highlightSelectedRow(sportName) {
  const rows = document.querySelectorAll("#sports-table-body tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length === 0) return;
    const sportCell = cells[1];
    if (!sportCell) return;
    const normalizedRowName = sportCell.textContent.toLowerCase();
    if (normalizedRowName === titleCase(sportName).toLowerCase()) {
      row.classList.add("selected-row");
    } else {
      row.classList.remove("selected-row");
    }
  });
}

function updateSortIndicators() {
  const headers = document.querySelectorAll("thead th[data-key]");
  headers.forEach((th) => {
    const key = th.getAttribute("data-key");
    let labelSpan = th.querySelector(".sort-label");
    if (!labelSpan) {
      const text = th.textContent.trim();
      th.textContent = "";
      labelSpan = document.createElement("span");
      labelSpan.className = "sort-label";
      const textNode = document.createElement("span");
      textNode.textContent = text;
      labelSpan.appendChild(textNode);
      const indicator = document.createElement("span");
      indicator.className = "sort-indicator";
      labelSpan.appendChild(indicator);
      th.appendChild(labelSpan);
    }

    const indicator = labelSpan.querySelector(".sort-indicator");
    if (key === currentSort.key) {
      indicator.textContent = currentSort.direction === "asc" ? "▲" : "▼";
      indicator.style.opacity = "1";
    } else {
      indicator.textContent = "▲";
      indicator.style.opacity = "0.25";
    }
  });
}

function handleHeaderClicks() {
  const headers = document.querySelectorAll("thead th[data-key]");
  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (!key) return;

      if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort.key = key;
        currentSort.direction = "desc";
      }

      sortData(currentSort.key, currentSort.direction);
      renderTable();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleHeaderClicks();
  loadData().catch((err) => {
    console.error("Failed to load data", err);
  });
});

