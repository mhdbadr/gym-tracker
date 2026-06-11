const STORAGE_KEY = "gymTrackerSessionsV2";
const LEGACY_STORAGE_KEY = "gymTrackerSessionsV1";
const LOAD_SESSION_KEY = "studioCoachLoadSessionId";

const plans = {
  Push: [
    ["Brustpresse Maschine", "Brust", 3, "8-12", 120, "Schulterblätter hinten unten halten, kontrolliert ablassen, nicht aus der Schulter drücken."],
    ["Schrägbank-Brustpresse Maschine", "Obere Brust", 3, "8-12", 120, "Griffe auf Brusthöhe, Ellenbogen leicht unter Schulterhöhe, volle Kontrolle im unteren Punkt."],
    ["Schulterpresse Maschine", "Schulter", 3, "8-10", 120, "Rumpf fest, nicht ins Hohlkreuz fallen, oben nicht aggressiv einrasten."],
    ["Seitheben Kurzhanteln", "Seitliche Schulter", 3, "12-20", 75, "Leicht vor dem Körper heben, Handgelenke neutral, Schwung vermeiden."],
    ["Trizeps Pushdown Kabel", "Trizeps", 3, "10-15", 75, "Ellenbogen bleiben am Körper, unten kurz strecken, langsam zurückführen."],
    ["Overhead Trizeps Extension Kabel", "Trizeps langer Kopf", 2, "10-15", 75, "Ellenbogen eng führen, Dehnung zulassen, ohne Schulterstress arbeiten."],
    ["Crunch Maschine", "Bauch", 3, "12-20", 60, "Wirbelsäule aktiv einrollen, nicht aus Hüfte oder Armen ziehen."]
  ],
  Pull: [
    ["Latzug breit", "Latissimus", 3, "8-12", 120, "Brust hoch, Stange zur oberen Brust, Ellenbogen Richtung Rippen ziehen."],
    ["Kabelrudern sitzend", "Rückenmitte", 3, "8-12", 120, "Neutraler Rücken, Schulterblätter zusammenführen, nicht mit Schwung reißen."],
    ["Chest Supported Row Maschine", "Rückenmitte", 3, "8-12", 120, "Brust bleibt am Polster, Griff Richtung Hüfte, oben kurz halten."],
    ["Face Pulls", "Hintere Schulter", 3, "12-20", 75, "Seil auf Augenhöhe ziehen, außenrotieren, Schulterblätter sauber bewegen."],
    ["Bizeps Curl Maschine", "Bizeps", 3, "10-15", 75, "Oberarme fixieren, volle Streckung nutzen, oben nicht ablegen."],
    ["Hammer Curls Kurzhanteln", "Brachialis", 2, "10-15", 75, "Daumen zeigt nach oben, Schulter ruhig, kontrollierte negative Phase."],
    ["Beinheben auf Bank", "Bauch", 3, "10-20", 60, "Becken einrollen, unteren Rücken kontrollieren, nicht ins Hohlkreuz kippen."]
  ],
  Legs: [
    ["Beinpresse", "Quadrizeps und Gesäß", 4, "8-12", 150, "Füße stabil, Knie folgen den Zehen, Tiefe nur so weit wie der Rücken neutral bleibt."],
    ["Hack Squat Maschine", "Quadrizeps", 3, "8-12", 150, "Rumpf fest, langsam ablassen, aus dem Mittelfuß drücken."],
    ["Beinstrecker", "Quadrizeps", 3, "10-15", 90, "Oben kontrolliert strecken, kurz halten, Kniegelenk nicht schmerzhaft belasten."],
    ["Beinbeuger sitzend", "Hamstrings", 3, "10-15", 90, "Hüfte ins Polster drücken, unten kurz halten, langsam zurück."],
    ["Wadenheben sitzend", "Waden", 3, "10-15", 75, "Volle Dehnung unten, oben kurz halten, nicht federn."],
    ["Wadenheben stehend", "Waden", 2, "12-20", 75, "Knie fast gestreckt, sauberer Bewegungsweg, kontrollierte Wiederholungen."],
    ["Plank", "Core", 3, "30-60 Sek.", 60, "Rippen runter, Gesäß anspannen, Körperlinie halten."]
  ]
};

