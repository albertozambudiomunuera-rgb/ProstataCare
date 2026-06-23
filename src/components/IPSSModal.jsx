import React, { useState } from 'react';
import { dbAdd, today } from '../db';

const QUESTIONS = [
  { id: "q1", text: "¿Con qué frecuencia ha tenido la sensación de no vaciar completamente la vejiga al terminar de orinar?" },
  { id: "q2", text: "¿Con qué frecuencia ha tenido que volver a orinar antes de transcurrir dos horas desde la última micción?" },
  { id: "q3", text: "¿Con qué frecuencia ha notado que al orinar paraba y comenzaba de nuevo varias veces?" },
  { id: "q4", text: "¿Con qué frecuencia le ha resultado difícil aguantar las ganas de orinar?" },
  { id: "q5", text: "¿Con qué frecuencia ha notado que el chorro de orina es débil?" },
  { id: "q6", text: "¿Con qué frecuencia ha tenido que apretar o hacer esfuerzo para comenzar a orinar?" },
  { id: "q7", text: "¿Cuántas veces suele levantarse durante la noche para orinar?", nocturia: true },
];

const STANDARD_OPTIONS = [
  { val: 0, label: "Nunca" },
  { val: 1, label: "Menos de 1 vez de cada 5" },
  { val: 2, label: "Menos de la mitad de las veces" },
  { val: 3, label: "Aproximadamente la mitad de las veces" },
  { val: 4, label: "Más de la mitad de las veces" },
  { val: 5, label: "Casi siempre" },
];

const NOCTURIA_OPTIONS = [
  { val: 0, label: "Ninguna vez" },
  { val: 1, label: "1 vez" },
  { val: 2, label: "2 veces" },
  { val: 3, label: "3 veces" },
  { val: 4, label: "4 veces" },
  { val: 5, label: "5 o más veces" },
];

const QOL_OPTIONS = [
  { val: 0, label: "Encantado" },
  { val: 1, label: "Satisfecho" },
  { val: 2, label: "Más bien satisfecho" },
  { val: 3, label: "Regular (ni satisfecho ni insatisfecho)" },
  { val: 4, label: "Más bien insatisfecho" },
  { val: 5, label: "Muy insatisfecho" },
  { val: 6, label: "Fatal" },
];

function getInterpretation(score) {
  if (score <= 7)  return { label: "Síntomas leves", color: "var(--green)" };
  if (score <= 19) return { label: "Síntomas moderados", color: "var(--amber)" };
  return { label: "Síntomas graves", color: "var(--rose)" };
}

