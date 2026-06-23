import React, { useState, useEffect, useCallback } from 'react';
import { dbAll, dbClearAll, dbAdd, today } from './db';
import { Moon, Sun } from 'lucide-react';

import HomeTab from './tabs/HomeTab';
import SymptomsTab from './tabs/SymptomsTab';
import PSATab from './tabs/PSATab';
import PrescriptionsTab from './tabs/PrescriptionsTab';
import HomeMedsTab from './tabs/HomeMedsTab';
import KegelTab from './tabs/KegelTab';
import BoneTab from './tabs/BoneTab';
import RemindersTab from './tabs/RemindersTab';
import MasInfoTab from './tabs/MasInfoTab';
import RecommendationsTab from './tabs/RecommendationsTab';
import AdverseEventsTab from './tabs/AdverseEventsTab';
import INRTab from './tabs/INRTab';
import SafetyCheckerTab from './tabs/SafetyCheckerTab';
import Card from './components/Card';
import PatientProfileModal from './components/PatientProfileModal';

const NAV_ITEMS = [
  { id: "home",     icon: "🏠", label: "Inicio"     },
  { id: "symptoms", icon: "🌡️", label: "Síntomas"   },
  { id: "bone",     icon: "🦴", label: "Salud Ósea" },
  { id: "more",     icon: "☰",  label: "Más"        },
];

const MORE_ITEMS = [
  { id: "psa",             icon: "📈", label: "PSA"         },
  { id: "prescriptions",   icon: "💊", label: "Medicación"  },
  { id: "kegel",           icon: "🏋️", label: "Kegel"       },
  { id: "reminders",       icon: "🔔", label: "Recordat."   },
  { id: "recommendations", icon: "💡", label: "Consejos"    },
  { id: "adverseevents",   icon: "📋", label: "Eventos"     },
  { id: "safetychecker",   icon: "🔍", label: "Control"     },
  { id: "inr",             icon: "🩸", label: "INR"         },
  { id: "masinfo",         icon: "📊", label: "Resumen"     },
];

