import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd } from '../db';

function norm(str) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// 12 checks from the AEU safety_intermittent_checker JSON
const SAFETY_CHECKS = [
  {
    id: "amiodarona",
    triggerKeywords: ["amiodarona"],
    triggerLabel: "Amiodarona",
    severity: "YELLOW",
    question: "¿Has sentido esta semana palpitaciones inusuales, mareos repentinos al levantarte o que tu corazón va más lento de lo normal?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia o tu Urólogo para realizar un electrocardiograma rutinario y comprobar tu ritmo cardíaco.",
  },
  {
    id: "digoxina",
    triggerKeywords: ["digoxina"],
    triggerLabel: "Digoxina",
    severity: "YELLOW",
    question: "¿Has tenido náuseas, pérdida total de apetito o cambios extraños en la visión (como ver los objetos con un tono amarillento o verdoso)?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia o tu Urólogo para realizar una analítica de sangre y comprobar los niveles de digoxina (digoxinemia).",
  },
  {
    id: "estatinas",
    triggerKeywords: ["rosuvastatina", "atorvastatina", "simvastatina"],
    triggerLabel: "Estatinas (Rosuvastatina / Atorvastatina / Simvastatina)",
    severity: "YELLOW",
    question: "¿Sientes dolores musculares continuos o debilidad intensa en los muslos o brazos (similar a una gripe fuerte) sin haber hecho ejercicio?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia o tu Urólogo para revisar tu tratamiento del colesterol mediante un control analítico (valores de CPK).",
  },
  {
    id: "anticoag_directos",
    triggerKeywords: ["rivaroxaban", "apixaban", "dabigatran", "edoxaban"],
    triggerLabel: "Anticoagulantes directos (Rivaroxabán / Apixabán / Dabigatrán / Edoxabán)",
    severity: "RED",
    question: "¿Has notado alguna dificultad repentina para hablar, pérdida de fuerza en un brazo/pierna, o asimetría en la cara al mirarte al espejo?",
    recommendation: "Acude al Servicio de Urgencias médicas más cercano de forma inmediata. Esta combinación de fármacos requiere comprobar urgentemente la eficacia de tu coagulación.",
  },
  {
    id: "clopidogrel",
    triggerKeywords: ["clopidogrel", "prasugrel", "ticagrelor"],
    triggerLabel: "Antiagregantes (Clopidogrel / Prasugrel / Ticagrelor)",
    severity: "RED",
    question: "¿Sientes opresión, dolor o un pinchazo en el centro del pecho que se extiende hacia el brazo izquierdo o el cuello, especialmente al caminar o hacer esfuerzos?",
    recommendation: "Acude al Servicio de Urgencias médicas más cercano de forma inmediata. No interrumpas tu tratamiento oncológico, pero requiere valoración cardiovascular urgente.",
  },
  {
    id: "calcioantagonistas",
    triggerKeywords: ["amlodipino", "nifedipino", "verapamilo", "diltiazem"],
    triggerLabel: "Calcioantagonistas (Amlodipino / Nifedipino / Verapamilo / Diltiazem)",
    severity: "YELLOW",
    question: "¿Has tenido dolores de cabeza intensos en la zona de la nuca, zumbidos constantes en los oídos o episodios de visión borrosa estos días?",
    recommendation: "Mídete la tensión arterial en tu farmacia habitual y solicita una cita lo antes posible con tu Médico de Familia para ajustar tu tratamiento antihipertensivo.",
  },
  {
    id: "diureticos",
    triggerKeywords: ["furosemida", "torasemida", "hidroclorotiazida", "indapamida"],
    triggerLabel: "Diuréticos (Furosemida / Torasemida / Hidroclorotiazida)",
    severity: "YELLOW",
    question: "¿Has sentido calambres musculares dolorosos en las pantorrillas por la noche o una debilidad extrema en las piernas al levantarte de la cama o la silla?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia o tu Urólogo para programar una analítica ordinaria y revisar tus niveles de potasio en sangre.",
  },
  {
    id: "ansioliticos",
    triggerKeywords: ["midazolam", "triazolam", "diazepam", "alprazolam", "lormetazepam"],
    triggerLabel: "Ansiolíticos / Sedantes (Midazolam / Triazolam / Diazepam / Alprazolam)",
    severity: "YELLOW",
    question: "¿Te sientes inusualmente adormecido o con falta de estabilidad al caminar durante el día, o por el contrario, sufres un insomnio y nerviosismo muy intensos?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia para valorar un ajuste de dosis o el cambio a un ansiolítico que no interactúe con tu terapia oncológica.",
  },
  {
    id: "soja",
    triggerKeywords: ["soja", "isoflavona"],
    triggerLabel: "Suplementos de soja / Isoflavonas",
    severity: "YELLOW",
    question: "¿Estás consumiendo actualmente algún suplemento natural o cápsulas de herbolario a base de soja sin haberlo registrado previamente en la aplicación?",
    recommendation: "Suspende el uso de estos suplementos y solicita una cita con tu Urólogo. Los compuestos de la soja pueden restar eficacia a tu bloqueo hormonal contra el cáncer.",
  },
  {
    id: "omeprazol",
    triggerKeywords: ["omeprazol", "esomeprazol", "lansoprazol", "pantoprazol"],
    triggerLabel: "Protector de estómago (Omeprazol / Esomeprazol / Lansoprazol)",
    severity: "YELLOW",
    question: "¿Estás tomando el protector de estómago a la misma hora exacta que tu medicación contra el cáncer de próstata?",
    recommendation: "Para asegurar que tu cuerpo absorba el 100% de la medicación oncológica, separa las tomas. Toma el protector estomacal al menos 2 horas antes o después de tu pastilla del cáncer.",
    // YES = bad (taking them simultaneously is the problem)
    yesIsBad: true,
  },
  {
    id: "anticonvulsivantes",
    triggerKeywords: ["carbamazepina", "fenitoina", "fenobarbital"],
    triggerLabel: "Anticonvulsivantes inductores (Carbamazepina / Fenitoína / Fenobarbital)",
    severity: "RED",
    question: "Aviso de sistema: Estos fármacos reducen drásticamente la eficacia de tu tratamiento oncológico de forma silenciosa en el hígado, sin provocar síntomas físicos evidentes.",
    recommendation: "Solicita una cita de máxima prioridad con tu Urólogo u Oncólogo. Es fundamental sustituir estos antiepilépticos por alternativas seguras para no comprometer tu terapia contra el cáncer.",
    autoFlag: true, // Always flagged when drug is present — no YES/NO needed
  },
  {
    id: "corticoides",
    triggerKeywords: ["prednisona", "dexametasona", "metilprednisolona"],
    triggerLabel: "Corticoides (Prednisona / Dexametasona / Metilprednisolona)",
    severity: "YELLOW",
    question: "¿Has notado un aumento exagerado de la sed, ganas de orinar a todas horas, o retención de líquidos importante (pies hinchados)?",
    recommendation: "Solicita una cita lo antes posible con tu Médico de Familia o tu Urólogo para realizar un control de azúcar en sangre (glucemia) y revisar la retención de líquidos.",
  },
];

