import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel, requestNotificationPermission, scheduleNotification } from '../db';

const REMINDER_TYPES = [
  { id: "medication",  label: "Tomar medicación",          icon: "💊" },
  { id: "psa",         label: "Analítica de PSA",           icon: "🩸" },
  { id: "bp",          label: "Medir tensión",              icon: "🩺" },
  { id: "kegel",       label: "Ejercicios Kegel",           icon: "🏋️" },
  { id: "bone",        label: "Hábitos salud ósea",         icon: "🦴" },
  { id: "appointment", label: "Cita médica",                icon: "🏥" },
  { id: "custom",      label: "Recordatorio personalizado", icon: "🔔" },
];

export default function RemindersTab({ reminders, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("medication");
  const [time, setTime] = useState("08:00");
  const [label, setLabel] = useState("");
  const [notifGranted, setNotifGranted] = useState("Notification" in window ? Notification.permission === "granted" : false);

  const requestPerm = async () => {
    const ok = await requestNotificationPermission();
    setNotifGranted(ok);
  };

  const save = async () => {
    const rtype = REMINDER_TYPES.find(r => r.id === type);
    const entry = { type, time, label: label.trim() || rtype.label, icon: rtype.icon, active: true, createdAt: new Date().toISOString() };
    await dbAdd("reminders", entry);
    refresh(); setShowForm(false); setLabel("");
    if (notifGranted) scheduleNotification(`${entry.label}`, `Recordatorio diario configurado para las ${time}.`, 3000);
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }} className="fade-up">
        <SectionTitle>Recordatorios</SectionTitle>
        <button className="btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".8rem" }} onClick={() => setShowForm(p => !p)}>
          {showForm ? "Cancelar" : "+ Configurar"}
        </button>
      </div>

      {!notifGranted && (
        <div className="fade-up fade-up-d1" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1.5px solid rgba(245, 158, 11, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.1rem 1.2rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: ".9rem", color: "var(--amber)", fontWeight: 700, marginBottom: ".3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            Activa las notificaciones locales
          </p>
          <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "0.85rem", lineHeight: 1.45 }}>Para recibir alertas en tu pantalla, necesitas conceder permisos de notificación en tu navegador.</p>
          <button className="btn-primary" style={{ background: "var(--amber)", padding: ".65rem 1.1rem", fontSize: "0.85rem", width: "auto" }} onClick={requestPerm}>Habilitar notificaciones</button>
        </div>
      )}

      {showForm && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", border: "1.5px solid var(--border)" }} className="fade-up">
          <p style={{ fontWeight: 700, color: "var(--blue)", fontSize: ".95rem", marginBottom: "1rem" }}>Nuevo recordatorio diario</p>
          <div style={{ marginBottom: "0.85rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".45rem" }}>Selecciona el tipo</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem" }}>
              {REMINDER_TYPES.map(r => {
                const sel = type === r.id;
                return (
                  <button key={r.id} type="button" onClick={() => setType(r.id)} style={{ padding: ".6rem .7rem", borderRadius: "var(--radius-sm)", border: "2.5px solid", borderColor: sel ? "var(--blue)" : "var(--border)", background: sel ? "var(--accent-light)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: ".4rem", transition: "all var(--transition-fast)" }}>
                    <span style={{ fontSize: "1rem" }}>{r.icon}</span>
                    <span style={{ fontSize: ".75rem", fontWeight: 700, color: sel ? "var(--blue)" : "var(--muted)" }}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: "0.85rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Hora</p>
            <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1.2rem" }}>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".3rem" }}>Etiqueta personalizada (opcional)</p>
            <input className="input" placeholder="Ej: Pastilla de la mañana..." value={label} onChange={e => setLabel(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={save}>Guardar recordatorio</button>
          {notifGranted && <p style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: ".6rem", textAlign: "center", fontStyle: "italic" }}>Recibirás una alerta de prueba en 3 segundos.</p>}
        </Card>
      )}

      {reminders.length === 0 && !showForm ? (
        <Card style={{ padding: "3rem 1rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: "2.8rem", marginBottom: "0.85rem" }}>🔔</p>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", fontWeight: 500 }}>No tienes recordatorios configurados.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {reminders.map((r, idx) => (
            <Card key={r.id} style={{ padding: "1.1rem" }} className={`fade-up fade-up-d${Math.min(idx + 1, 4)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                  <div style={{ width: "2.6rem", height: "2.6rem", background: "rgba(59, 130, 246, 0.08)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{r.icon}</div>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: ".98rem" }}>{r.label}</p>
                    <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".15rem", fontWeight: 500 }}>Todos los días a las {r.time}</p>
                  </div>
                </div>
                <button onClick={async () => { if (confirm("¿Eliminar este recordatorio?")) { await dbDel("reminders", r.id); refresh(); } }} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: "0.95rem", padding: ".25rem", opacity: 0.6 }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