const planObjects = Object.fromEntries(
  Object.entries(plans).map(([key, items]) => [
    key,
    items.map(([name, muscle, sets, reps, rest, cue]) => ({ name, muscle, sets, reps, rest, cue }))
  ])
);

const $ = id => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  migrateLegacySessions();
  renderHomeStats();
  renderDashboard();
  initTrainingPage();
  initHistoryPage();
});

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getSessions() {
  return readJson(STORAGE_KEY, []);
}

function setSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function migrateLegacySessions() {
  if (localStorage.getItem(STORAGE_KEY) || !localStorage.getItem(LEGACY_STORAGE_KEY)) return;
  const migrated = readJson(LEGACY_STORAGE_KEY, []).map(session => ({
    ...session,
    goal: session.goal || "Muskelaufbau",
    sleep: session.sleep || "",
    totalVolume: calculateSessionVolume(session),
    schemaVersion: 2
  }));
  setSessions(migrated);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "ohne Datum";
  return new Date(`${value}T12:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function showToast(message, type = "success") {
  const region = $("toastRegion");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3800);
}

function weeklyVolume(sessions) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  return sessions
    .filter(session => session.date && new Date(`${session.date}T12:00:00`) >= weekStart)
    .reduce((sum, session) => sum + (session.totalVolume || calculateSessionVolume(session)), 0);
}

function renderHomeStats() {
  const homeSessions = $("homeSessions");
  if (!homeSessions) return;
  const sessions = getSessions();
  homeSessions.textContent = sessions.length;
  $("homeLast").textContent = sessions[0] ? `${sessions[0].type} ${formatDate(sessions[0].date)}` : "-";
  $("homeWeekVolume").textContent = `${formatNumber(weeklyVolume(sessions))} kg`;
}

function renderDashboard() {
  const metricSessions = $("metricSessions");
  if (!metricSessions) return;
  const sessions = getSessions();
  metricSessions.textContent = sessions.length;
  $("metricLast").textContent = sessions[0] ? `${sessions[0].type} ${formatDate(sessions[0].date)}` : "-";
  $("metricWeekVolume").textContent = `${formatNumber(weeklyVolume(sessions))} kg`;
  $("metricFocus").textContent = sessions[0]?.goal || $("sessionGoal")?.value || "Technik";
}

function initTrainingPage() {
  if (!$("exerciseList")) return;

  $("trainingDate").valueAsDate = new Date();
  $("loadPlanBtn").addEventListener("click", loadPlan);
  $("addExerciseBtn").addEventListener("click", () => {
    addExercise();
    markDirty();
  });
  $("clearFormBtn").addEventListener("click", clearForm);
  $("saveSessionBtn").addEventListener("click", saveSession);
  $("downloadTxtBtn").addEventListener("click", downloadCurrentText);
  $("downloadCsvBtn").addEventListener("click", downloadCurrentCsv);
  $("downloadAllTxtBtn").addEventListener("click", downloadAllText);

  ["trainingType", "trainingDate", "bodyWeight", "energy", "sleep", "sessionGoal", "notes"].forEach(id => {
    $(id).addEventListener("input", markDirty);
    $(id).addEventListener("change", () => {
      markDirty();
      renderDashboard();
    });
  });

  const loadId = sessionStorage.getItem(LOAD_SESSION_KEY);
  const sessionToLoad = loadId ? getSessions().find(session => session.id === loadId) : null;
  sessionStorage.removeItem(LOAD_SESSION_KEY);

  if (sessionToLoad) {
    loadSessionIntoForm(sessionToLoad);
  } else {
    loadPlan(false);
    $("sessionStatus").textContent = "Plan geladen";
  }
}

function addExercise(plan = {}) {
  const exerciseList = $("exerciseList");
  const wrapper = document.createElement("article");
  wrapper.className = "exercise";
  const sets = Number(plan.sets || 3);
  wrapper.innerHTML = `
    <div class="exercise-header">
      <label>Übung
        <input class="exercise-name" type="text" value="${escapeHtml(plan.name || "")}" placeholder="z. B. Brustpresse Maschine" />
      </label>
      <label>Muskelgruppe
        <input class="exercise-muscle" type="text" value="${escapeHtml(plan.muscle || "")}" placeholder="z. B. Brust" />
      </label>
      <label>Ziel-Wdh.
        <input class="exercise-reps" type="text" value="${escapeHtml(plan.reps || "8-12")}" placeholder="8-12" />
      </label>
      <label>Pause (Sek.)
        <input class="exercise-rest" type="number" min="30" step="15" value="${escapeHtml(plan.rest || 90)}" />
      </label>
      <button class="btn danger remove-btn" type="button">Entfernen</button>
    </div>
    <p class="cue">${escapeHtml(plan.cue || "Technik sauber halten und erst steigern, wenn alle Sätze kontrolliert sind.")}</p>
    <div class="set-grid"></div>
    <div class="exercise-actions">
      <button class="btn secondary add-set" type="button">Satz hinzufügen</button>
      <button class="btn ghost duplicate-last" type="button">Letzten Satz kopieren</button>
    </div>
    <div class="set-summary">Noch keine Leistung eingetragen.</div>
  `;

  const setGrid = wrapper.querySelector(".set-grid");
  for (let index = 1; index <= sets; index += 1) {
    setGrid.appendChild(createSetBox(index, plan.savedSets?.[index - 1]));
  }

  wrapper.querySelector(".remove-btn").addEventListener("click", () => {
    wrapper.remove();
    updateExerciseNumbers();
    markDirty();
  });
  wrapper.querySelector(".add-set").addEventListener("click", () => {
    setGrid.appendChild(createSetBox(setGrid.children.length + 1));
    updateExerciseNumbers();
    markDirty();
  });
  wrapper.querySelector(".duplicate-last").addEventListener("click", () => duplicateLastSet(wrapper));
  wrapper.addEventListener("input", () => {
    updateExerciseSummary(wrapper);
    markDirty();
  });

  exerciseList.appendChild(wrapper);
  updateExerciseNumbers();
  updateExerciseSummary(wrapper);
}

function createSetBox(number, values = {}) {
  const box = document.createElement("div");
  box.className = "set-box";
  box.innerHTML = `
    <p>Satz ${number}</p>
    <div class="mini-grid">
      <label>kg <input class="kg" type="number" step="0.5" min="0" value="${escapeHtml(values.kg || "")}" /></label>
      <label>Wdh. <input class="reps" type="number" step="1" min="0" value="${escapeHtml(values.reps || "")}" /></label>
      <label>RPE <input class="rpe" type="number" step="0.5" min="1" max="10" value="${escapeHtml(values.rpe || "")}" placeholder="8" /></label>
    </div>
  `;
  return box;
}

function duplicateLastSet(exercise) {
  const sets = [...exercise.querySelectorAll(".set-box")];
  const last = sets.at(-1);
  if (!last) return;
  exercise.querySelector(".set-grid").appendChild(createSetBox(sets.length + 1, {
    kg: last.querySelector(".kg").value,
    reps: last.querySelector(".reps").value,
    rpe: last.querySelector(".rpe").value
  }));
  updateExerciseNumbers();
  updateExerciseSummary(exercise);
  markDirty();
}

function updateExerciseNumbers() {
  const exercises = [...document.querySelectorAll(".exercise")];
  if ($("exerciseCount")) {
    $("exerciseCount").textContent = `${exercises.length} ${exercises.length === 1 ? "Übung" : "Übungen"}`;
  }
  exercises.forEach(exercise => {
    [...exercise.querySelectorAll(".set-box")].forEach((setBox, index) => {
      setBox.querySelector("p").textContent = `Satz ${index + 1}`;
    });
  });
}

function updateExerciseSummary(exercise) {
  const sets = collectSetsFromExercise(exercise);
  const completed = sets.filter(set => set.kg || set.reps);
  const volume = calculateExerciseVolume({ sets });
  const target = exercise.querySelector(".exercise-reps").value;
  const recommendation = getProgressionRecommendation({ sets, reps: target });
  exercise.querySelector(".set-summary").textContent = completed.length
    ? `${completed.length} Sätze erfasst, ${formatNumber(volume)} kg Volumen. Empfehlung: ${recommendation}`
    : "Noch keine Leistung eingetragen.";
}

function markDirty() {
  if ($("sessionStatus")) $("sessionStatus").textContent = "Ungespeicherte Änderungen";
}

function loadPlan(ask = true) {
  const exerciseList = $("exerciseList");
  if (ask && exerciseList.children.length && !confirm("Aktuelle Übungen durch den ausgewählten Plan ersetzen?")) return;
  exerciseList.innerHTML = "";
  planObjects[$("trainingType").value].forEach(addExercise);
  if ($("sessionStatus")) $("sessionStatus").textContent = "Plan geladen";
  if (ask) showToast(`${$("trainingType").value}-Plan wurde geladen.`, "success");
}

function collectSetsFromExercise(exercise) {
  return [...exercise.querySelectorAll(".set-box")].map(setBox => ({
    kg: setBox.querySelector(".kg").value,
    reps: setBox.querySelector(".reps").value,
    rpe: setBox.querySelector(".rpe").value
  }));
}

function collectSession() {
  const exercises = [...document.querySelectorAll(".exercise")].map(exercise => ({
    name: exercise.querySelector(".exercise-name").value.trim(),
    muscle: exercise.querySelector(".exercise-muscle").value.trim(),
    reps: exercise.querySelector(".exercise-reps").value.trim(),
    rest: exercise.querySelector(".exercise-rest").value,
    cue: exercise.querySelector(".cue").textContent.trim(),
    sets: collectSetsFromExercise(exercise)
  })).filter(exercise => exercise.name);

  const session = {
    id: makeId(),
    type: $("trainingType").value,
    date: $("trainingDate").value,
    bodyWeight: $("bodyWeight").value,
    energy: $("energy").value,
    sleep: $("sleep").value,
    goal: $("sessionGoal").value,
    notes: $("notes").value.trim(),
    exercises,
    createdAt: new Date().toISOString(),
    schemaVersion: 2
  };
  session.totalVolume = calculateSessionVolume(session);
  session.recommendations = session.exercises.map(exercise => ({ name: exercise.name, next: getProgressionRecommendation(exercise) }));
  return session;
}

function validateSession(session) {
  if (!session.date) return "Bitte ein Trainingsdatum eintragen.";
  if (!session.exercises.length) return "Bitte mindestens eine Übung eintragen oder einen Plan laden.";
  const hasCompletedSet = session.exercises.some(exercise =>
    exercise.sets.some(set => numberValue(set.kg) > 0 && numberValue(set.reps) > 0)
  );
  if (!hasCompletedSet) return "Bitte mindestens einen vollständigen Satz mit Gewicht und Wiederholungen eintragen.";
  if (session.energy && (numberValue(session.energy) < 1 || numberValue(session.energy) > 10)) return "Energie muss zwischen 1 und 10 liegen.";
  return "";
}

function calculateExerciseVolume(exercise) {
  return (exercise.sets || []).reduce((sum, set) => sum + numberValue(set.kg) * numberValue(set.reps), 0);
}

function calculateSessionVolume(session) {
  return (session.exercises || []).reduce((sum, exercise) => sum + calculateExerciseVolume(exercise), 0);
}

function parseRepTarget(target) {
  const match = String(target).match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return { min: 0, max: 999 };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function getProgressionRecommendation(exercise) {
  const target = parseRepTarget(exercise.reps || "8-12");
  const workSets = (exercise.sets || []).filter(set => numberValue(set.kg) > 0 && numberValue(set.reps) > 0);
  if (!workSets.length) return "Leistung eintragen.";

  const allAtTop = workSets.every(set => numberValue(set.reps) >= target.max);
  const anyTooHard = workSets.some(set => numberValue(set.rpe) >= 9.5);
  const anyBelowTarget = workSets.some(set => numberValue(set.reps) < target.min);

  if (anyTooHard) return "Gewicht halten oder 5-10% reduzieren, Technik absichern.";
  if (allAtTop) return "Gewicht um 2,5-5% erhöhen.";
  if (anyBelowTarget) return "Gewicht halten, Zielbereich sauber erreichen.";
  return "Gewicht halten und Wiederholungen steigern.";
}

function sessionToText(session) {
  const lines = [
    "========================================",
    "STUDIOCOACH - TRAININGSEINHEIT",
    "========================================",
    `Datum: ${formatDate(session.date)}`,
    `Training: ${session.type || "-"}`,
    `Ziel: ${session.goal || "-"}`,
    `Körpergewicht: ${session.bodyWeight || "-"} kg`,
    `Energie: ${session.energy || "-"}/10`,
    `Schlaf: ${session.sleep || "-"} Stunden`,
    `Gesamtvolumen: ${formatNumber(session.totalVolume || calculateSessionVolume(session))} kg`,
    "",
    "ÜBUNGEN",
    "----------------------------------------"
  ];

  session.exercises.forEach((exercise, index) => {
    lines.push(`${index + 1}. ${exercise.name}`);
    lines.push(`   Muskelgruppe: ${exercise.muscle || "-"}`);
    lines.push(`   Ziel: ${exercise.reps || "-"} Wdh. | Pause: ${exercise.rest || "-"} Sek.`);
    exercise.sets.forEach((set, setIndex) => {
      lines.push(`   Satz ${setIndex + 1}: ${set.kg || "___"} kg x ${set.reps || "___"} Wdh. | RPE ${set.rpe || "_"}`);
    });
    lines.push(`   Empfehlung: ${getProgressionRecommendation(exercise)}`);
    lines.push("");
  });

  lines.push("NOTIZEN", "----------------------------------------", session.notes || "Keine Notizen", "", `Gespeichert am: ${new Date(session.createdAt || Date.now()).toLocaleString("de-DE")}`);
  lines.push("========================================");
  return lines.join("\n");
}

function sessionToCsv(session) {
  const rows = [["Datum", "Split", "Ziel", "Übung", "Muskelgruppe", "Satz", "kg", "Wdh", "RPE", "Ziel-Wdh", "Pause", "Volumen", "Empfehlung"]];
  session.exercises.forEach(exercise => {
    exercise.sets.forEach((set, index) => {
      rows.push([
        session.date,
        session.type,
        session.goal,
        exercise.name,
        exercise.muscle,
        index + 1,
        set.kg,
        set.reps,
        set.rpe,
        exercise.reps,
        exercise.rest,
        numberValue(set.kg) * numberValue(set.reps),
        getProgressionRecommendation(exercise)
      ]);
    });
  });
  return rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilePart(value) {
  return String(value || "ohne-datum").toLowerCase().replaceAll(" ", "-").replace(/[^a-z0-9-]/g, "");
}

function saveSession() {
  const session = collectSession();
  const validationMessage = validateSession(session);
  if (validationMessage) {
    showToast(validationMessage, "error");
    return;
  }
  const sessions = getSessions();
  sessions.unshift(session);
  setSessions(sessions);
  $("sessionStatus").textContent = "Gespeichert";
  renderDashboard();
  showToast("Training gespeichert. Empfehlung für die nächste Einheit wurde berechnet.", "success");
}

function loadSessionIntoForm(session) {
  $("trainingType").value = session.type || "Push";
  $("trainingDate").value = session.date || "";
  $("bodyWeight").value = session.bodyWeight || "";
  $("energy").value = session.energy || "";
  $("sleep").value = session.sleep || "";
  $("sessionGoal").value = session.goal || "Muskelaufbau";
  $("notes").value = session.notes || "";
  $("exerciseList").innerHTML = "";
  session.exercises.forEach(exercise => addExercise({ ...exercise, savedSets: exercise.sets, sets: exercise.sets.length || 3 }));
  $("sessionStatus").textContent = "Gespeicherte Einheit geladen";
  showToast("Training wurde in das Formular geladen.", "success");
}

function clearForm() {
  if (!confirm("Formular leeren? Gespeicherte Trainings bleiben erhalten.")) return;
  ["bodyWeight", "energy", "sleep", "notes"].forEach(id => {
    $(id).value = "";
  });
  $("exerciseList").innerHTML = "";
  $("trainingDate").valueAsDate = new Date();
  $("sessionGoal").value = "Muskelaufbau";
  $("sessionStatus").textContent = "Nicht gespeichert";
  updateExerciseNumbers();
  showToast("Formular wurde geleert.", "success");
}

function downloadCurrentText() {
  const session = collectSession();
  const validationMessage = validateSession(session);
  if (validationMessage) return showToast(validationMessage, "error");
  downloadText(`training-${safeFilePart(session.date)}-${safeFilePart(session.type)}.txt`, sessionToText(session));
}

function downloadCurrentCsv() {
  const session = collectSession();
  const validationMessage = validateSession(session);
  if (validationMessage) return showToast(validationMessage, "error");
  downloadText(`training-${safeFilePart(session.date)}-${safeFilePart(session.type)}.csv`, sessionToCsv(session), "text/csv;charset=utf-8");
}

function downloadAllText() {
  const sessions = getSessions();
  if (!sessions.length) return showToast("Es sind noch keine Trainings gespeichert.", "warning");
  downloadText("studiocoach-alle-trainings.txt", sessions.map(sessionToText).join("\n\n\n"));
}

function initHistoryPage() {
  if (!$("historyList")) return;
  $("historySearch").addEventListener("input", renderHistory);
  $("historyFilter").addEventListener("change", renderHistory);
  $("deleteAllBtn").addEventListener("click", () => {
    if (!getSessions().length) return showToast("Es sind keine Trainings zum Löschen vorhanden.", "warning");
    if (!confirm("Alle gespeicherten Trainings dauerhaft löschen?")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
    renderDashboard();
    showToast("Alle gespeicherten Trainings wurden gelöscht.", "success");
  });
  renderHistory();
}

function renderHistory() {
  const query = $("historySearch").value.trim().toLowerCase();
  const filter = $("historyFilter").value;
  const sessions = getSessions().filter(session => {
    const matchesFilter = filter === "Alle" || session.type === filter;
    const searchable = [session.type, session.date, session.goal, session.notes, ...(session.exercises || []).map(exercise => exercise.name)].join(" ").toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  const historyList = $("historyList");
  historyList.innerHTML = "";
  if (!sessions.length) {
    historyList.innerHTML = `<p class="empty-state">Keine passenden Trainings gefunden.</p>`;
    return;
  }

  sessions.forEach(session => {
    const item = document.createElement("article");
    item.className = "history-item";
    const volume = session.totalVolume || calculateSessionVolume(session);
    const firstRecommendation = session.recommendations?.[0]?.next || (session.exercises[0] ? getProgressionRecommendation(session.exercises[0]) : "-");
    item.innerHTML = `
      <div class="history-top">
        <div>
          <div class="history-title">${escapeHtml(session.type)} am ${escapeHtml(formatDate(session.date))}</div>
          <div class="history-meta">${escapeHtml(session.exercises.length)} Übungen · ${formatNumber(volume)} kg Volumen · Ziel: ${escapeHtml(session.goal || "-")}</div>
          <div class="history-meta">Nächster Schritt: ${escapeHtml(firstRecommendation)}</div>
        </div>
        <span class="status-pill">${escapeHtml(session.energy || "-")}/10 Energie</span>
      </div>
      <div class="history-actions">
        <button class="btn secondary download-one" type="button">TXT</button>
        <button class="btn secondary csv-one" type="button">CSV</button>
        <button class="btn ghost load-one" type="button">In Training laden</button>
        <button class="btn danger delete-one" type="button">Löschen</button>
      </div>
    `;
    item.querySelector(".download-one").addEventListener("click", () => downloadText(`training-${safeFilePart(session.date)}-${safeFilePart(session.type)}.txt`, sessionToText(session)));
    item.querySelector(".csv-one").addEventListener("click", () => downloadText(`training-${safeFilePart(session.date)}-${safeFilePart(session.type)}.csv`, sessionToCsv(session), "text/csv;charset=utf-8"));
    item.querySelector(".load-one").addEventListener("click", () => {
      sessionStorage.setItem(LOAD_SESSION_KEY, session.id);
      window.location.href = "training.html";
    });
    item.querySelector(".delete-one").addEventListener("click", () => deleteSession(session.id));
    historyList.appendChild(item);
  });
}

function deleteSession(id) {
  if (!confirm("Dieses Training dauerhaft löschen?")) return;
  setSessions(getSessions().filter(session => session.id !== id));
  renderHistory();
  renderDashboard();
  showToast("Training wurde gelöscht.", "success");
}