function getActiveChecks(prescriptions) {
  return SAFETY_CHECKS.filter(check =>
    check.triggerKeywords.some(kw =>
      prescriptions.some(p => norm(p.name).includes(kw))
    )
  );
}

function isFlagged(check, answers) {
  if (check.autoFlag) return true;
  const ans = answers[check.id];
  if (ans === undefined || ans === null) return false;
  return check.yesIsBad ? ans === true : ans === true;
}

function generatePDFContent(prescriptions, activeChecks, answers) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const line = "──────────────────────────────────────";

  const flaggedChecks = activeChecks.filter(c => isFlagged(c, answers));
  const maxSeverity = flaggedChecks.some(c => c.severity === "RED") ? "RED" : flaggedChecks.length > 0 ? "YELLOW" : "GREEN";

  const lines = [
    "REPORTE DE SEGURIDAD FARMACOLÓGICA",
    "Plataforma de Pacientes · AEU",
    line,
    `Fecha y Hora de Registro: ${dateStr} ${timeStr}`,
    "",
    "TRATAMIENTO ONCOLÓGICO ACTUAL",
    ...(prescriptions.length > 0
      ? prescriptions.map(p => `• ${p.name}${p.dose ? " — " + p.dose : ""}${p.freq ? " (" + p.freq + ")" : ""}`)
      : ["• Sin fármacos registrados"]),
    "",
    "INTERACCIONES DETECTADAS",
    ...(activeChecks.length > 0
      ? activeChecks.map(c => `• ${c.triggerLabel}`)
      : ["• Ninguna interacción activa detectada"]),
    "",
    "SÍNTOMAS / ALERTAS CONFIRMADOS",
    ...(flaggedChecks.length > 0
      ? flaggedChecks.map(c => `• ${c.triggerLabel}\n  → ${c.recommendation}`)
      : ["• Sin señales de alarma confirmadas"]),
    "",
    line,
    maxSeverity === "RED"
      ? "NIVEL DE ALERTA: CRÍTICO — ACUDIR A URGENCIAS"
      : maxSeverity === "YELLOW"
        ? "NIVEL DE ALERTA: AVISO — SOLICITAR CITA CON SU MÉDICO"
        : "NIVEL DE ALERTA: SIN SEÑALES DE ALARMA",
    "",
    "Documento generado por la Plataforma de Pacientes de la AEU",
    "para soporte en consulta médica.",
    line,
    `Generado con ProstataCare · ${dateStr}`,
  ];

  return lines.join("\n");
}

