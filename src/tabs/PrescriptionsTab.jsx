import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel } from '../services/secureStorage';

// YELLOW = vigilar analítica/dosis   RED = interacción relevante o riesgo de fallo terapéutico
const DRUG_SAFETY_MAP = {
  "acenocumarol": "YELLOW", "sintrom": "YELLOW", "warfarina": "YELLOW",
  "rivaroxaban": "RED",  "apixaban": "RED",   "dabigatran": "RED",   "edoxaban": "RED",
  "clopidogrel": "RED",  "prasugrel": "RED",  "ticagrelor": "RED",
  "digoxina": "RED",     "amiodarona": "RED",
  "rosuvastatina": "RED", "atorvastatina": "RED", "simvastatina": "RED",
  "amlodipino": "RED",   "nifedipino": "RED", "verapamilo": "RED",   "diltiazem": "RED",
  "furosemida": "YELLOW", "torasemida": "YELLOW", "hidroclorotiazida": "YELLOW", "indapamida": "YELLOW",
  "carbamazepina": "RED", "fenitoina": "RED",  "fenobarbital": "RED",
  "midazolam": "YELLOW", "triazolam": "YELLOW", "diazepam": "YELLOW",
  "alprazolam": "YELLOW", "lormetazepam": "YELLOW",
  "soja": "RED", "isoflavona": "RED",
  "omeprazol": "YELLOW", "esomeprazol": "YELLOW", "lansoprazol": "YELLOW", "pantoprazol": "YELLOW",
  "prednisona": "YELLOW", "dexametasona": "YELLOW", "metilprednisolona": "YELLOW",
};

// Anticoagulantes que requieren control de INR periódico
const INR_DRUGS = ["acenocumarol", "sintrom", "warfarina"];

const DOT_COLOR = { YELLOW: "#d97706", RED: "#dc2626" };

function getRiskLevel(name) {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [kw, level] of Object.entries(DRUG_SAFETY_MAP)) {
    if (n.includes(kw)) return level;
  }
  return null;
}

function needsINR(name) {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return INR_DRUGS.some(kw => n.includes(kw));
}

export default function PrescriptionsTab({ prescriptions, refresh, onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("Diario");
  const [notes, setNotes] = useState("");

  const save = async () => {
    if (!name.trim()) return;
    await dbAdd("prescriptions", { name, dose, freq, notes, addedAt: new Date().toISOString() });
    refresh(); setShowForm(false); setName(""); setDose(""); setFreq("Diario"); setNotes("");
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }} className="fade-up">
        <SectionTitle>Mi tratamiento</SectionTitle>
        <button className="btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".8rem" }} onClick={() => setShowForm(p => !p)}>
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      <div className="fade-up fade-up-d1" style={{ background: "rgba(59, 130, 246, 0.08)", border: "1.5px solid rgba(59, 130, 246, 0.15)", borderRadius: "var(--radius-lg)", padding: ".9rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.2rem", lineHeight: "1" }}>💊</span>
        <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.45 }}>Registra la medicación pautada por tu especialista. Lleva este listado a cada consulta médica.</p>
      </div>

      {showForm && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", border: "1.5px solid rgba(59, 130, 246, 0.25)" }} className="fade-up">
          <p style={{ fontWeight: 700, color: "var(--blue)", fontSize: ".95rem", marginBottom: "1rem" }}>Registrar fármaco prescrito</p>
          {[
            { label: "Nombre del fármaco", val: name, set: setName, ph: "Ej: Enzalutamida, Bicalutamida..." },
            { label: "Dosis", val: dose, set: setDose, ph: "Ej: 160 mg, 50 mg..." },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: ".75rem" }}>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>{f.label}</p>
              <input className="input" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
          <div style={{ marginBottom: ".75rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Frecuencia</p>
            <select className="input" value={freq} onChange={e => setFreq(e.target.value)}>
              {["Diario", "Cada 12h", "Cada 8h", "Semanal", "Mensual", "Según prescripción"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Notas (opcional)</p>
            <textarea rows={2} className="input" style={{ resize: "none", lineHeight: 1.4 }} placeholder="Ej: Tomar con comida, por la mañana..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={save}>Guardar en tratamiento</button>
        </Card>
      )}

      {prescriptions.length === 0 && !showForm ? (
        <Card style={{ padding: "3rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.8rem", marginBottom: "0.85rem" }}>💊</p>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 500 }}>No hay fármacos prescritos registrados.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {prescriptions.map((m, idx) => {
            const riskLevel = getRiskLevel(m.name);
            return (
            <Card key={m.id} style={{ padding: "1.1rem" }} className={`fade-up fade-up-d${Math.min(idx + 1, 4)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <div style={{ width: "2.6rem", height: "2.6rem", background: "rgba(59, 130, 246, 0.08)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>💊</div>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: ".98rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                      {m.name}
                      {riskLevel && (
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: DOT_COLOR[riskLevel], flexShrink: 0, display: "inline-block" }} />
                      )}
                    </p>
                    <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".15rem", fontWeight: 500 }}>Dosis: {m.dose} · Frecuencia: {m.freq}</p>
                    {m.notes && <p style={{ fontSize: ".78rem", color: "var(--blue)", marginTop: ".4rem", background: "var(--accent-light)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-sm)", display: "inline-block", fontWeight: 500 }}>{m.notes}</p>}
                    {needsINR(m.name) && onNavigate && (
                      <button onClick={() => onNavigate("inr")} style={{ display: "flex", alignItems: "center", gap: ".3rem", marginTop: ".5rem", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: ".25rem .6rem", cursor: "pointer", fontFamily: "inherit", fontSize: ".73rem", fontWeight: 700, color: "#b91c1c" }}>
                        🩸 Registrar INR
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={async () => { if (confirm(`¿Eliminar ${m.name} de tu tratamiento?`)) { await dbDel("prescriptions", m.id); refresh(); } }} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: "0.9rem", padding: ".25rem", opacity: 0.6 }}>✕</button>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
