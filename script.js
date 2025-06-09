const token = "4cd60cb73de3af7aa27a5bd681601846ee0bbe1cbe67381911af06f0adb251bb";
const input = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");
let selectedCommune = null;


document.getElementById("nbJours").addEventListener("input", (e) => {
  document.getElementById("valeurJours").textContent = `${e.target.value} jour${e.target.value > 1 ? "s" : ""}`;
});

// Dark Mode toggle
const darkToggle = document.getElementById("darkModeToggle");
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (localStorage.getItem("darkMode") === "true" || (!localStorage.getItem("darkMode") && prefersDark)) {
  document.body.classList.add("dark");
}

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️ Mode clair" : "🌙 Mode sombre";
});

// Met à jour le texte du bouton au chargement
darkToggle.textContent = document.body.classList.contains("dark") ? "☀️ Mode clair" : "🌙 Mode sombre";


// Suggestions dynamiques
input.addEventListener("input", async () => {
  const value = input.value.trim();
  if (value.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${value}&fields=nom,code,codesPostaux,centre&boost=population&limit=5`);
  const communes = await res.json();
  suggestionsBox.innerHTML = "";
  communes.forEach((commune) => {
    const item = document.createElement("li");
    item.className = "p-2 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer";
    item.textContent = `${commune.nom} (${commune.codesPostaux[0]})`;
    item.addEventListener("click", () => {
      input.value = `${commune.nom} (${commune.codesPostaux[0]})`;
      selectedCommune = commune;
      suggestionsBox.classList.add("hidden");
    });
    suggestionsBox.appendChild(item);
  });
  suggestionsBox.classList.remove("hidden");
});

// Soumission du formulaire
document.getElementById("weatherForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nbJours = parseInt(document.getElementById("nbJours").value);
  const options = Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(el => el.value);
  const resultats = document.getElementById("resultats");
  resultats.innerHTML = "";

  if (!selectedCommune) {
    resultats.innerHTML = `<p class="text-red-500">Veuillez choisir une commune dans les suggestions.</p>`;
    return;
  }

  const { nom, code, centre } = selectedCommune;
  const lat = centre.coordinates[1];
  const lon = centre.coordinates[0];

  try {
    const meteoRes = await fetch(`https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=${code}`);
    const meteoData = await meteoRes.json();

    for (let i = 0; i < nbJours; i++) {
      const meteo = meteoData.forecast[i];
      const card = document.createElement("div");
card.className = "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded shadow transition";

      card.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${nom} - Jour ${i + 1}</h3>
        <p><strong>Temps :</strong> ${meteo.weather}</p>
        <p>🌡️ <strong>${meteo.tmin}°C</strong> → <strong>${meteo.tmax}°C</strong></p>
        ${options.includes("latitude") ? `<p>📍 Latitude : ${lat}</p>` : ""}
        ${options.includes("longitude") ? `<p>📍 Longitude : ${lon}</p>` : ""}
        ${options.includes("pluie") ? `<p>🌧️ Pluie : ${meteo.rr10} mm</p>` : ""}
        ${options.includes("vent") ? `<p>💨 Vent moyen : ${meteo.wind10m} km/h</p>` : ""}
        ${options.includes("direction") ? `<p>🧭 Direction du vent : ${meteo.dirwind10m}°</p>` : ""}
      `;
      resultats.appendChild(card);
    }
  } catch (err) {
    resultats.innerHTML = `<p class="text-red-500">Erreur lors de la récupération des données météo.</p>`;
  }
});
