import React, { useState } from 'react';
import Card from '../components/Card';
import TrafficLight from '../components/TrafficLight';
import { today, fmtDate, calcPSADT } from '../db';

function HomeCalendar({ kegelLogs, boneLogs }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const kegelDays = new Set(kegelLogs.map(l => l.date));
  const boneDays  = new Set(boneLogs.filter(l => (l.score || 0) > 0).map(l => l.date));

  const todayStr = today();
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay   = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7; // Monday-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const weekdays  = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const now  = new Date();
    if (next <= new Date(now.getFullYear(), now.getMonth(), 1)) setCurrentMonth(next);
  };

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.2rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--blue)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
        >‹</button>
        <p style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--navy)", textTransform: "capitalize" }}>{monthName}</p>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.2rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--blue)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
        >›</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "3px" }}>
        {weekdays.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: ".6rem", fontWeight: 700, color: "var(--muted)", padding: "0.15rem 0" }}>{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasKegel  = kegelDays.has(dateStr);
          const hasBone   = boneDays.has(dateStr);
          const isToday   = dateStr === todayStr;
          const isFuture  = dateStr > todayStr;
          const hasBoth   = hasKegel && hasBone;
          const hasAny    = hasKegel || hasBone;

          return (
            <div key={dateStr} style={{
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              borderRadius: "var(--radius-sm)",
              border: isToday ? "2px solid var(--blue)" : "1px solid transparent",
              background: hasBoth
                ? "rgba(46, 156, 106, 0.1)"
                : hasKegel
                  ? "rgba(59, 130, 246, 0.07)"
                  : hasBone
                    ? "rgba(224, 123, 42, 0.07)"
                    : isToday
                      ? "var(--accent-light)"
                      : "transparent",
              transition: "background var(--transition-fast)",
            }}>
              {hasBoth ? (
                <span style={{ fontSize: ".65rem", lineHeight: 1, letterSpacing: "-1px" }}>🔥🦴</span>
              ) : hasKegel ? (
                <span style={{ fontSize: ".9rem", lineHeight: 1 }}>🔥</span>
              ) : hasBone ? (
                <span style={{ fontSize: ".9rem", lineHeight: 1 }}>🦴</span>
              ) : (
                <span style={{
                  fontSize: ".7rem",
                  fontWeight: isToday ? 800 : 400,
                  color: isFuture ? "var(--border)" : isToday ? "var(--blue)" : "var(--muted)",
                  lineHeight: 1
                }}>{day}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: ".7rem", color: "var(--muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span>🔥</span> Kegel
        </span>
        <span style={{ fontSize: ".7rem", color: "var(--muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span>🦴</span> Salud ósea
        </span>
        <span style={{ fontSize: ".7rem", color: "var(--muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ fontSize: ".6rem", letterSpacing: "-1px" }}>🔥🦴</span> Ambos
        </span>
      </div>
    </div>
  );
}

export default function HomeTab({ data, onNavigate, profile }) {
  const { symptomLogs, psaLogs, prescriptions, bpLogs, kegelLogs, boneLogs } = data;
  const todayStr      = today();
  const todaySymptoms = symptomLogs.filter(l => l.date === todayStr);
  const hasSevere     = todaySymptoms.flatMap(l => Object.values(l.symptoms || {})).some(v => v >= 3);
  const lastPSA       = [...psaLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const psadt         = calcPSADT(psaLogs);
  const lastBP        = [...bpLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const todayBone     = boneLogs.filter(l => l.date === todayStr);
  const boneScore     = todayBone.length ? todayBone[todayBone.length - 1].score || 0 : 0;
  const operado       = profile?.operado === true;
  const noOperado     = profile?.operado === false;

  const hasMedToday = data.homeMeds?.some(m => m.date === todayStr) || false;

  const kegelCard = { icon: "🏋️", label: "Kegel", sub: kegelLogs.some(l => l.date === todayStr) ? "Completado hoy" : "Pendiente hoy", nav: "kegel", color: "rgba(245, 158, 11, 0.1)", border: operado ? "rgba(245,158,11,0.45)" : "rgba(245, 158, 11, 0.15)" };

  const medicacionCard = { icon: "💊", label: "Medicación", sub: hasMedToday ? "Tomada hoy" : "Pendiente hoy", nav: "prescriptions", color: "rgba(16, 185, 129, 0.1)", border: hasMedToday ? "rgba(16,185,129,0.45)" : "rgba(16, 185, 129, 0.15)" };

  const baseCards = [
    { icon: "🌡️", label: "Síntomas",   sub: todaySymptoms.length ? `${todaySymptoms.length} entrada hoy` : "Sin registro hoy", nav: "symptoms",      color: "var(--accent-light)",        border: "rgba(59, 130, 246, 0.15)" },
    { icon: "🦴", label: "Salud Ósea", sub: boneScore > 0 ? `${boneScore}/7 hábitos hoy` : "Sin registro hoy",                  nav: "bone",          color: "rgba(224, 123, 42, 0.1)",     border: "rgba(224, 123, 42, 0.15)" },
    { icon: "💡", label: "Recomendaciones", sub: "Consejos para ti",                                                           nav: "recommendations", color: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.15)" },
  ];

  const quickCards = operado
    ? [kegelCard, ...baseCards]
    : noOperado
      ? [...baseCards.slice(0, 2), medicacionCard, baseCards[2]]
      : [...baseCards, kegelCard];

  return (
    <div style={{ paddingBottom: "6rem" }}>
      {/* Hero */}
      <div style={{ background: "var(--hero-grad)", borderRadius: "0 0 2rem 2rem", padding: "2rem 1.5rem 2.5rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(15, 45, 74, 0.08)", transition: "background var(--transition-normal)" }}>
        <div style={{ position: "absolute", right: "-2rem", top: "-2rem", width: "9rem", height: "9rem", borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ position: "absolute", right: "2rem", bottom: "-1.5rem", width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(255,255,255,.03)" }} />
        <img src="/Logo-AEU-Corporativo.png" alt="AEU" style={{ position: "absolute", top: "1.25rem", right: "1.25rem", height: "5.6rem", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.55 }} />
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem", letterSpacing: ".15em", textTransform: "uppercase", fontWeight: 700, marginBottom: ".4rem" }}>ProstataCare</p>
        <h1 className="serif fade-up" style={{ color: "#fff", fontSize: "2rem", fontWeight: 400, lineHeight: 1.25 }}>Hola,<br />bienvenido de nuevo</h1>
        <p className="fade-up fade-up-d1" style={{ color: "rgba(255,255,255,.7)", fontSize: ".88rem", marginTop: ".6rem", textTransform: "capitalize", fontWeight: 500 }}>
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="fade-up fade-up-d2" style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1rem" }}>
          <span style={{ width: ".5rem", height: ".5rem", borderRadius: "50%", background: "var(--green)" }} />
          <span style={{ color: "rgba(255,255,255,.55)", fontSize: ".7rem", fontWeight: 500 }}>Seguimiento privado local · Sin conexión externa</span>
        </div>
      </div>

      <div style={{ padding: "0 1.2rem" }}>
        {hasSevere && (
          <div className="fade-up" style={{ background: "rgba(192, 57, 75, 0.08)", border: "1.5px solid rgba(192, 57, 75, 0.2)", borderRadius: "var(--radius-lg)", padding: "1rem 1.2rem", marginBottom: "1.25rem", display: "flex", gap: ".75rem", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem" }}>🚨</span>
            <div>
              <p style={{ fontWeight: 700, color: "var(--rose)", fontSize: ".95rem" }}>Aviso: Síntomas severos hoy</p>
              <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: ".1rem" }}>Considera ponerte en contacto con tu equipo médico habitual.</p>
            </div>
          </div>
        )}

        {/* Quick Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".9rem", marginBottom: "1.25rem" }}>
          {quickCards.map((c, i) => (
            <Card key={c.nav} className={`fade-up fade-up-d${i + 1}`} style={{ padding: "1.1rem 1rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.4rem", border: `1px solid ${c.border}` }} onClick={() => onNavigate(c.nav)}>
              <div style={{ background: c.color, width: "2.4rem", height: "2.4rem", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: ".2rem" }}>{c.icon}</div>
              <p style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--navy)" }}>{c.label}</p>
              <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>{c.sub}</p>
            </Card>
          ))}
        </div>

        {/* PSA Summary (compact) */}
        {lastPSA && (
          <Card className="fade-up fade-up-d3" style={{ padding: "1.1rem 1.2rem", marginBottom: "1rem", cursor: "pointer" }} onClick={() => onNavigate("psa")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".3rem" }}>Último PSA</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: ".5rem" }}>
                  <span className="serif" style={{ fontSize: "1.8rem", color: "var(--navy)", lineHeight: 1 }}>{lastPSA.psa}</span>
                  <span style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>ng/mL · {fmtDate(lastPSA.date)}</span>
                </div>
                {psadt && (
                  <p style={{ fontSize: ".78rem", color: "var(--blue)", marginTop: ".35rem", fontWeight: 600 }}>
                    Tiempo duplicación: <strong>{psadt} meses</strong>
                  </p>
                )}
              </div>
              <div style={{ fontSize: "1.8rem", opacity: 0.5 }}>📈</div>
            </div>
          </Card>
        )}

        {/* BP Summary */}
        {lastBP && (
          <Card className="fade-up fade-up-d4" style={{ padding: "1.2rem", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>Última tensión arterial</p>
            <p className="serif" style={{ fontSize: "1.8rem", color: "var(--navy)", lineHeight: 1 }}>
              {lastBP.sys}/{lastBP.dia} <span style={{ fontSize: "1rem", fontFamily: "inherit", color: "var(--muted)" }}>mmHg</span>
            </p>
            <TrafficLight sys={lastBP.sys} dia={lastBP.dia} />
          </Card>
        )}

        {/* Combined Kegel + Bone Calendar */}
        <Card className="fade-up fade-up-d4" style={{ padding: "1.2rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "0.85rem" }}>
            Actividad diaria
          </p>
          <HomeCalendar kegelLogs={kegelLogs} boneLogs={boneLogs} />
        </Card>

        {/* CTA */}
        <button className="btn-primary fade-up fade-up-d4" style={{ padding: "1rem" }} onClick={() => onNavigate("symptoms")}>
          <span>📋</span> Registrar síntomas de hoy
        </button>
      </div>
    </div>
  );
}
