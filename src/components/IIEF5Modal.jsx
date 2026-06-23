import React, { useState } from 'react';
import { dbAdd, today } from '../db';

const QUESTIONS = [
  {
    id: "q1",
    text: "¿Con qué frecuencia fue capaz de tener una erección durante la actividad sexual?",
    options: [
      { val: 1, label: "Casi nunca o nunca" },
      { val: 2, label: "Pocas veces (menos de la mitad)" },
      { val: 3, label: "A veces (aprox. la mitad)" },
      { val: 4, label: "La mayoría de las veces" },
      { val: 5, label: "Casi siempre o siempre" },
    ],
  },
  {
    id: "q2",
    text: "Cuando tuvo erecciones, ¿con qué frecuencia fueron suficientemente rígidas para la penetración?",
    options: [
      { val: 1, label: "Casi nunca o nunca" },
      { val: 2, label: "Pocas veces (menos de la mitad)" },
      { val: 3, label: "A veces (aprox. la mitad)" },
      { val: 4, label: "La mayoría de las veces" },
      { val: 5, label: "Casi siempre o siempre" },
    ],
  },
  {
    id: "q3",
    text: "Cuando intentó el coito, ¿con qué frecuencia fue capaz de penetrar a su pareja?",
    options: [
      { val: 1, label: "Casi nunca o nunca" },
      { val: 2, label: "Pocas veces (menos de la mitad)" },
      { val: 3, label: "A veces (aprox. la mitad)" },
      { val: 4, label: "La mayoría de las veces" },
      { val: 5, label: "Casi siempre o siempre" },
    ],
  },
  {
    id: "q4",
    text: "Durante el coito, ¿con qué frecuencia pudo mantener la erección tras penetrar a su pareja?",
    options: [
      { val: 1, label: "Casi nunca o nunca" },
      { val: 2, label: "Pocas veces (menos de la mitad)" },
      { val: 3, label: "A veces (aprox. la mitad)" },
      { val: 4, label: "La mayoría de las veces" },
      { val: 5, label: "Casi siempre o siempre" },
    ],
  },
  {
    id: "q5",
    text: "Durante el coito, ¿cuánta dificultad tuvo para mantener la erección hasta completarlo?",
    options: [
      { val: 1, label: "Extremadamente difícil" },
      { val: 2, label: "Muy difícil" },
      { val: 3, label: "Difícil" },
      { val: 4, label: "Ligeramente difícil" },
      { val: 5, label: "Sin dificultad" },
    ],
  },
];

function getInterpretation(score) {
  if (score >= 22) return { label: "Sin disfunción eréctil", color: "var(--green)" };
  if (score >= 17) return { label: "Disfunción eréctil leve", color: "var(--blue)" };
  if (score >= 12) return { label: "Disfunción eréctil leve-moderada", color: "var(--amber)" };
  if (score >= 8)  return { label: "Disfunción eréctil moderada", color: "#e07a2a" };
  return { label: "Disfunción eréctil grave", color: "var(--rose)" };
}

export default function IIEF5Modal({ onClose }) {
  const [phase, setPhase] = useState("confirm"); // confirm | questions | result
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    const score = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    const interp = getInterpretation(score);
    const entry = {
      type: "iief5",
      date: today(),
      score,
      interpretation: interp.label,
      answers,
      createdAt: new Date().toISOString(),
    };
    await dbAdd("questionnaire_results", entry);
    setResult({ score, interp });
    setPhase("result");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--card)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", maxWidth: "430px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem 1.25rem 2.5rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", animation: "slideUp .25s both" }}>

        {phase === "confirm" && (
          <>
            <div style={{ width: "3rem", height: "3rem", background: "rgba(59,130,246,0.1)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem" }}>📋</div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: ".5rem" }}>Cuestionario IIEF-5</h2>
            <p style={{ fontSize: ".88rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: "1.5rem" }}>
              Has registrado disfunción eréctil. El cuestionario IIEF-5 (5 preguntas, 2 min) permite valorar su intensidad clínica y seguir la evolución en el tiempo.
            </p>
            <div style={{ background: "var(--accent-light)", borderRadius: "var(--radius-md)", padding: ".85rem 1rem", marginBottom: "1.5rem", fontSize: ".8rem", color: "var(--blue)", fontWeight: 600, lineHeight: 1.5 }}>
              Solo se pedirá una vez cada 3 meses.
            </div>
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button onClick={onClose} style={{ flex: 1, padding: ".85rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: ".9rem", fontWeight: 700, color: "var(--muted)" }}>
                Omitir
              </button>
              <button onClick={() => setPhase("questions")} style={{ flex: 2, padding: ".85rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--blue)", cursor: "pointer", fontFamily: "inherit", fontSize: ".9rem", fontWeight: 700, color: "#fff" }}>
                Completar cuestionario
              </button>
            </div>
          </>
        )}

        {phase === "questions" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>IIEF-5</p>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)" }}>Función eréctil</h2>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--muted)", padding: ".25rem" }}>✕</button>
            </div>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "1.25rem", lineHeight: 1.45 }}>
              Piensa en las últimas 4 semanas al responder.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {QUESTIONS.map((q, idx) => (
                <div key={q.id}>
                  <p style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--text)", marginBottom: ".75rem", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--blue)", marginRight: ".4rem" }}>{idx + 1}.</span>{q.text}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                    {q.options.map(opt => {
                      const sel = answers[q.id] === opt.val;
                      return (
                        <button key={opt.val} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.val }))}
                          style={{ padding: ".65rem .9rem", borderRadius: "var(--radius-sm)", border: "1.5px solid", borderColor: sel ? "var(--blue)" : "var(--border)", background: sel ? "var(--accent-light)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem", fontWeight: sel ? 700 : 500, color: sel ? "var(--blue)" : "var(--text)", textAlign: "left", transition: "all var(--transition-fast)" }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={!allAnswered}
              style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: allAnswered ? "var(--blue)" : "var(--border)", cursor: allAnswered ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: ".95rem", fontWeight: 700, color: allAnswered ? "#fff" : "var(--muted)", transition: "background var(--transition-fast)" }}>
              Ver resultado
            </button>
          </>
        )}

        {phase === "result" && result && (
          <>
            <div style={{ textAlign: "center", paddingTop: ".5rem" }}>
              <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: result.interp.color + "22", border: `2.5px solid ${result.interp.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.6rem" }}>
                {result.score >= 22 ? "✓" : result.score >= 17 ? "➔" : "⚠"}
              </div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>Puntuación IIEF-5</p>
              <p style={{ fontSize: "2.8rem", fontWeight: 800, color: result.interp.color, lineHeight: 1, marginBottom: ".5rem" }}>{result.score}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--muted)" }}>/25</span></p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: result.interp.color, marginBottom: "1.5rem" }}>{result.interp.label}</p>
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
                {[
                  { range: "22–25", label: "Sin disfunción eréctil", active: result.score >= 22 },
                  { range: "17–21", label: "Leve", active: result.score >= 17 && result.score <= 21 },
                  { range: "12–16", label: "Leve-moderada", active: result.score >= 12 && result.score <= 16 },
                  { range: "8–11",  label: "Moderada", active: result.score >= 8 && result.score <= 11 },
                  { range: "5–7",   label: "Grave", active: result.score <= 7 },
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
              <button onClick={onClose} style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--blue)", cursor: "pointer", fontFamily: "inherit", fontSize: ".95rem", fontWeight: 700, color: "#fff" }}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
