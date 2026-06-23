import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel, today } from '../db';

const INR_MIN = 2.0;
const INR_MAX = 3.0;

function getINRStatus(value) {
  const v = parseFloat(value);
  if (isNaN(v) || v <= 0) return null;
  if (v >= INR_MIN && v <= INR_MAX) return "ok";
  return "out";
}

function INRBadge({ value }) {
  const status = getINRStatus(value);
  if (!status) return null;
  const isOk = status === "ok";
  return (
    <span style={{
      display: "inline-block", padding: ".2rem .55rem", borderRadius: "var(--radius-sm)", fontSize: ".72rem", fontWeight: 700,
      background: isOk ? "rgba(46,156,106,0.1)" : "rgba(192,57,75,0.1)",
      color: isOk ? "var(--green)" : "var(--rose)",
      border: `1px solid ${isOk ? "rgba(46,156,106,0.25)" : "rgba(192,57,75,0.25)"}`,
    }}>
      {isOk ? "En rango" : "Fuera de rango"}
    </span>
  );
}

function fmtDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function INRTab({ inrLogs, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate]   = useState(today());
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const save = async () => {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    await dbAdd("inr_logs", { date, value: v, notes: notes.trim(), createdAt: new Date().toISOString() });
    refresh();
    setShowForm(false);
    setDate(today());
    setValue("");
    setNotes("");
  };

  const sorted = [...inrLogs].sort((a, b) => b.date.localeCompare(a.date));
  const lastINR = sorted[0];
  const lastStatus = lastINR ? getINRStatus(lastINR.value) : null;

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }} className="fade-up">
        <SectionTitle>Control de Coagulación (INR)</SectionTitle>
        <button className="btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".8rem" }} onClick={() => setShowForm(p => !p)}>
          {showForm ? "Cancelar" : "+ Registrar"}
        </button>
      </div>

      {/* Rango objetivo */}
      <Card className="fade-up fade-up-d1" style={{ padding: "1rem 1.2rem", marginBottom: "1.25rem", background: "rgba(59,130,246,0.04)", border: "1.5px solid rgba(59,130,246,0.15)" }}>
        <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>Rango terapéutico objetivo</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: ".5rem" }}>
          <span className="serif" style={{ fontSize: "2rem", color: "var(--navy)", lineHeight: 1 }}>2,0 – 3,0</span>
        </div>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".35rem", lineHeight: 1.4 }}>
          Rango estándar para Acenocumarol (Sintrom) y Warfarina. Puede variar según indicación — consulta siempre con tu Hematólogo o centro de control de Sintrom.
        </p>
      </Card>

      {/* Último valor con mensaje */}
      {lastINR && (
        <Card className="fade-up fade-up-d1" style={{ padding: "1rem 1.2rem", marginBottom: "1.25rem", border: `1.5px solid ${lastStatus === "ok" ? "rgba(46,156,106,0.25)" : "rgba(192,57,75,0.25)"}` }}>
          <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".4rem" }}>Último valor registrado</p>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span className="serif" style={{ fontSize: "2.2rem", color: "var(--navy)", lineHeight: 1 }}>{lastINR.value}</span>
            <div>
              <INRBadge value={lastINR.value} />
              <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".25rem" }}>{fmtDate(lastINR.date)}</p>
            </div>
          </div>
          <p style={{ fontSize: ".8rem", lineHeight: 1.5, marginTop: ".6rem", color: lastStatus === "ok" ? "var(--green)" : "var(--rose)", fontWeight: 500 }}>
            {lastStatus === "ok"
              ? "Tu coagulación está en el rango ideal. Mantén tu dosis habitual pautada."
              : "Tu valor está fuera del rango de seguridad. Ponte en contacto con tu centro de control del Sintrom o Hematólogo para ajustar la dosis."
            }
          </p>
        </Card>
      )}

      {/* Formulario */}
      {showForm && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", border: "1.5px solid rgba(59,130,246,0.25)" }} className="fade-up">
          <p style={{ fontWeight: 700, color: "var(--blue)", fontSize: ".95rem", marginBottom: "1rem" }}>Nuevo valor de INR</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: ".75rem" }}>
            <div>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Fecha</p>
              <input type="date" className="input" value={date} max={today()} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Valor INR</p>
              <input
                type="number" step="0.1" min="0.5" max="10" className="input"
                placeholder="Ej: 2.4"
                value={value} onChange={e => setValue(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Notas (opcional)</p>
            <input className="input" placeholder="Ej: Dosis ajustada, analítica urgente..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {value && (
            <div style={{ marginBottom: ".85rem", padding: ".6rem .85rem", borderRadius: "var(--radius-sm)", background: getINRStatus(value) === "ok" ? "rgba(46,156,106,0.08)" : "rgba(192,57,75,0.08)", border: `1px solid ${getINRStatus(value) === "ok" ? "rgba(46,156,106,0.2)" : "rgba(192,57,75,0.2)"}` }}>
              <p style={{ fontSize: ".8rem", fontWeight: 600, color: getINRStatus(value) === "ok" ? "var(--green)" : "var(--rose)" }}>
                {parseFloat(value) < INR_MIN ? `${parseFloat(value).toFixed(1)} — Por debajo del rango (riesgo de trombosis)` :
                 parseFloat(value) > INR_MAX ? `${parseFloat(value).toFixed(1)} — Por encima del rango (riesgo de sangrado)` :
                 `${parseFloat(value).toFixed(1)} — En rango terapéutico ✓`}
              </p>
            </div>
          )}
          <button className="btn-primary" onClick={save} disabled={!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0}>
            Guardar INR
          </button>
        </Card>
      )}

      {sorted.length === 0 && !showForm ? (
        <Card style={{ padding: "3rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.8rem", marginBottom: "0.85rem" }}>🩸</p>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 500 }}>No hay registros de INR.</p>
          <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: ".4rem" }}>Registra tu próximo control de coagulación.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
          {sorted.map((log, idx) => (
            <Card key={log.id} style={{ padding: "1rem 1.1rem" }} className={`fade-up fade-up-d${Math.min(idx + 1, 4)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".85rem" }}>
                  <span className="serif" style={{ fontSize: "1.7rem", color: "var(--navy)", lineHeight: 1 }}>{log.value}</span>
                  <div>
                    <INRBadge value={log.value} />
                    <p style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: ".2rem" }}>{fmtDate(log.date)}</p>
                    {log.notes && <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".1rem", fontStyle: "italic" }}>{log.notes}</p>}
                  </div>
                </div>
                <button onClick={async () => { if (confirm("¿Eliminar este registro de INR?")) { await dbDel("inr_logs", log.id); refresh(); } }} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: ".9rem", padding: ".25rem", opacity: 0.6 }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