export default function IPSSModal({ onClose }) {
  const [phase, setPhase] = useState("confirm");
  const [answers, setAnswers] = useState({});
  const [qol, setQol] = useState(null);
  const [result, setResult] = useState(null);

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined) && qol !== null;

  const handleSubmit = async () => {
    const score = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    const interp = getInterpretation(score);
    const entry = {
      type: "ipss",
      date: today(),
      score,
      qol,
      interpretation: interp.label,
      answers,
      createdAt: new Date().toISOString(),
    };
    await dbAdd("questionnaire_results", entry);
    setResult({ score, qol, interp });
    setPhase("result");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--card)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", maxWidth: "430px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem 1.25rem 2.5rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", animation: "slideUp .25s both" }}>

        {phase === "confirm" && (
          <>
            <div style={{ width: "3rem", height: "3rem", background: "rgba(245,158,11,0.1)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem" }}>🚿</div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: ".5rem" }}>Cuestionario IPSS</h2>
            <p style={{ fontSize: ".88rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: "1.5rem" }}>
              Has registrado síntomas urinarios. El IPSS (7 preguntas + calidad de vida, 3 min) mide la gravedad de los síntomas del tracto urinario inferior y ayuda a seguir su evolución.
            </p>
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-md)", padding: ".85rem 1rem", marginBottom: "1.5rem", fontSize: ".8rem", color: "var(--amber)", fontWeight: 600, lineHeight: 1.5 }}>
              Solo se pedirá una vez cada 3 meses.
            </div>
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button onClick={onClose} style={{ flex: 1, padding: ".85rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: ".9rem", fontWeight: 700, color: "var(--muted)" }}>
                Omitir
              </button>
              <button onClick={() => setPhase("questions")} style={{ flex: 2, padding: ".85rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--amber)", cursor: "pointer", fontFamily: "inherit", fontSize: ".9rem", fontWeight: 700, color: "#fff" }}>
                Completar cuestionario
              </button>
            </div>
          </>
        )}

        {phase === "questions" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>IPSS</p>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)" }}>Síntomas urinarios</h2>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--muted)", padding: ".25rem" }}>✕</button>
            </div>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "1.25rem", lineHeight: 1.45 }}>
              Piensa en el último mes al responder.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {QUESTIONS.map((q, idx) => {
                const opts = q.nocturia ? NOCTURIA_OPTIONS : STANDARD_OPTIONS;
                return (
                  <div key={q.id}>
                    <p style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--text)", marginBottom: ".75rem", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--amber)", marginRight: ".4rem" }}>{idx + 1}.</span>{q.text}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                      {opts.map(opt => {
                        const sel = answers[q.id] === opt.val;
                        return (
                          <button key={opt.val} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.val }))}
                            style={{ padding: ".65rem .9rem", borderRadius: "var(--radius-sm)", border: "1.5px solid", borderColor: sel ? "var(--amber)" : "var(--border)", background: sel ? "rgba(245,158,11,0.08)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem", fontWeight: sel ? 700 : 500, color: sel ? "var(--amber)" : "var(--text)", textAlign: "left", transition: "all var(--transition-fast)" }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* QoL question */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".6rem" }}>Calidad de vida</p>
                <p style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--text)", marginBottom: ".75rem", lineHeight: 1.4 }}>
                  Si tuviera que pasar el resto de su vida con sus problemas urinarios tal como los tiene ahora, ¿cómo se sentiría?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                  {QOL_OPTIONS.map(opt => {
                    const sel = qol === opt.val;
                    return (
                      <button key={opt.val} onClick={() => setQol(opt.val)}
                        style={{ padding: ".65rem .9rem", borderRadius: "var(--radius-sm)", border: "1.5px solid", borderColor: sel ? "var(--blue)" : "var(--border)", background: sel ? "var(--accent-light)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem", fontWeight: sel ? 700 : 500, color: sel ? "var(--blue)" : "var(--text)", textAlign: "left", transition: "all var(--transition-fast)" }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!allAnswered}
              style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: allAnswered ? "var(--amber)" : "var(--border)", cursor: allAnswered ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: ".95rem", fontWeight: 700, color: allAnswered ? "#fff" : "var(--muted)", transition: "background var(--transition-fast)" }}>
              Ver resultado
            </button>
          </>
        )}

        {phase === "result" && result && (
          <div style={{ textAlign: "center", paddingTop: ".5rem" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: result.interp.color + "22", border: `2.5px solid ${result.interp.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.6rem" }}>
              {result.score <= 7 ? "✓" : result.score <= 19 ? "➔" : "⚠"}
            </div>
            <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>Puntuación IPSS</p>
            <p style={{ fontSize: "2.8rem", fontWeight: 800, color: result.interp.color, lineHeight: 1, marginBottom: ".5rem" }}>{result.score}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--muted)" }}>/35</span></p>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: result.interp.color, marginBottom: ".6rem" }}>{result.interp.label}</p>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
              Calidad de vida: <strong style={{ color: "var(--text)" }}>{QOL_OPTIONS[result.qol]?.label}</strong>
            </p>
            <div style={{ background: "var(--bg)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
              {[
                { range: "0–7",   label: "Síntomas leves",    active: result.score <= 7 },
                { range: "8–19",  label: "Síntomas moderados", active: result.score >= 8 && result.score <= 19 },
                { range: "20–35", label: "Síntomas graves",    active: result.score >= 20 },
              ].map(item => (
                <div key={item.range} style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".35rem 0", opacity: item.active ? 1 : 0.35 }}>
                  <span style={{ width: ".4rem", height: ".4rem", borderRadius: "50%", background: item.active ? result.interp.color : "var(--border)", flexShrink: 0 }} />
                  <span style={{ fontSize: ".78rem", fontWeight: item.active ? 700 : 400, color: item.active ? "var(--text)" : "var(--muted)" }}>{item.range} — {item.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Resultado guardado. Comparte este dato con tu urólogo en la próxima consulta.
            </p>
            <button onClick={onClose} style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--amber)", cursor: "pointer", fontFamily: "inherit", fontSize: ".95rem", fontWeight: 700, color: "#fff" }}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
