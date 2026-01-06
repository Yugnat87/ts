document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // STATE
  // =============================

  let rows = [];
  let translations = {};
  let currentLang = "en";
  let currentSymptomId = null; // ← (1) TRACK CURRENT SYMPTOM

  const OBS_ORDER = [
    "Field observable",
    "Requires inspection / measurement",
    "Internal / inferred"
  ];

  const symptomList = document.getElementById("symptomList");
  const result = document.getElementById("result");
  const backBtn = document.getElementById("backBtn");
  const searchInput = document.getElementById("searchInput");
  const languageSelect = document.getElementById("languageSelect");
  const titleEl = document.getElementById("title");

  // =============================
  // TRANSLATION HELPERS
  // =============================

  function t(key) {
    return translations[key] || key;
  }

  function loadLanguage(lang) {
    fetch(`${lang}.json`)
      .then(r => r.json())
      .then(json => {
        translations = json;
        currentLang = lang;
        applyTranslations();
      })
      .catch(err => {
        console.error("Failed to load language", lang, err);
      });
  }

  function applyTranslations() {
    titleEl.textContent = t("title");
    searchInput.placeholder = t("search");
    backBtn.textContent = "← " + t("back");

    // (3) RE-RENDER CURRENT VIEW
    if (currentSymptomId) {
      showSymptom(currentSymptomId);
    } else {
      renderSymptoms(searchInput.value);
    }
  }

  // =============================
  // LOAD DATA
  // =============================

  fetch("data.json")
    .then(r => r.json())
    .then(json => {
      rows = json;
      renderSymptoms();
    })
    .catch(err => {
      alert("Failed to load data.json");
      console.error(err);
    });

  loadLanguage("en");

  // =============================
  // RENDER SYMPTOM LIST
  // =============================

  function renderSymptoms(filter = "") {
    currentSymptomId = null;
    symptomList.innerHTML = "";
    result.innerHTML = "";
    backBtn.style.display = "none";
    symptomList.style.display = "block";

    const seen = new Set();

    rows.forEach(r => {
      if (seen.has(r["Symptom ID"])) return;
      seen.add(r["Symptom ID"]);

      const label = `${r["Symptom ID"]} — ${r["Symptom on Field"]}`;

      if (filter && !label.toLowerCase().includes(filter.toLowerCase())) return;

      const li = document.createElement("li");
      li.textContent = label;
      li.onclick = () => showSymptom(r["Symptom ID"]);

      symptomList.appendChild(li);
    });
  }

  // =============================
  // SHOW ONE SYMPTOM
  // =============================

  function showSymptom(symptomId) {
    currentSymptomId = symptomId; // ← (2) REMEMBER SYMPTOM

    symptomList.style.display = "none";
    backBtn.style.display = "block";
    result.innerHTML = "";

    const matches = rows.filter(r => r["Symptom ID"] === symptomId);

    const h2 = document.createElement("h2");
    h2.textContent = symptomId;
    result.appendChild(h2);

    const h3 = document.createElement("h3");
    h3.textContent = matches[0]["Symptom on Field"];
    result.appendChild(h3);

    let unlocked = true;

    OBS_ORDER.forEach(level => {
      const steps = matches.filter(m => m["Observability Level"] === level);
      if (!steps.length) return;

      const section = document.createElement("div");
      section.className = "section";

      const title = document.createElement("h3");
      title.textContent =
        level === "Field observable" ? t("field") :
        level === "Requires inspection / measurement" ? t("inspection") :
        t("internal");

      section.appendChild(title);

      if (!unlocked) {
        const p = document.createElement("p");
        p.className = "locked";
        p.textContent = t("locked");
        section.appendChild(p);
        result.appendChild(section);
        return;
      }

      let hasSOP = false;

      steps.forEach(s => {
        if (!s["SOP"] || s["SOP"].toLowerCase().includes("missing")) {
          const p = document.createElement("p");
          p.textContent = t("sop_missing");
          section.appendChild(p);
          unlocked = false;
        } else {
          hasSOP = true;
          s["SOP"].split("\n").forEach(line => {
            const step = document.createElement("div");
            step.className = "step";
            step.innerHTML = `<input type="checkbox"> <span>${line}</span>`;
            section.appendChild(step);
          });
        }
      });

      if (hasSOP) {
        const res = document.createElement("div");
        res.className = "resolution";
        res.innerHTML = `
          <p>${t("resolved")}</p>
          <button>${t("yes")}</button>
          <button>${t("no")}</button>
        `;
        section.appendChild(res);
      }

      result.appendChild(section);
    });
  }

  // =============================
  // EVENTS
  // =============================

  backBtn.onclick = () => renderSymptoms(searchInput.value);
  searchInput.oninput = () => renderSymptoms(searchInput.value);

  languageSelect.onchange = e => {
    loadLanguage(e.target.value);
  };

});
