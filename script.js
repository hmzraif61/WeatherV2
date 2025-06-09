// Clé API personnelle pour Météo Concept
const token = "4cd60cb73de3af7aa27a5bd681601846ee0bbe1cbe67381911af06f0adb251bb";

// Récupération des éléments HTML nécessaires
const input = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");
let selectedCommune = null; // Stocke la commune choisie par l'utilisateur

// Met à jour l'affichage du nombre de jours sélectionnés
document.getElementById("nbJours").addEventListener("input", (e) => {
  document.getElementById("valeurJours").textContent = `${e.target.value} jour${e.target.value > 1 ? "s" : ""}`;
});

// ---------- GESTION DU MODE SOMBRE ----------

// Bouton de toggle + détection du thème système
const darkToggle = document.getElementById("darkModeToggle");
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Active le mode sombre si le localStorage ou la préférence système l'indique
if (localStorage.getItem("darkMode") === "true" || (!localStorage.getItem("darkMode") && prefersDark)) {
  document.body.classList.add("dark");
}

// Gestion du clic sur le bouton pour activer/désactiver le mode sombre
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️ Mode clair" : "🌙 Mode sombre";
});

// Met à jour le texte du bouton au chargement de la page
darkToggle.textContent = document.body.classList.contains("dark") ? "☀️ Mode clair" : "🌙 Mode sombre";

// ---------- SUGGESTIONS DYNAMIQUES ----------

// Lorsqu'on tape dans le champ de recherche
input.addEventListener("input", async () => {
  const value = input.value.trim();

  // Si moins de 2 caractères, on cache les suggestions
  if (value.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  // Appel à l'API des communes du gouvernement
  const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${value}&fields=nom,code,codesPostaux,centre&boost=population&limit=5`);
  const communes = await res.json();

  // Affichage des suggestions
  suggestionsBox.innerHTML = "";
  communes.forEach((commune) => {
    const item = document.createElement("li");
    item.className = "p-2 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer";
    item.textContent = `${commune.nom} (${commune.codesPostaux[0]})`;

    // Lorsque l'utilisateur clique sur une suggestion
    item.addEventListener("click", () => {
      input.value = `${commune.nom} (${commune.codesPostaux[0]})`;
      selectedCommune = commune;
      suggestionsBox.classList.add("hidden");
    });

    suggestionsBox.appendChild(item);
  });

  suggestionsBox.classList.remove("hidden");
});

// ---------- TRAITEMENT DE LA RECHERCHE MÉTÉO ----------

document.getElementById("weatherForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Empêche le rechargement de la page

  const nbJours = parseInt(document.getElementById("nbJours").value); // Nombre de jours choisis
  const options = Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(el => el.value); // Options cochées
  const resultats = document.getElementById("resultats");
  resultats.innerHTML = ""; // Réinitialise l'affichage

  // Vérifie si une commune a bien été choisie
  if (!selectedCommune) {
    resultats.innerHTML = `<p class="text-red-500">Veuillez choisir une commune dans les suggestions.</p>`;
    return;
  }

  // Récupération des infos sur la commune sélectionnée
  const { nom, code, centre } = selectedCommune;
  const lat = centre.coordinates[1]; // Latitude
  const lon = centre.coordinates[0]; // Longitude

  try {
    // Appel à l'API Météo Concept pour les prévisions
    const meteoRes = await fetch(`https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=${code}`);
    const meteoData = await meteoRes.json();

    // Création des cartes météo pour chaque jour demandé
    for (let i = 0; i < nbJours; i++) {
      const meteo = meteoData.forecast[i];
      const card = document.createElement("div");

      // Classes Tailwind pour le style clair/sombre
      card.className = "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded shadow transition";

      // Contenu HTML de la carte météo
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

      // Ajoute la carte au DOM
      resultats.appendChild(card);
    }
  } catch (err) {
    // Gestion des erreurs en cas d'échec de l'appel API
    resultats.innerHTML = `<p class="text-red-500">Erreur lors de la récupération des données météo.</p>`;
  }
});
