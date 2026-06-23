import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel } from '../db';

export default function HomeMedsTab({ homeMeds, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("Diario");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const save = async () => {
    if (!name.trim()) return;
    await dbAdd("home_meds", { name, dose, freq, reason, notes, addedAt: new Date().toISOString() });
    refresh(); setShowForm(false); setName(""); setDose(""); setFreq("Diario"); setReason(""); setNotes("");
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }} className="fade-up">
        <SectionTitle>Medicación en casa</SectionTitle>
        <button className="btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".8rem" }} onClick={() => setShowForm(p => !p)}>
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      <div className="fade-up fade-up-d1" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1.5px solid rgba(245, 158, 11, 0.15)", borderRadius: "var(--radius-lg)", padding: ".9rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.2rem", lineHeight: "1" }}>🏠</span>
        <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.45 }}>Registra todos los medicamentos, suplementos o vitaminas que tomas por tu cuenta. Tu médico necesita conocerlos para evitar interacciones.</p>
      </div>

      {showForm && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", border: "1.5px solid rgba(245, 158, 11, 0.25)" }} className="fade-up">
          <p style={{ fontWeight: 700, color: "var(--amber)", fontSize: ".95rem", marginBottom: "1rem" }}>Añadir medicamento casero</p>
          {[
            { label: "Nombre o marca", val: name,   set: setName,   ph: "Ej: Omeprazol, Ibuprofeno, Cúrcuma..." },
            { label: "Dosis",           val: dose,   set: setDose,   ph: "Ej: 20 mg, 600 mg, 1 cápsula..."       },
            { label: "Motivo (opcional)",val: reason, set: setReason, ph: "Ej: Acidez de estómago..."             },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: ".75rem" }}>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>{f.label}</p>
              <input className="input" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
          <div style={{ marginBottom: ".75rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Frecuencia</p>
            <select className="input" value={freq} onChange={e => setFreq(e.target.value)}>
              {["Diario", "Semanal", "Según necesidad", "Puntual", "Otro"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Notas</p>
            <textarea rows={2} className="input" style={{ resize: "none", lineHeight: 1.4 }} placeholder="Cuándo lo empezaste, precauciones..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ background: "var(--amber)" }} onClick={save}>Guardar medicamento</button>
        </Card>
      )}

      {homeMeds.length === 0 && !showForm ? (
        <Card style={{ padding: "3rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.8rem", marginBottom: "0.85rem" }}>🏠</p>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 500 }}>No hay medicamentos caseros registrados.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {homeMeds.map((m, idx) => (
            <Card key={m.id} style={{ padding: "1.1rem" }} className={`fade-up fade-up-d${Math.min(idx + 1, 4)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <div style={{ width: "2.6rem", height: "2.6rem", background: "rgba(245, 158, 11, 0.08)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🏠</div>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: ".98rem" }}>{m.name}</p>
                    <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".15rem", fontWeight: 500 }}>Dosis: {m.dose} · Frecuencia: {m.freq}</p>
                    {m.reason && <p style={{ fontSize: ".8rem", color: "var(--amber)", marginTop: ".25rem", fontWeight: 600 }}>Motivo: {m.reason}</p>}
                    {m.notes && <p style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".3rem", fontStyle: "italic" }}>Nota: {m.notes}</p>}
                  </div>
                </div>
                <button onClick={async () => { if (confirm(`¿Eliminar ${m.name}?`)) { await dbDel("home_meds", m.id); refresh(); } }} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: "0.9rem", padding: ".25rem", opacity: 0.6 }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
