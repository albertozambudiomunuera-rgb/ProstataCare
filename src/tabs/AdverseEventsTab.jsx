import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel, dbUpdate, today } from '../services/secureStorage';

const EVENT_SUGGESTIONS = [
  "Trombosis venosa", "Embolia pulmonar", "Infección urinaria", "Infección",
  "Hemorragia", "Fractura ósea", "Reacción alérgica", "Dolor severo",
  "Fiebre alta", "Caída", "Hospitalización",
];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtEventDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdverseEventsTab({ adverseEvents, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate]           = useState(today());
  const [time, setTime]           = useState(nowTime());
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");

  const [editId, setEditId]       = useState(null);
  const [editDate, setEditDate]   = useState("");
  const [editTime, setEditTime]   = useState("");
  const [editType, setEditType]   = useState("");
  const [editDesc, setEditDesc]   = useState("");

  const save = async () => {
    if (!eventType.trim() && !description.trim()) return;
    await dbAdd("adverse_events", {
      date,
      time,
      eventType: eventType.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    });
    refresh();
    setShowForm(false);
    setDate(today());
    setTime(nowTime());
    setEventType("");
    setDescription("");
  };

  const startEdit = (ev) => {
    setEditId(ev.id);
    setEditDate(ev.date || today());
    setEditTime(ev.time || "");
    setEditType(ev.eventType || "");
    setEditDesc(ev.description || "");
  };

  const saveEdit = async (ev) => {
    await dbUpdate("adverse_events", {
      ...ev,
      date: editDate,
      time: editTime,
      eventType: editType.trim(),
      description: editDesc.trim(),
    });
    setEditId(null);
    refresh();
  };

  const del = async (ev) => {
    if (confirm("¿Eliminar este evento adverso del registro?")) {
      await dbDel("adverse_events", ev.id);
      refresh();
    }
  };

  const sorted = [...adverseEvents].sort((a, b) => {
    const ka = (a.date || "") + (a.time || "");
    const kb = (b.date || "") + (b.time || "");
    return kb.localeCompare(ka);
  });

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }} className="fade-up">
        <SectionTitle>Eventos adversos</SectionTitle>
        <button className="btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".8rem" }} onClick={() => setShowForm(p => !p)}>
          {showForm ? "Cancelar" : "+ Registrar"}
        </button>
      </div>

      <div className="fade-up fade-up-d1" style={{ background: "rgba(239, 68, 68, 0.06)", border: "1.5px solid rgba(239, 68, 68, 0.15)", borderRadius: "var(--radius-lg)", padding: ".9rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.2rem", lineHeight: "1" }}>📋</span>
        <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.45 }}>
          Anota cualquier episodio relevante: trombosis, infección, fractura u otro evento que quieras que quede registrado para tu seguimiento médico.
        </p>
      </div>

      {showForm && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", border: "1.5px solid rgba(239, 68, 68, 0.25)" }} className="fade-up">
          <p style={{ fontWeight: 700, color: "var(--rose)", fontSize: ".95rem", marginBottom: "1rem" }}>Nuevo evento adverso</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: ".75rem" }}>
            <div>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Fecha</p>
              <input type="date" className="input" value={date} max={today()} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Hora</p>
              <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: ".75rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Tipo de evento</p>
            <input
              className="input"
              list="event-suggestions"
              placeholder="Ej: Trombosis, Infección urinaria..."
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            />
            <datalist id="event-suggestions">
              {EVENT_SUGGESTIONS.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Descripción</p>
            <textarea
              rows={3}
              className="input"
              style={{ resize: "none", lineHeight: 1.4 }}
              placeholder="Describe brevemente el episodio..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            style={{ background: "var(--rose)", borderColor: "var(--rose)" }}
            onClick={save}
          >
            Guardar evento
          </button>
        </Card>
      )}

      {sorted.length === 0 && !showForm ? (
        <Card style={{ padding: "3rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.8rem", marginBottom: "0.85rem" }}>📋</p>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 500 }}>No hay eventos adversos registrados.</p>
          <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: ".4rem" }}>Usa el botón "+ Registrar" para añadir uno.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {sorted.map((ev, idx) => (
            <Card key={ev.id} style={{ padding: "1.1rem" }} className={`fade-up fade-up-d${Math.min(idx + 1, 4)}`}>
              {editId === ev.id ? (
                <div>
                  <p style={{ fontWeight: 700, color: "var(--rose)", fontSize: ".9rem", marginBottom: ".85rem" }}>Editando evento</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".65rem", marginBottom: ".65rem" }}>
                    <div>
                      <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".25rem" }}>Fecha</p>
                      <input type="date" className="input" value={editDate} max={today()} onChange={e => setEditDate(e.target.value)} />
                    </div>
                    <div>
                      <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".25rem" }}>Hora</p>
                      <input type="time" className="input" value={editTime} onChange={e => setEditTime(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: ".65rem" }}>
                    <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".25rem" }}>Tipo de evento</p>
                    <input
                      className="input"
                      list="event-suggestions-edit"
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                    />
                    <datalist id="event-suggestions-edit">
                      {EVENT_SUGGESTIONS.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                  <div style={{ marginBottom: ".85rem" }}>
                    <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".25rem" }}>Descripción</p>
                    <textarea
                      rows={3}
                      className="input"
                      style={{ resize: "none", lineHeight: 1.4 }}
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    <button className="btn-primary" style={{ flex: 1, fontSize: ".8rem", padding: ".55rem" }} onClick={() => saveEdit(ev)}>Guardar</button>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: ".8rem", padding: ".55rem" }} onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ev.description ? ".5rem" : 0 }}>
                    <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
                      <div style={{ width: "2.4rem", height: "2.4rem", background: "rgba(239, 68, 68, 0.08)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", flexShrink: 0 }}>⚠️</div>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: ".98rem" }}>{ev.eventType || "Evento sin tipo"}</p>
                        <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".1rem" }}>
                          {fmtEventDate(ev.date)}{ev.time ? ` · ${ev.time}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: ".25rem", flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(ev)}
                        style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: ".85rem", padding: ".25rem .35rem", opacity: 0.7 }}
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => del(ev)}
                        style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: ".9rem", padding: ".25rem", opacity: 0.6 }}
                        title="Eliminar"
                      >✕</button>
                    </div>
                  </div>
                  {ev.description && (
                    <p style={{ fontSize: ".82rem", color: "var(--text)", lineHeight: 1.5, marginLeft: "3.15rem", background: "rgba(239,68,68,0.04)", padding: ".4rem .65rem", borderRadius: "var(--radius-sm)", borderLeft: "2.5px solid rgba(239,68,68,0.2)" }}>
                      {ev.description}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
