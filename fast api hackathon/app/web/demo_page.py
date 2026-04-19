import json
from html import escape
from string import Template


def render_demo_page(*, app_name: str, ai_mode: str) -> str:
    sample_payload = {
        "patient_name": "Rahul Mehta",
        "age": 62,
        "diagnosis": "Hypertension",
        "notes": "Patient reports dizziness and shortness of breath for two days after a blood pressure spike.",
        "doctor_notes": "Schedule cardiology review if symptoms persist and verify home monitoring logs.",
        "alert_message": "Home BP upload crossed the configured threshold.",
        "alert_severity": "high",
        "has_prescriptions": True,
        "medication_name": "Amlodipine 5 mg",
    }
    template = Template(
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$app_name AI Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --sand: #f6efe3;
      --paper: rgba(255, 251, 245, 0.88);
      --ink: #0f2233;
      --muted: #536575;
      --coral: #eb6b49;
      --teal: #0c8b86;
      --gold: #c58b22;
      --rose: #b63a52;
      --line: rgba(15, 34, 51, 0.12);
      --shadow: 0 24px 60px rgba(25, 40, 55, 0.14);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Space Grotesk", "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(12, 139, 134, 0.18), transparent 36%),
        radial-gradient(circle at top right, rgba(235, 107, 73, 0.18), transparent 32%),
        linear-gradient(135deg, #f8f1e7 0%, #f3f7f2 50%, #eef7fb 100%);
      overflow-x: hidden;
    }

    body::before,
    body::after {
      content: "";
      position: fixed;
      inset: auto;
      width: 22rem;
      height: 22rem;
      border-radius: 999px;
      filter: blur(36px);
      opacity: 0.28;
      pointer-events: none;
      z-index: 0;
    }

    body::before {
      top: -7rem;
      right: -4rem;
      background: #ffe4d6;
    }

    body::after {
      bottom: -8rem;
      left: -6rem;
      background: #cfeee9;
    }

    .page {
      position: relative;
      z-index: 1;
      width: min(1180px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 2rem 0 3rem;
    }

    .hero {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: stretch;
      margin-bottom: 1.5rem;
    }

    .hero-card,
    .panel,
    .result-card {
      background: var(--paper);
      border: 1px solid rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
      border-radius: 28px;
    }

    .hero-card {
      padding: 2rem;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(255, 248, 241, 0.92)),
        radial-gradient(circle at top right, rgba(235, 107, 73, 0.18), transparent 30%);
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.45rem 0.8rem;
      border-radius: 999px;
      color: var(--teal);
      background: rgba(12, 139, 134, 0.11);
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1 {
      margin: 1rem 0 0.75rem;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(2.5rem, 5vw, 4.2rem);
      line-height: 0.96;
      letter-spacing: -0.03em;
    }

    .hero-copy {
      max-width: 40rem;
      font-size: 1.05rem;
      line-height: 1.7;
      color: var(--muted);
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      margin-top: 1.4rem;
    }

    .button,
    button {
      border: none;
      border-radius: 999px;
      padding: 0.95rem 1.2rem;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }

    .button:hover,
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(15, 34, 51, 0.12);
    }

    .button-primary,
    button[type="submit"] {
      background: linear-gradient(135deg, var(--coral), #f08f52);
      color: #fffaf6;
    }

    .button-secondary {
      background: rgba(15, 34, 51, 0.06);
      color: var(--ink);
    }

    .hero-side {
      padding: 1.8rem;
      display: grid;
      gap: 1rem;
      align-content: start;
      background:
        linear-gradient(160deg, rgba(15, 34, 51, 0.92), rgba(22, 45, 71, 0.9)),
        linear-gradient(160deg, rgba(12, 139, 134, 0.2), transparent 45%);
      color: #f6f8fb;
    }

    .stack-label {
      font-size: 0.82rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.72);
    }

    .stack-value {
      font-size: 1.45rem;
      font-weight: 700;
    }

    .stats {
      display: grid;
      gap: 0.9rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stat-card {
      padding: 1rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .layout {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(320px, 430px) minmax(320px, 1fr);
      align-items: start;
    }

    .panel {
      padding: 1.4rem;
    }

    .panel h2,
    .result-card h2 {
      margin: 0 0 0.45rem;
      font-size: 1.15rem;
    }

    .panel-copy {
      margin: 0 0 1.1rem;
      color: var(--muted);
      line-height: 1.55;
    }

    .field-grid {
      display: grid;
      gap: 0.9rem;
    }

    .field-grid.two-up {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    label {
      display: grid;
      gap: 0.45rem;
      font-size: 0.94rem;
      font-weight: 500;
      color: var(--ink);
    }

    input,
    textarea,
    select {
      width: 100%;
      border-radius: 18px;
      border: 1px solid var(--line);
      padding: 0.9rem 1rem;
      font: inherit;
      color: var(--ink);
      background: rgba(255, 255, 255, 0.88);
      outline: none;
      transition: border-color 140ms ease, box-shadow 140ms ease;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: rgba(12, 139, 134, 0.45);
      box-shadow: 0 0 0 4px rgba(12, 139, 134, 0.12);
    }

    textarea {
      min-height: 6.8rem;
      resize: vertical;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.95rem 1rem;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.7);
    }

    .checkbox-row input {
      width: auto;
      margin: 0;
      accent-color: var(--coral);
    }

    .panel-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .result-grid {
      display: grid;
      gap: 1rem;
    }

    .result-card {
      padding: 1.35rem;
    }

    .headline {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }

    .urgency-chip {
      flex-shrink: 0;
      padding: 0.55rem 0.8rem;
      border-radius: 999px;
      font-size: 0.86rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(15, 34, 51, 0.08);
    }

    .urgency-low {
      background: rgba(12, 139, 134, 0.12);
      color: var(--teal);
    }

    .urgency-medium {
      background: rgba(197, 139, 34, 0.13);
      color: var(--gold);
    }

    .urgency-high,
    .urgency-critical {
      background: rgba(182, 58, 82, 0.12);
      color: var(--rose);
    }

    .summary {
      font-size: 1.08rem;
      line-height: 1.7;
      color: var(--ink);
      margin: 1rem 0 0;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .meta span {
      padding: 0.5rem 0.75rem;
      border-radius: 999px;
      background: rgba(15, 34, 51, 0.05);
    }

    .list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.85rem;
    }

    .list-item {
      padding: 1rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.74);
      border: 1px solid var(--line);
    }

    .list-item strong {
      display: block;
      margin-bottom: 0.35rem;
    }

    .hint {
      margin: 0.95rem 0 0;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .status {
      min-height: 1.4rem;
      color: var(--teal);
      font-weight: 700;
    }

    .error {
      color: var(--rose);
    }

    @media (max-width: 980px) {
      .hero,
      .layout {
        grid-template-columns: 1fr;
      }

      .page {
        width: min(100% - 1rem, 1180px);
      }
    }

    @media (max-width: 640px) {
      .hero-card,
      .hero-side,
      .panel,
      .result-card {
        border-radius: 22px;
      }

      .field-grid.two-up,
      .stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="hero-card">
        <div class="eyebrow">Live AI Preview</div>
        <h1>$app_name</h1>
        <p class="hero-copy">
          Your backend is now serving a browser-ready AI screen. Change the patient details, symptoms, alert severity,
          or medication coverage and watch the mock analysis explain urgency, risks, and recommended next actions.
        </p>
        <div class="hero-actions">
          <button class="button button-primary" id="load-sample" type="button">Load Sample Patient</button>
          <a class="button button-secondary" href="/docs">Open API Docs</a>
          <a class="button button-secondary" href="/health">Health Check</a>
        </div>
      </div>
      <aside class="hero-side">
        <div>
          <div class="stack-label">AI Mode</div>
          <div class="stack-value">$ai_mode</div>
        </div>
        <div class="stats">
          <div class="stat-card">
            <div class="stack-label">Visible Endpoint</div>
            <div class="stack-value">/demo/analyze</div>
          </div>
          <div class="stat-card">
            <div class="stack-label">UI Route</div>
            <div class="stack-value">/</div>
          </div>
          <div class="stat-card">
            <div class="stack-label">Analysis Type</div>
            <div class="stack-value">Care Signals</div>
          </div>
          <div class="stat-card">
            <div class="stack-label">Auth Needed</div>
            <div class="stack-value">No</div>
          </div>
        </div>
        <p class="hint">
          Tip: phrases like <strong>shortness of breath</strong>, <strong>chest pain</strong>, or <strong>stroke</strong>
          will raise urgency because the mock provider looks for risk keywords in the notes.
        </p>
      </aside>
    </section>

    <section class="layout">
      <form id="analysis-form" class="panel">
        <h2>Patient Input</h2>
        <p class="panel-copy">
          This page calls your FastAPI backend directly, so the AI section is visible on the web page instead of hiding in raw JSON.
        </p>
        <div class="field-grid two-up">
          <label>
            Patient Name
            <input type="text" name="patient_name" value="Rahul Mehta" required>
          </label>
          <label>
            Age
            <input type="number" name="age" value="62" min="0" max="120" required>
          </label>
        </div>
        <div class="field-grid">
          <label>
            Diagnosis
            <input type="text" name="diagnosis" value="Hypertension">
          </label>
          <label>
            Clinical Notes
            <textarea name="notes">Patient reports dizziness and shortness of breath for two days after a blood pressure spike.</textarea>
          </label>
          <label>
            Doctor Notes
            <textarea name="doctor_notes">Schedule cardiology review if symptoms persist and verify home monitoring logs.</textarea>
          </label>
        </div>
        <div class="field-grid two-up">
          <label>
            Alert Severity
            <select name="alert_severity">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high" selected>High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label>
            Medication
            <input type="text" name="medication_name" value="Amlodipine 5 mg">
          </label>
        </div>
        <div class="field-grid">
          <label>
            Alert Message
            <input type="text" name="alert_message" value="Home BP upload crossed the configured threshold.">
          </label>
          <label class="checkbox-row">
            <input type="checkbox" name="has_prescriptions" checked>
            Active prescription exists for this patient
          </label>
        </div>
        <div class="panel-actions">
          <button type="submit">Run AI Analysis</button>
          <button class="button-secondary" id="reset-form" type="button">Reset</button>
        </div>
        <p class="hint">
          Try removing the prescription or changing the note text to see the recommendations change in real time.
        </p>
      </form>

      <section class="result-grid">
        <article class="result-card">
          <div class="headline">
            <div>
              <h2>AI Summary</h2>
              <p class="panel-copy">Generated by your backend and rendered here in the browser.</p>
            </div>
            <span class="urgency-chip" id="urgency-chip">Loading</span>
          </div>
          <p class="summary" id="summary">Starting analysis...</p>
          <div class="meta">
            <span id="meta-patient">Patient: --</span>
            <span id="meta-source">Source: --</span>
            <span id="meta-time">Updated: --</span>
          </div>
          <p class="status" id="status-line"></p>
        </article>

        <article class="result-card">
          <h2>Highlighted Risks</h2>
          <ul class="list" id="risk-list"></ul>
        </article>

        <article class="result-card">
          <h2>Recommended Actions</h2>
          <ul class="list" id="recommendation-list"></ul>
        </article>
      </section>
    </section>
  </main>

  <script>
    const defaultPayload = $sample_payload;
    const form = document.getElementById("analysis-form");
    const loadSampleButton = document.getElementById("load-sample");
    const resetButton = document.getElementById("reset-form");
    const statusLine = document.getElementById("status-line");
    const summary = document.getElementById("summary");
    const urgencyChip = document.getElementById("urgency-chip");
    const riskList = document.getElementById("risk-list");
    const recommendationList = document.getElementById("recommendation-list");
    const metaPatient = document.getElementById("meta-patient");
    const metaSource = document.getElementById("meta-source");
    const metaTime = document.getElementById("meta-time");

    function fillForm(payload) {
      form.elements.patient_name.value = payload.patient_name;
      form.elements.age.value = payload.age;
      form.elements.diagnosis.value = payload.diagnosis;
      form.elements.notes.value = payload.notes;
      form.elements.doctor_notes.value = payload.doctor_notes;
      form.elements.alert_message.value = payload.alert_message || "";
      form.elements.alert_severity.value = payload.alert_severity;
      form.elements.has_prescriptions.checked = Boolean(payload.has_prescriptions);
      form.elements.medication_name.value = payload.medication_name;
    }

    function readForm() {
      return {
        patient_name: form.elements.patient_name.value.trim(),
        age: Number(form.elements.age.value || 0),
        diagnosis: form.elements.diagnosis.value.trim(),
        notes: form.elements.notes.value.trim(),
        doctor_notes: form.elements.doctor_notes.value.trim(),
        alert_message: form.elements.alert_message.value.trim() || null,
        alert_severity: form.elements.alert_severity.value,
        has_prescriptions: form.elements.has_prescriptions.checked,
        medication_name: form.elements.medication_name.value.trim()
      };
    }

    function setLoading(active) {
      form.querySelector('button[type="submit"]').disabled = active;
      statusLine.classList.remove("error");
      statusLine.textContent = active ? "Running analysis..." : "Analysis ready.";
    }

    function createListItem(title, detail, severity) {
      const item = document.createElement("li");
      item.className = "list-item";

      const strong = document.createElement("strong");
      strong.textContent = severity ? title + " - " + severity.toUpperCase() : title;
      item.appendChild(strong);

      const body = document.createElement("span");
      body.textContent = detail;
      item.appendChild(body);
      return item;
    }

    function renderResult(data, patientName) {
      summary.textContent = data.summary;
      urgencyChip.textContent = data.urgency_level;
      urgencyChip.className = "urgency-chip urgency-" + data.urgency_level;
      metaPatient.textContent = "Patient: " + patientName;
      metaSource.textContent = "Source: " + data.source;
      metaTime.textContent = "Updated: " + new Date(data.timestamp).toLocaleString();

      riskList.replaceChildren();
      data.risks.forEach(function (risk) {
        riskList.appendChild(createListItem(risk.title, risk.reason, risk.severity));
      });

      recommendationList.replaceChildren();
      data.recommendations.forEach(function (recommendation, index) {
        recommendationList.appendChild(
          createListItem("Action " + String(index + 1), recommendation, "")
        );
      });
    }

    async function runAnalysis(payload) {
      setLoading(true);
      try {
        const response = await fetch("/demo/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Demo analysis failed with status " + response.status);
        }

        const data = await response.json();
        renderResult(data, payload.patient_name);
        setLoading(false);
      } catch (error) {
        statusLine.classList.add("error");
        statusLine.textContent = error.message;
        summary.textContent = "The demo analysis could not be loaded.";
        urgencyChip.textContent = "Error";
        urgencyChip.className = "urgency-chip";
        riskList.replaceChildren(createListItem("No results", "Check the backend console or API logs and try again.", ""));
        recommendationList.replaceChildren(createListItem("Retry", "Refresh the page or submit the form again after the backend is healthy.", ""));
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runAnalysis(readForm());
    });

    loadSampleButton.addEventListener("click", function () {
      fillForm(defaultPayload);
      runAnalysis(defaultPayload);
    });

    resetButton.addEventListener("click", function () {
      fillForm(defaultPayload);
      statusLine.textContent = "Sample data restored.";
    });

    fillForm(defaultPayload);
    runAnalysis(defaultPayload);
  </script>
</body>
</html>
"""
    )
    return template.substitute(
        app_name=escape(app_name),
        ai_mode=escape(ai_mode),
        sample_payload=json.dumps(sample_payload),
    )
