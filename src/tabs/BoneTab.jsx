import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, today } from '../services/secureStorage';

const BONE_HABITS = [
  { id: "ejercicio",   label: "30 min de ejercicio de fuerza o impacto", icon: "🏋️" },
  { id: "calcio",      label: "Suplementos / Calcio / Vitamina D",        icon: "🥛" },
  { id: "sol",         label: "Exposición al sol (+15 min)",              icon: "☀️" },
  { id: "proteina",    label: "Ingesta de proteína adecuada",             icon: "🥩" },
  { id: "alcohol",     label: "Evitar consumo de alcohol",                icon: "🚫" },
  { id: "tabaco",      label: "Evitar el consumo de tabaco",              icon: "🚭" },
  { id: "hidratacion", label: "Hidratación óptima (8 vasos agua)",        icon: "💧" },
];

function getWeekDays() {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function BoneTab({ boneLogs, refresh }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [checked, setChecked] = useState({});
  const [savedToday, setSavedToday] = useState(false);

  // Pre-fill checks when date changes
  useEffect(() => {
    const existing = [...boneLogs].filter(l => l.date === selectedDate).sort((a, b) => b.id - a.id)[0];
    setChecked(existing ? (existing.checks || {}) : {});
  }, [selectedDate, boneLogs]);

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const score = Object.values(checked).filter(Boolean).length;

  const save = async () => {
    await dbAdd("bone_logs", { date: selectedDate, checks: checked, score, createdAt: new Date().toISOString() });
    refresh(); setSavedToday(true); setTimeout(() => setSavedToday(false), 2000);
  };

  const weekDays = getWeekDays();
  const todayStr = today();
  const scoreByDay = {};
  boneLogs.forEach(l => {
    if (!scoreByDay[l.date] || l.score > scoreByDay[l.date]) scoreByDay[l.date] = l.score || 0;
  });

  const getScoreCardStyle = () => {
    if (score >= 5) return { background: "rgba(46, 156, 106, 0.08)", border: "1px solid rgba(46, 156, 106, 0.2)" };
    if (score >= 3) return { background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" };
    return { background: "var(--card)", border: "1px solid var(--border)" };
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up"><SectionTitle>Salud Ósea & Hábitos</SectionTitle></div>

      {/* Adherencia semanal Lun-Dom */}
      <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d1">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "1rem" }}>Adherencia esta semana</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: ".5rem", height: "4.5rem", padding: "0 0.2rem" }}>
          {weekDays.map(d => {
            const s        = scoreByDay[d] || 0;
            const pct      = (s / BONE_HABITS.length) * 100;
            const isFuture = d > todayStr;
            const isToday  = d === todayStr;
            const color    = isFuture ? "var(--border)" : pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "rgba(192,57,75,0.2)";
            return (
              <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".4rem", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", background: color, borderRadius: "0.25rem 0.25rem 0 0", height: `${Math.max(pct, isFuture ? 8 : 8)}%`, minHeight: "6px", transition: "height 0.3s ease, background-color var(--transition-normal)" }} />
                <span style={{ fontSize: ".7rem", color: isToday ? "var(--blue)" : "var(--muted)", fontWeight: isToday ? 700 : 500 }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Date picker */}
      <Card style={{ padding: "1rem 1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d2">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <p style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--navy)" }}>Registrando para:</p>
          <input type="date" className="input" style={{ width: "auto", fontSize: ".85rem", padding: ".4rem .8rem" }} value={selectedDate} max={todayStr} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        {selectedDate !== todayStr && (
          <p style={{ fontSize: ".75rem", color: "var(--amber)", marginTop: ".5rem", fontWeight: 600 }}>
            Registrando un día anterior — {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        )}
      </Card>

      {/* Score card */}
      <Card style={{ padding: "1.2rem", marginBottom: "1.25rem", transition: "all var(--transition-normal)", ...getScoreCardStyle() }} className="fade-up fade-up-d2">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Hábitos completados</p>
            <p className="serif" style={{ fontSize: "2.2rem", color: "var(--navy)", marginTop: ".15rem", lineHeight: 1 }}>
              {score} <span style={{ fontSize: "1.1rem", fontFamily: "inherit", color: "var(--muted)", fontWeight: 500 }}>/ {BONE_HABITS.length}</span>
            </p>
          </div>
          <div style={{ width: "3.6rem", height: "3.6rem", borderRadius: "50%", border: `3px solid ${score >= 5 ? "var(--green)" : score >= 3 ? "var(--amber)" : "var(--border)"}`, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", boxShadow: "var(--shadow)", transition: "border-color var(--transition-normal)" }}>
            {score >= 6 ? "🌟" : score >= 4 ? "👍" : "💪"}
          </div>
        </div>
      </Card>

      {/* Habits list */}
      <Card style={{ padding: "1.2rem", marginBottom: "1.5rem" }} className="fade-up fade-up-d3">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1rem" }}>Hábitos diarios recomendados</p>
        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
          {BONE_HABITS.map(h => {
            const isChecked = !!checked[h.id];
            return (
              <button key={h.id} type="button" className={`checklist-btn ${isChecked ? "checked" : ""}`} onClick={() => toggle(h.id)}>
                <div className="checklist-checkbox">{isChecked ? "✓" : ""}</div>
                <span style={{ fontSize: "1.2rem", lineHeight: "1" }}>{h.icon}</span>
                <span style={{ fontSize: ".9rem", fontWeight: 600, color: isChecked ? "var(--green)" : "var(--text)", transition: "color var(--transition-fast)" }}>{h.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <button className="btn-primary fade-up fade-up-d4" onClick={save} style={{ background: savedToday ? "var(--green)" : "var(--blue)", padding: "1rem" }}>
        {savedToday ? "Guardado correctamente" : selectedDate === todayStr ? "Registrar hábitos de hoy" : "Guardar registro del día seleccionado"}
      </button>
    </div>
  );
}