export default function SafetyCheckerTab({ prescriptions, safetyChecks = [], refresh }) {
  const [answers, setAnswers] = useState({});
  const [phase, setPhase]     = useState("questions");
  const [pdfCopied, setPdfCopied] = useState(false);

  const activeChecks = useMemo(() => getActiveChecks(prescriptions), [prescriptions]);

  const lastCheck = safetyChecks.length > 0
    ? [...safetyChecks].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
    : null;
  const lastCheckDate = lastCheck ? new Date(lastCheck.completedAt) : null;
  const isDue = !lastCheckDate || (Date.now() - lastCheckDate.getTime() > WEEK_MS);
  const nextCheckDate = lastCheckDate
    ? new Date(lastCheckDate.getTime() + WEEK_MS).toLocaleDateString("es-ES", { day: "2-digit", month: "long" })
    : null;

  const answeredCount = activeChecks.filter(c => c.autoFlag || answers[c.id] !== undefined).length;
  const allAnswered = answeredCount === activeChecks.length;

  const flaggedChecks = activeChecks.filter(c => isFlagged(c, answers));
  const hasRed    = flaggedChecks.some(c => c.severity === "RED");
  const hasYellow = flaggedChecks.some(c => c.severity === "YELLOW");
  const resultLevel = hasRed ? "RED" : hasYellow ? "YELLOW" : "GREEN";

  const completeCheck = async () => {
    await dbAdd("safety_checks", { completedAt: new Date().toISOString(), resultLevel });
    if (refresh) refresh();
    setPhase("results");
  };

  const resetCheck = () => {
    setAnswers({});
    setPhase("questions");
  };

  const exportPDF = () => {
    const content = generatePDFContent(prescriptions, activeChecks, answers);
    const style = document.createElement("style");
    style.id = "print-safety";
    style.textContent = `@media print { body > * { display: none !important; } #print-safety-note { display: block !important; } } #print-safety-note { display: none; font-family: 'Courier New', monospace; font-size: 11pt; line-height: 1.7; white-space: pre-wrap; word-break: break-word; padding: 2cm; color: #000; }`;
    document.head.appendChild(style);
    const div = document.createElement("div");
    div.id = "print-safety-note";
    div.textContent = content;
    document.body.appendChild(div);
    window.print();
    document.head.removeChild(style);
    document.body.removeChild(div);
  };

  const copyReport = () => {
    const content = generatePDFContent(prescriptions, activeChecks, answers);
    navigator.clipboard.writeText(content).then(() => {
      setPdfCopied(true);
      setTimeout(() => setPdfCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up">
        <SectionTitle>Control Semanal de Seguridad</SectionTitle>
      </div>

      {/* Estado del control */}
      <div className="fade-up fade-up-d1" style={{ background: isDue ? "rgba(245,158,11,0.08)" : "rgba(46,156,106,0.07)", border: `1.5px solid ${isDue ? "rgba(245,158,11,0.25)" : "rgba(46,156,106,0.2)"}`, borderRadius: "var(--radius-lg)", padding: ".85rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".6rem", alignItems: "center" }}>
        <span style={{ fontSize: "1.1rem" }}>{isDue ? "🔔" : "✅"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: ".82rem", fontWeight: 700, color: isDue ? "var(--amber)" : "var(--green)" }}>
            {isDue ? "Control semanal pendiente" : "Control al día"}
          </p>
          <p style={{ fontSize: ".73rem", color: "var(--muted)", marginTop: ".1rem" }}>
            {lastCheckDate
              ? `Último control: ${lastCheckDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}${!isDue ? ` · Próximo: ${nextCheckDate}` : ""}`
              : "Nunca realizado — completa tu primer control ahora"
            }
          </p>
        </div>
      </div>

      {activeChecks.length === 0 ? (
        <Card style={{ padding: "2.5rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>✅</p>
          <p style={{ color: "var(--navy)", fontSize: ".95rem", fontWeight: 700 }}>Sin interacciones detectadas</p>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: ".4rem", lineHeight: 1.5 }}>
            No hay fármacos de riesgo registrados en tu medicación actual.<br />
            Este control se activará automáticamente si añades alguno.
          </p>
        </Card>
      ) : phase === "questions" ? (
        <>
          {/* Barra de progreso */}
          <div style={{ marginBottom: "1.1rem" }} className="fade-up fade-up-d1">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".35rem" }}>
              <p style={{ fontSize: ".73rem", color: "var(--muted)", fontWeight: 600 }}>{answeredCount} de {activeChecks.length} preguntas respondidas</p>
              {allAnswered && <p style={{ fontSize: ".73rem", color: "var(--green)", fontWeight: 700 }}>Listo para ver resultado ›</p>}
            </div>
            <div style={{ height: "4px", borderRadius: "2px", background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(answeredCount / activeChecks.length) * 100}%`, background: "var(--blue)", borderRadius: "2px", transition: "width .3s ease" }} />
            </div>
          </div>

          {/* Preguntas */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".85rem", marginBottom: "1.25rem" }}>
            {activeChecks.map((check, i) => {
              const ans = answers[check.id];
              const answered = check.autoFlag || ans !== undefined;
              return (
                <Card key={check.id} className={`fade-up fade-up-d${Math.min(i + 1, 4)}`} style={{ padding: "1.1rem", border: `1.5px solid ${answered ? (isFlagged(check, answers) ? (check.severity === "RED" ? "rgba(192,57,75,0.35)" : "rgba(245,158,11,0.35)") : "rgba(46,156,106,0.25)") : "var(--border)"}`, transition: "border-color var(--transition-fast)" }}>
                  <p style={{ fontSize: ".85rem", color: "var(--text)", lineHeight: 1.5, marginBottom: check.autoFlag ? 0 : ".85rem", fontWeight: check.autoFlag ? 600 : 400 }}>
                    {check.autoFlag ? "⚠️ " : ""}{check.question}
                  </p>
                  {!check.autoFlag && (
                    <div style={{ display: "flex", gap: ".6rem" }}>
                      {[true, false].map(val => (
                        <button
                          key={String(val)}
                          onClick={() => setAnswers(a => ({ ...a, [check.id]: val }))}
                          style={{
                            flex: 1, padding: ".55rem", borderRadius: "var(--radius-md)", fontFamily: "inherit",
                            fontSize: ".82rem", fontWeight: 700, cursor: "pointer", transition: "all var(--transition-fast)",
                            border: `1.5px solid ${ans === val ? (val ? (check.yesIsBad ? "rgba(245,158,11,0.5)" : "rgba(192,57,75,0.45)") : "rgba(46,156,106,0.4)") : "var(--border)"}`,
                            background: ans === val ? (val ? (check.yesIsBad ? "rgba(245,158,11,0.1)" : "rgba(192,57,75,0.07)") : "rgba(46,156,106,0.07)") : "var(--card)",
                            color: ans === val ? (val ? (check.yesIsBad ? "var(--amber)" : "var(--rose)") : "var(--green)") : "var(--muted)",
                          }}
                        >
                          {val ? "Sí" : "No"}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <button
            className="btn-primary"
            style={{ opacity: allAnswered ? 1 : 0.4, pointerEvents: allAnswered ? "auto" : "none" }}
            onClick={completeCheck}
          >
            Ver resultado del control
          </button>
        </>
      ) : (
        // RESULTS
        <>
          <Card className="fade-up" style={{ padding: "1.2rem", marginBottom: "1.25rem", border: `2px solid ${resultLevel === "RED" ? "rgba(192,57,75,0.4)" : resultLevel === "YELLOW" ? "rgba(245,158,11,0.4)" : "rgba(46,156,106,0.35)"}`, background: resultLevel === "RED" ? "rgba(192,57,75,0.04)" : resultLevel === "YELLOW" ? "rgba(245,158,11,0.04)" : "rgba(46,156,106,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".75rem" }}>
              <span style={{ fontSize: "1.8rem" }}>{resultLevel === "RED" ? "🚨" : resultLevel === "YELLOW" ? "⚠️" : "✅"}</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: "1rem", color: resultLevel === "RED" ? "var(--rose)" : resultLevel === "YELLOW" ? "var(--amber)" : "var(--green)" }}>
                  {resultLevel === "RED" ? "CRÍTICO — ACUDIR A URGENCIAS" : resultLevel === "YELLOW" ? "AVISO — SOLICITAR CITA" : "Sin señales de alarma"}
                </p>
                <p style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".2rem" }}>
                  {resultLevel === "RED"
                    ? "Los síntomas descritos requieren valoración clínica inmediata. Acude al Servicio de Urgencias hospitalario más cercano lo antes posible. Muestra el PDF adjunto al personal sanitario."
                    : resultLevel === "YELLOW"
                      ? "Se ha detectado una posible interacción o desajuste farmacológico. Solicita cita lo antes posible con tu Médico de Familia o Urólogo para revisar las dosis. No modifiques la pauta por tu cuenta."
                      : "No se han detectado señales de alarma esta semana. Mantén tus controles periódicos con tu equipo médico."
                  }
                </p>
              </div>
            </div>

            {flaggedChecks.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: ".75rem", display: "flex", flexDirection: "column", gap: ".55rem" }}>
                {flaggedChecks.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
                    <span style={{ width: ".42rem", height: ".42rem", borderRadius: "50%", background: c.severity === "RED" ? "var(--rose)" : "var(--amber)", flexShrink: 0, marginTop: ".48rem" }} />
                    <div>
                      <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--navy)" }}>{c.triggerLabel}</p>
                      <p style={{ fontSize: ".76rem", color: "var(--muted)", lineHeight: 1.45, marginTop: ".1rem" }}>{c.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* PDF / Copiar */}
          {(resultLevel === "RED" || resultLevel === "YELLOW") && (
            <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <button onClick={exportPDF} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem" }}>
                <span>📄</span> Guardar reporte PDF
              </button>
              <button onClick={copyReport} className="btn-ghost" style={{ flex: 1, borderColor: pdfCopied ? "var(--green)" : undefined, color: pdfCopied ? "var(--green)" : undefined }}>
                {pdfCopied ? "Copiado ✓" : "Copiar reporte"}
              </button>
            </div>
          )}

          <button className="btn-ghost" style={{ width: "100%" }} onClick={resetCheck}>
            Repetir control
          </button>
        </>
      )}
    </div>
  );
}