function getProfile() {
  try {
    const raw = localStorage.getItem("prostatacare-profile");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function notificationsUnsupported() {
  return !("Notification" in window);
}

function shouldShowSafariBanner(remindersCount) {
  if (!notificationsUnsupported()) return false;
  if (remindersCount === 0) return false;
  const dismissed = sessionStorage.getItem("safari-banner-dismissed");
  return !dismissed;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [showMore, setShowMore] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("prostatacare-theme") || "light");
  const [profile, setProfile] = useState(getProfile);
  const [showProfileModal, setShowProfileModal] = useState(() => !getProfile());
  const [safariBannerVisible, setSafariBannerVisible] = useState(false);

  const [data, setData] = useState({
    symptomLogs: [], psaLogs: [], prescriptions: [], homeMeds: [],
    kegelLogs: [], boneLogs: [], bpLogs: [], reminders: [], adverseEvents: [], inrLogs: [], safetyChecks: []
  });
  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [symptomLogs, psaLogs, prescriptions, homeMeds, kegelLogs, boneLogs, bpLogs, reminders, adverseEvents, inrLogs, safetyChecks] = await Promise.all([
        dbAll("symptom_logs"), dbAll("psa_logs"), dbAll("prescriptions"), dbAll("home_meds"),
        dbAll("kegel_logs"), dbAll("bone_logs"), dbAll("bp_logs"), dbAll("reminders"),
        dbAll("adverse_events"), dbAll("inr_logs"), dbAll("safety_checks"),
      ]);
      const newData = { symptomLogs, psaLogs, prescriptions, homeMeds, kegelLogs, boneLogs, bpLogs, reminders, adverseEvents, inrLogs, safetyChecks };
      setData(newData);
      if (shouldShowSafariBanner(reminders.length)) setSafariBannerVisible(true);

      // Auto-trigger weekly safety check when risk drugs are present
      const RISK_KW = ["acenocumarol","sintrom","warfarina","rivaroxaban","apixaban","dabigatran","edoxaban","clopidogrel","prasugrel","ticagrelor","digoxina","amiodarona","rosuvastatina","atorvastatina","simvastatina","amlodipino","nifedipino","verapamilo","diltiazem","furosemida","torasemida","hidroclorotiazida","indapamida","carbamazepina","fenitoina","fenobarbital","midazolam","triazolam","diazepam","alprazolam","lormetazepam","soja","isoflavona","omeprazol","esomeprazol","lansoprazol","pantoprazol","prednisona","dexametasona","metilprednisolona"];
      const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const hasRiskDrug = prescriptions.some(p => RISK_KW.some(kw => norm(p.name).includes(kw)));
      const lastCheck = safetyChecks.length > 0
        ? [...safetyChecks].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
        : null;
      const isDue = !lastCheck || (Date.now() - new Date(lastCheck.completedAt).getTime() > 7 * 24 * 60 * 60 * 1000);
      if (hasRiskDrug && isDue) setShowSafetyPrompt(true);
    } catch (err) {
      console.error("Error al cargar la base de datos", err);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("prostatacare-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");
  const navigate = (t) => { setTab(t); setShowMore(false); };
  const tabInMore = MORE_ITEMS.some(m => m.id === tab);

  const handleProfileDone = (prof) => {
    setProfile(prof);
    setShowProfileModal(false);
  };

  const dismissSafariBanner = () => {
    sessionStorage.setItem("safari-banner-dismissed", "1");
    setSafariBannerVisible(false);
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPSAtoCSV = () => {
    if (data.psaLogs.length === 0) { alert("No hay registros de PSA para exportar."); return; }
    const headers = "Fecha;PSA (ng/mL);Fecha Registro\n";
    const rows = data.psaLogs.sort((a, b) => a.date.localeCompare(b.date))
      .map(r => `${r.date};${r.psa};${r.createdAt || ""}`).join("\n");
    downloadFile(headers + rows, `ProstataCare_PSA_${today()}.csv`, "text/csv;charset=utf-8;");
  };

  const exportSymptomsToCSV = () => {
    if (data.symptomLogs.length === 0) { alert("No hay registros de síntomas para exportar."); return; }
    const headers = "Fecha;Sistólica;Diastólica;Peso;Sofocos;Fatiga;Humor;Libido;Disfunción;Ginecomastia;Cognitivo;Frecuencia;Urgencia;Incontinencia;Retención;Ardor;Dolor General;Dolor Óseo;Dolor Articular;Náuseas;Diarrea;Apetito;Estreñimiento;Notas\n";
    const rows = data.symptomLogs.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
      const s = r.symptoms || {};
      const note = (r.notes || "").replace(/;/g, ",").replace(/\n/g, " ");
      return [r.date, r.sys||"", r.dia||"", r.weight||"",
        s.sofocos||0, s.fatiga||0, s.humor||0, s.libido||0, s.disfuncion||0,
        s.ginecomast||0, s.cognitivo||0, s.frecuencia||0, s.urgencia||0,
        s.incontinencia||0, s.retencion||0, s.ardor||0, s.dolor_general||0,
        s.dolor_oseo||0, s.dolor_articular||0, s.nauseas||0, s.diarrea||0,
        s.apetito||0, s.estrenim||0, note].join(";");
    }).join("\n");
    downloadFile(headers + rows, `ProstataCare_Sintomas_${today()}.csv`, "text/csv;charset=utf-8;");
  };

  const exportBackupJSON = () => {
    downloadFile(JSON.stringify(data, null, 2), `ProstataCare_CopiaSeguridad_${today()}.json`, "application/json");
  };

  const importBackupJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!imported.symptomLogs || !imported.psaLogs) {
          alert("El archivo no tiene el formato correcto de copia de seguridad.");
          return;
        }
        if (!confirm("Se eliminarán TODOS los datos actuales. ¿Continuar?")) return;
        await dbClearAll();
        const restoreStore = async (storeName, list) => {
          if (!list || !Array.isArray(list)) return;
          for (const item of list) {
            const copy = { ...item };
            delete copy.id;
            await dbAdd(storeName, copy);
          }
        };
        await restoreStore("symptom_logs", imported.symptomLogs);
        await restoreStore("psa_logs", imported.psaLogs);
        await restoreStore("prescriptions", imported.prescriptions);
        await restoreStore("home_meds", imported.homeMeds);
        await restoreStore("kegel_logs", imported.kegelLogs);
        await restoreStore("bone_logs", imported.boneLogs);
        await restoreStore("bp_logs", imported.bpLogs);
        await restoreStore("reminders", imported.reminders);
        await restoreStore("adverse_events", imported.adverseEvents);
        await restoreStore("inr_logs", imported.inrLogs);
        await restoreStore("safety_checks", imported.safetyChecks);
        alert("Copia de seguridad restaurada con éxito.");
        await loadAll();
        navigate("home");
      } catch (err) {
        alert("Error al restaurar los datos: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: "430px", margin: "0 auto", position: "relative", display: "flex", flexDirection: "column", transition: "background var(--transition-normal)" }}>

      {showProfileModal && <PatientProfileModal onDone={handleProfileDone} />}

      {/* Weekly safety check prompt */}
      {showSafetyPrompt && !showProfileModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 calc(env(safe-area-inset-bottom,0px) + 5rem)" }}>
          <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", padding: "1.5rem 1.25rem 1.25rem", width: "100%", maxWidth: "430px", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)", animation: "scaleIn var(--transition-fast) both" }}>
            <div style={{ display: "flex", gap: ".85rem", alignItems: "flex-start", marginBottom: "1.1rem" }}>
              <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>🔍</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--navy)", marginBottom: ".3rem" }}>Control de seguridad semanal</p>
                <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.5 }}>
                  Tienes fármacos que requieren vigilancia activa. Responde unas preguntas breves para detectar posibles señales de alerta y generar un informe para tu médico.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: ".6rem" }}>
              <button
                className="btn-primary"
                style={{ flex: 2 }}
                onClick={() => { setShowSafetyPrompt(false); navigate("safetychecker"); }}
              >
                Responder ahora
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowSafetyPrompt(false)}
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--glass-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: ".7rem 1.2rem", display: "flex", alignItems: "center", gap: ".8rem", transition: "background var(--transition-normal), border var(--transition-normal)" }}>
        <div style={{ width: "2.2rem", height: "2.2rem", borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #0f2d4a, #1a5c8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 800, fontSize: ".9rem", boxShadow: "0 2px 8px rgba(15, 45, 74, 0.15)", flexShrink: 0 }}>P</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, color: "var(--navy)", fontSize: ".92rem", lineHeight: 1.1, transition: "color var(--transition-normal)" }}>
            ProstataCare <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: ".78rem" }}>· Tu espacio de seguimiento personalizado</span>
          </p>
          <p style={{ fontSize: ".65rem", color: "var(--muted)", fontWeight: 500, marginTop: ".1rem" }}>Seguimiento privado · Sin registros</p>
        </div>
        <button
          onClick={toggleTheme}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "50%", transition: "background var(--transition-fast)", flexShrink: 0 }}
          title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--border)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>

      {/* Safari in-app notification banner */}
      {safariBannerVisible && (
        <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.25)", padding: ".75rem 1.2rem", display: "flex", alignItems: "flex-start", gap: ".75rem", position: "sticky", top: "3.6rem", zIndex: 29 }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: ".05rem" }}>🔔</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--amber)", lineHeight: 1.3 }}>Recordatorios activos</p>
            <p style={{ fontSize: ".75rem", color: "var(--muted)", lineHeight: 1.4, marginTop: ".2rem" }}>
              Las notificaciones push no están disponibles en este navegador. Recuerda consultar tus recordatorios en la sección correspondiente.
            </p>
          </div>
          <button onClick={dismissSafariBanner} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", padding: ".15rem", flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1 }}>
        {tab === "home"          && <HomeTab data={data} onNavigate={navigate} profile={profile} />}
        {tab === "symptoms"      && <SymptomsTab data={data} refresh={loadAll} />}
        {tab === "psa"           && <PSATab psaLogs={data.psaLogs} theme={theme} refresh={loadAll} />}
        {tab === "prescriptions" && <PrescriptionsTab prescriptions={data.prescriptions} refresh={loadAll} onNavigate={navigate} />}
        {tab === "home_meds"     && <HomeMedsTab homeMeds={data.homeMeds} refresh={loadAll} />}
        {tab === "kegel"         && <KegelTab kegelLogs={data.kegelLogs} refresh={loadAll} />}
        {tab === "bone"          && <BoneTab boneLogs={data.boneLogs} refresh={loadAll} />}
        {tab === "reminders"     && <RemindersTab reminders={data.reminders} refresh={loadAll} />}
        {tab === "recommendations" && <RecommendationsTab />}
        {tab === "adverseevents"  && <AdverseEventsTab adverseEvents={data.adverseEvents} refresh={loadAll} />}
        {tab === "safetychecker"  && <SafetyCheckerTab prescriptions={data.prescriptions} safetyChecks={data.safetyChecks} refresh={loadAll} />}
        {tab === "inr"            && <INRTab inrLogs={data.inrLogs} refresh={loadAll} />}
        {tab === "masinfo"        && <MasInfoTab data={data} />}
      </main>

      {/* More Drawer */}
      {showMore && (
        <div style={{ position: "fixed", bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))", left: "0.75rem", right: "0.75rem", transform: "none", width: "calc(100% - 1.5rem)", maxWidth: "398px", zIndex: 40, animation: "scaleIn var(--transition-fast) both", maxHeight: "calc(100vh - 10rem - env(safe-area-inset-bottom, 0px))", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <Card style={{ padding: "1rem", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: "0.85rem", background: "var(--glass-bg)", backdropFilter: "blur(16px)" }}>
            <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>Opciones de Salud</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
              {MORE_ITEMS.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)} style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".75rem .85rem", borderRadius: "var(--radius-md)", border: "1px solid", borderColor: tab === item.id ? "var(--blue)" : "var(--border)", background: tab === item.id ? "var(--accent-light)" : "var(--card)", cursor: "pointer", fontFamily: "inherit", transition: "all var(--transition-fast)", boxShadow: "var(--shadow)" }}>
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700, color: tab === item.id ? "var(--blue)" : "var(--text)" }}>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>Gestionar mis Datos</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button onClick={exportSymptomsToCSV} className="btn-ghost" style={{ padding: "0.55rem", fontSize: "0.78rem", justifyContent: "center", fontWeight: 600 }}>Síntomas (CSV)</button>
                <button onClick={exportPSAtoCSV} className="btn-ghost" style={{ padding: "0.55rem", fontSize: "0.78rem", justifyContent: "center", fontWeight: 600 }}>PSA (CSV)</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button onClick={exportBackupJSON} className="btn-ghost" style={{ padding: "0.55rem", fontSize: "0.78rem", justifyContent: "center", fontWeight: 600 }}>Exportar JSON</button>
                <label className="btn-ghost" style={{ padding: "0.55rem", fontSize: "0.78rem", justifyContent: "center", fontWeight: 600, cursor: "pointer" }}>
                  Importar JSON
                  <input type="file" accept=".json" onChange={importBackupJSON} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: "1.2rem 1.5rem 6rem", borderTop: "1px solid var(--border)", background: "var(--card)", transition: "background var(--transition-normal), border var(--transition-normal)" }}>
        <p style={{ fontSize: ".81rem", color: "var(--muted)", lineHeight: 1.6 }}>
          © 2026 Dr. Alberto Zambudio. Todos los derechos reservados.<br />
          En colaboración con la Oficina de Salud Digital · AEU
        </p>
      </footer>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", zIndex: 30, background: "var(--glass-bg)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", padding: ".4rem .8rem calc(env(safe-area-inset-bottom, 0px) + .6rem)", display: "flex", boxShadow: "0 -2px 10px rgba(0,0,0,0.02)", transition: "background var(--transition-normal), border var(--transition-normal)" }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === "more" ? (showMore || tabInMore) : tab === item.id;
          return (
            <button key={item.id} className={`tab-btn ${isActive ? "active" : ""}`} onClick={() => {
              if (item.id === "more") { setShowMore(p => !p); }
              else { setShowMore(false); setTab(item.id); }
            }}>
              <span style={{ fontSize: "1.3rem", transform: isActive ? "scale(1.1)" : "none", transition: "transform var(--transition-fast)", display: "block" }}>{item.icon}</span>
              <span style={{ fontSize: ".7rem", fontWeight: 700 }}>{item.label}</span>
              {isActive && <span style={{ width: ".25rem", height: ".25rem", borderRadius: "50%", background: "var(--blue)", marginTop: "1px" }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
