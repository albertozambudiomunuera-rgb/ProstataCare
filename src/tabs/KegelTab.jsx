import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, today } from '../db';

const KEGEL_PROGRAMS = [
  { id: "basic",    label: "Básico",   contract: 5,  relax: 5, reps: 8,  description: "Ideal para comenzar"         },
  { id: "standard", label: "Estándar", contract: 7,  relax: 7, reps: 10, description: "Programa habitual"           },
  { id: "advanced", label: "Avanzado", contract: 10, relax: 5, reps: 12, description: "Para pacientes con práctica" },
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

function calcStreak(kegelLogs) {
  const doneDays = new Set(kegelLogs.map(l => l.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (doneDays.has(dateStr)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

export default function KegelTab({ kegelLogs, refresh }) {
  const [program, setProgram] = useState(KEGEL_PROGRAMS[1]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("ready");
  const [rep, setRep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [pastDate, setPastDate] = useState("");
  const [pastSaved, setPastSaved] = useState(false);
  const intervalRef = useRef(null);

  const streak = calcStreak(kegelLogs);
  const weekDays = getWeekDays();
  const doneDays = new Set(kegelLogs.map(l => l.date));
  const todayStr = today();

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false); setPhase("ready"); setRep(0); setTimer(0);
  }, []);

  const start = useCallback(() => {
    setRunning(true); setPhase("contract"); setRep(1); setTimer(program.contract);
  }, [program]);

  useEffect(() => {
    if (!running) return;
    if (phase === "done") { stop(); return; }
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          if (phase === "contract") {
            setPhase("relax"); setTimer(program.relax);
          } else {
            if (rep >= program.reps) {
              setPhase("done");
              dbAdd("kegel_logs", { date: todayStr, program: program.id, reps: program.reps, createdAt: new Date().toISOString() }).then(refresh);
            } else {
              setRep(r => r + 1); setPhase("contract"); setTimer(program.contract);
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, rep, program, stop, refresh, todayStr]);

  const savePastDate = async () => {
    if (!pastDate) return;
    await dbAdd("kegel_logs", { date: pastDate, program: program.id, reps: program.reps, createdAt: new Date().toISOString() });
    refresh(); setPastSaved(true); setTimeout(() => setPastSaved(false), 2000); setPastDate("");
  };

  const getCircleStyle = () => {
    if (phase === "contract") return { background: "linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%)", boxShadow: "0 0 0 10px rgba(59, 130, 246, 0.15)", borderColor: "var(--blue)" };
    if (phase === "relax")    return { background: "linear-gradient(135deg, var(--teal) 0%, var(--green) 100%)", boxShadow: "0 0 0 10px rgba(16, 185, 129, 0.15)", borderColor: "var(--green)" };
    if (phase === "done")     return { background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "none", borderColor: "transparent" };
    return { background: "var(--card)", boxShadow: "none", borderColor: "var(--border)" };
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up"><SectionTitle>Suelo Pélvico (Kegel)</SectionTitle></div>

      {/* Streak Banner */}
      <Card style={{ padding: "1rem 1.2rem", marginBottom: "1.25rem", background: streak > 0 ? "linear-gradient(135deg, rgba(46, 156, 106, 0.1) 0%, rgba(46, 156, 106, 0.03) 100%)" : "var(--card)", border: streak > 0 ? "1px solid rgba(46, 156, 106, 0.25)" : "1px solid var(--border)" }} className="fade-up fade-up-d1">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ fontSize: "2rem", lineHeight: 1 }}>{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "💪"}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>
              Racha de <span style={{ color: streak > 0 ? "var(--green)" : "var(--muted)", fontSize: "1.25rem" }}>{streak}</span> día{streak !== 1 ? "s" : ""} consecutivo{streak !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".1rem", fontWeight: 500 }}>
              {streak === 0 ? "Completa un ejercicio hoy para empezar tu racha" : streak >= 7 ? "¡Racha increíble, sigue así!" : "¡Buen trabajo, no lo abandones!"}
            </p>
          </div>
        </div>
      </Card>

      {/* Adherencia semanal (Lun-Dom) */}
      <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d2">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "1rem" }}>Adherencia esta semana</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: ".5rem", height: "4rem", padding: "0 0.2rem" }}>
          {weekDays.map(d => {
            const done     = doneDays.has(d);
            const isFuture = d > todayStr;
            const isToday  = d === todayStr;
            const color    = done ? "var(--green)" : isFuture ? "var(--border)" : "rgba(192,57,75,0.2)";
            return (
              <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".4rem", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", background: color, borderRadius: "0.25rem 0.25rem 0 0", height: done ? "80%" : "15%", minHeight: "6px", transition: "height 0.3s ease, background-color var(--transition-normal)" }} />
                <span style={{ fontSize: ".7rem", color: isToday ? "var(--blue)" : "var(--muted)", fontWeight: isToday ? 700 : 500 }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Registrar otro día */}
      <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d2">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".75rem" }}>¿Lo hiciste otro día?</p>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <input type="date" className="input" style={{ flex: 1, fontSize: ".88rem" }} value={pastDate} max={todayStr} onChange={e => setPastDate(e.target.value)} />
          <button className="btn-primary" style={{ padding: ".6rem 1rem", fontSize: ".82rem", whiteSpace: "nowrap", background: pastSaved ? "var(--green)" : "var(--blue)" }} onClick={savePastDate} disabled={!pastDate}>
            {pastSaved ? "Guardado" : "Registrar"}
          </button>
        </div>
      </Card>

      {/* Program Selector */}
      {!running && (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d3">
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.85rem" }}>Selecciona tu nivel</p>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {KEGEL_PROGRAMS.map(p => {
              const sel = program.id === p.id;
              return (
                <button key={p.id} onClick={() => setProgram(p)} style={{ padding: ".9rem 1.1rem", borderRadius: "var(--radius-md)", border: "2px solid", borderColor: sel ? "var(--blue)" : "var(--border)", background: sel ? "var(--accent-light)" : "var(--card)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all var(--transition-fast)" }}>
                  <p style={{ fontWeight: 700, color: sel ? "var(--blue)" : "var(--text)", fontSize: ".9rem" }}>{p.label}</p>
                  <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".2rem", fontWeight: 500 }}>Contracción {p.contract}s · Relajación {p.relax}s · {p.reps} repeticiones</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Timer Circle */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 0", gap: "1.5rem" }} className="fade-up fade-up-d4">
        <div className="kegel-circle" style={getCircleStyle()} onClick={running ? stop : start}>
          {running && (phase === "contract" || phase === "relax") && (
            <div className="kegel-active-ring" style={{ borderColor: phase === "contract" ? "var(--blue)" : "var(--green)" }} />
          )}
          {phase === "ready" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.3 }}>Iniciar<br />Entrenamiento</p>
              <p style={{ color: "var(--blue)", fontSize: "0.75rem", fontWeight: 600, marginTop: "0.4rem" }}>Nivel {program.label}</p>
            </div>
          )}
          {phase === "contract" && (<><p style={{ color: "#fff", fontSize: ".8rem", fontWeight: 700, letterSpacing: ".15em" }}>CONTRAE</p><p className="serif" style={{ color: "#fff", fontSize: "3.8rem", lineHeight: 1, marginTop: "0.1rem" }}>{timer}</p></>)}
          {phase === "relax"    && (<><p style={{ color: "#fff", fontSize: ".8rem", fontWeight: 700, letterSpacing: ".15em" }}>RELAJA</p><p className="serif" style={{ color: "#fff", fontSize: "3.8rem", lineHeight: 1, marginTop: "0.1rem" }}>{timer}</p></>)}
          {phase === "done"     && <p style={{ color: "#fff", fontWeight: 700, fontSize: "1.2rem", textAlign: "center", lineHeight: 1.3 }}>¡Completado!</p>}
        </div>
        {running && (
          <div style={{ textAlign: "center" }} className="fade-up">
            <p style={{ fontSize: ".9rem", color: "var(--muted)", fontWeight: 500 }}>Repetición <strong style={{ color: "var(--navy)", fontSize: "1.1rem" }}>{rep}</strong> de {program.reps}</p>
            <button className="btn-ghost" style={{ marginTop: "0.75rem", padding: ".5rem 1.1rem", fontSize: ".82rem" }} onClick={stop}>Detener</button>
          </div>
        )}
      </div>

      {/* Guide */}
      <Card style={{ padding: "1.2rem" }} className="fade-up fade-up-d4">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>¿Cómo realizar los ejercicios?</p>
        <p style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.6, fontWeight: 500 }}>Contrae con firmeza los músculos del suelo pélvico (los mismos que detienen el flujo de orina). Mantén la tensión durante los segundos indicados y suelta por completo al relajar. Mantén una respiración calmada.</p>
        <p style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.6, fontWeight: 500, marginTop: "0.65rem" }}>Se recomienda realizar la sesión <strong style={{ color: "var(--text)", fontWeight: 700 }}>2-3 veces al día</strong> para obtener mejores resultados.</p>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5, marginTop: "0.65rem", fontStyle: "italic" }}>Se recomienda consultar siempre con un especialista antes de iniciar o modificar estos ejercicios.</p>
      </Card>
    </div>
  );
}
