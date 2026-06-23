import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { calcPSADT, fmtDate, today } from '../db';

const URINARY_IDS = ["frecuencia", "urgencia", "incontinencia", "retencion", "ardor"];

function classifyUrinary(score) {
  if (score <= 4)  return { label: "Leve",     color: "var(--green)" };
  if (score <= 11) return { label: "Moderado", color: "var(--amber)" };
  return            { label: "Grave",           color: "var(--rose)"  };
}

function bpClassify(sys, dia) {
  if (!sys || !dia) return null;
  if (sys < 120 && dia < 80)  return "Óptima";
  if (sys < 130 && dia < 85)  return "Normal";
  if (sys < 140 && dia < 90)  return "Normal-alta";
  if (sys < 160 && dia < 100) return "HTA grado 1";
  return "HTA grado 2+";
}

function ClinicalSummary({ data }) {
  const [copied, setCopied] = useState(false);
  const { symptomLogs, psaLogs, bpLogs, kegelLogs, boneLogs, adverseEvents = [], inrLogs = [] } = data;

  if (!symptomLogs.length && !psaLogs.length) return (
    <p style={{ fontSize: ".85rem", color: "var(--muted)", textAlign: "center", padding: "1rem 0", fontStyle: "italic" }}>
      Aún no hay registros de síntomas o PSA disponibles.
    </p>
  );

  const lastSymptom = [...symptomLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastPSA     = [...psaLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastBP      = [...bpLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const psadt       = calcPSADT(psaLogs);

  const s = lastSymptom?.symptoms || {};
  const urinaryScore = URINARY_IDS.reduce((acc, id) => acc + (s[id] || 0), 0);
  const uClass       = classifyUrinary(urinaryScore);
  const severeSymptoms = Object.entries(s).filter(([, v]) => v >= 3);

  const todayStr  = today();
  const last7     = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split("T")[0]; });
  const kegelDone = last7.filter(d => kegelLogs.some(l => l.date === d)).length;
  const boneDone  = last7.filter(d => boneLogs.some(l => l.date === d && (l.score || 0) > 0)).length;

  const bullets = [];
  if (lastSymptom) {
    bullets.push({
      text: `Síntomas urinarios ${uClass.label} (${urinaryScore}/20): frecuencia ${s.frecuencia||0}/4 · urgencia ${s.urgencia||0}/4 · incontinencia ${s.incontinencia||0}/4 · retención ${s.retencion||0}/4 · ardor ${s.ardor||0}/4`,
      color: uClass.color,
    });
    if (severeSymptoms.length > 0) {
      const labels = {
        sofocos: "sofocos", fatiga: "fatiga", humor: "humor", libido: "libido",
        disfuncion: "disfunción eréctil", ginecomast: "ginecomastia", cognitivo: "niebla mental",
        frecuencia: "frecuencia urinaria", urgencia: "urgencia", incontinencia: "incontinencia",
        retencion: "retención", ardor: "ardor", dolor_general: "dolor general",
        dolor_oseo: "dolor óseo", dolor_articular: "dolor articular",
        nauseas: "náuseas", diarrea: "diarrea", apetito: "apetito", estrenim: "estreñimiento",
      };
      bullets.push({ text: `Síntomas severos (≥3/4): ${severeSymptoms.map(([id]) => labels[id] || id).join(", ")}`, color: "var(--rose)" });
    }
  }
  if (lastBP) {
    const bpClass = bpClassify(lastBP.sys, lastBP.dia);
    bullets.push({ text: `Tensión arterial ${lastBP.sys}/${lastBP.dia} mmHg — ${bpClass}`, color: lastBP.sys >= 160 ? "var(--rose)" : lastBP.sys >= 140 ? "var(--amber)" : "var(--green)" });
  }
  if (lastPSA) {
    bullets.push({ text: `PSA: ${lastPSA.psa} ng/mL${psadt ? ` · Tiempo de duplicación estimado: ${psadt} meses` : ""}`, color: "var(--blue)" });
  }
  bullets.push({ text: `Adherencia última semana — Kegel: ${kegelDone}/7 sesiones · Hábitos óseos: ${boneDone}/7 días`, color: kegelDone >= 5 ? "var(--green)" : "var(--amber)" });

  const lastINR = inrLogs.length > 0 ? [...inrLogs].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  if (lastINR) {
    const inrOk = lastINR.value >= 2.0 && lastINR.value <= 3.0;
    bullets.push({
      text: `INR: ${lastINR.value} (${fmtDate(lastINR.date)}) — ${inrOk ? "En rango terapéutico (2,0–3,0)" : "Fuera del rango terapéutico — revisar con hematólogo"}`,
      color: inrOk ? "var(--green)" : "var(--rose)",
    });
  }

  const cutoff90 = new Date(); cutoff90.setDate(cutoff90.getDate() - 90);
  const recentEvents = adverseEvents
    .filter(e => e.date && new Date(e.date + "T12:00:00") >= cutoff90)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (recentEvents.length > 0) {
    bullets.push({
      text: `Eventos adversos (últimos 90 días): ${recentEvents.map(e => e.eventType || "Sin tipo").join(" · ")}`,
      color: "var(--rose)",
    });
  }

  const line = "──────────────────────────────────";
  const noteDate = lastSymptom ? fmtDate(lastSymptom.date) : fmtDate(todayStr);
  const genDate  = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  const noteLines = [
    "SEGUIMIENTO CÁNCER DE PRÓSTATA",
    line,
    `Fecha registro: ${noteDate}`,
    "",
    `SÍNTOMAS URINARIOS (${urinaryScore}/20 — ${uClass.label})`,
    `• Frecuencia: ${s.frecuencia||0}/4  ·  Urgencia: ${s.urgencia||0}/4  ·  Incontinencia: ${s.incontinencia||0}/4`,
    `• Retención: ${s.retencion||0}/4  ·  Ardor: ${s.ardor||0}/4`,
    "",
    "SÍNTOMAS HORMONALES",
    `• Sofocos: ${s.sofocos||0}/4  ·  Fatiga: ${s.fatiga||0}/4  ·  Humor: ${s.humor||0}/4  ·  Libido: ${s.libido||0}/4`,
    `• Disfunción eréctil: ${s.disfuncion||0}/4  ·  Ginecomastia: ${s.ginecomast||0}/4  ·  Niebla mental: ${s.cognitivo||0}/4`,
    "",
    "DOLOR",
    `• General: ${s.dolor_general||0}/4  ·  Óseo: ${s.dolor_oseo||0}/4  ·  Articular: ${s.dolor_articular||0}/4`,
    "",
    "DIGESTIVO",
    `• Náuseas: ${s.nauseas||0}/4  ·  Diarrea: ${s.diarrea||0}/4  ·  Apetito: ${s.apetito||0}/4  ·  Estreñimiento: ${s.estrenim||0}/4`,
    "",
    lastBP ? `TENSIÓN ARTERIAL: ${lastBP.sys}/${lastBP.dia} mmHg (${bpClassify(lastBP.sys, lastBP.dia)})` : "TENSIÓN ARTERIAL: no registrada",
    lastSymptom?.weight ? `PESO: ${lastSymptom.weight} kg` : null,
    "",
    lastPSA ? `PSA: ${lastPSA.psa} ng/mL  ·  Fecha: ${fmtDate(lastPSA.date)}${psadt ? `  ·  PSADT: ${psadt} meses` : ""}` : "PSA: no registrado",
    lastINR ? `INR: ${lastINR.value}  ·  Fecha: ${fmtDate(lastINR.date)}  ·  Rango objetivo: 2,0–3,0` : null,
    "",
    "ADHERENCIA ÚLTIMA SEMANA",
    `• Kegel: ${kegelDone}/7 sesiones`,
    `• Hábitos óseos: ${boneDone}/7 días`,
    "",
    adverseEvents.length > 0 ? "EVENTOS ADVERSOS REGISTRADOS" : null,
    ...adverseEvents
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(e => `• ${e.date || ""}${e.time ? " " + e.time : ""} — ${e.eventType || "Evento"}${e.description ? ": " + e.description : ""}`),
    adverseEvents.length > 0 ? "" : null,
    line,
    `Generado con ProstataCare  ·  ${genDate}`,
  ].filter(l => l !== null).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(noteLines).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportPDF = () => {
    const style = document.createElement("style");
    style.id = "print-override";
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #print-note { display: block !important; }
      }
      #print-note {
        display: none;
        font-family: 'Courier New', Courier, monospace;
        font-size: 11pt;
        line-height: 1.7;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 2cm;
        color: #000;
      }
    `;
    document.head.appendChild(style);

    const div = document.createElement("div");
    div.id = "print-note";
    div.textContent = noteLines;
    document.body.appendChild(div);

    window.print();

    document.head.removeChild(style);
    document.body.removeChild(div);
  };

  return (
    <>
      <div style={{ borderLeft: "4px solid var(--blue)", paddingLeft: "0.85rem", marginBottom: "1.25rem" }}>
        <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--navy)", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
          Interpretación de resultados
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
              <span style={{ width: ".5rem", height: ".5rem", borderRadius: "50%", background: b.color, flexShrink: 0, marginTop: ".45rem" }} />
              <p style={{ fontSize: ".83rem", color: "var(--text)", lineHeight: 1.5, fontWeight: 500 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--navy)", marginBottom: "0.85rem" }}>Nota para Historia Clínica</p>
        <Card style={{ padding: "1.1rem 1.2rem", background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.12)" }}>
          <pre style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: ".75rem", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {noteLines}
          </pre>
          <div style={{ display: "flex", gap: ".6rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={copy}
              style={{ padding: ".55rem 1.1rem", borderRadius: "var(--radius-md)", border: "1.5px solid", borderColor: copied ? "var(--green)" : "var(--blue)", background: copied ? "rgba(46,156,106,0.1)" : "var(--accent-light)", color: copied ? "var(--green)" : "var(--blue)", fontFamily: "inherit", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", transition: "all var(--transition-fast)", display: "flex", alignItems: "center", gap: ".4rem" }}
            >
              {copied ? "Copiado" : "Copiar nota"}
            </button>
            <button
              onClick={exportPDF}
              style={{ padding: ".55rem 1.1rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--blue)", background: "var(--accent-light)", color: "var(--blue)", fontFamily: "inherit", fontSize: ".8rem", fontWeight: 700, cursor: "pointer", transition: "all var(--transition-fast)", display: "flex", alignItems: "center", gap: ".4rem" }}
            >
              <span>📄</span> Exportar PDF
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function MasInfoTab({ data }) {
  const [showSummary, setShowSummary] = useState(false);
  const hasSummaryData = data && (data.symptomLogs?.length > 0 || data.psaLogs?.length > 0);

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up">
        <SectionTitle>Resumen Clínico</SectionTitle>
      </div>

      {/* Clinical summary toggle */}
      <button
        onClick={() => setShowSummary(s => !s)}
        className="btn-ghost fade-up fade-up-d1"
        style={{ width: "100%", padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", borderColor: "var(--blue)", color: "var(--blue)" }}
      >
        {showSummary ? "Ocultar resumen clínico" : "Ver resumen clínico"}
      </button>

      {showSummary && data && (
        <div className="fade-up" style={{ marginBottom: "1.5rem" }}>
          <ClinicalSummary data={data} />
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: "1rem 1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg)" }} className="fade-up fade-up-d4">
        <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.6, fontStyle: "italic", textAlign: "center" }}>
          La información recogida en esta aplicación tiene carácter orientativo y no sustituye el consejo médico profesional. Se recomienda siempre contar con un profesional de la salud para la guía, supervisión y realización de estos ejercicios y tratamientos.
        </p>
      </div>
    </div>
  );
}
