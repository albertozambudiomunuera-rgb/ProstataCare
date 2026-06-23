import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import SeverityPicker from '../components/SeverityPicker';
import TrafficLight from '../components/TrafficLight';
import IIEF5Modal from '../components/IIEF5Modal';
import IPSSModal from '../components/IPSSModal';
import { dbAdd, today, canShowQuestionnaire } from '../db';

const SYMPTOM_GROUPS = {
  "Hormonales": [
    { id: "sofocos",    label: "Sofocos",                icon: "🌡️" },
    { id: "fatiga",     label: "Fatiga",                  icon: "😴" },
    { id: "humor",      label: "Cambios de humor",        icon: "😶" },
    { id: "libido",     label: "Pérdida de libido",       icon: "💔" },
    { id: "disfuncion", label: "Disfunción eréctil",      icon: "⚠️" },
    { id: "ginecomast", label: "Ginecomastia/Dolor mama", icon: "🫀" },
    { id: "cognitivo",  label: "Niebla mental",           icon: "🧠" },
  ],
  "Urinarios": [
    { id: "frecuencia",    label: "Frecuencia urinaria", icon: "🚿" },
    { id: "urgencia",      label: "Urgencia miccional",  icon: "⏱️" },
    { id: "incontinencia", label: "Incontinencia",        icon: "💧" },
    { id: "retencion",     label: "Retención urinaria",  icon: "🔴" },
    { id: "ardor",         label: "Ardor al orinar",     icon: "🔥" },
  ],
  "Dolor / Óseo": [
    { id: "dolor_general",   label: "Dolor general",   icon: "😖" },
    { id: "dolor_oseo",      label: "Dolor óseo",       icon: "🦴" },
    { id: "dolor_articular", label: "Dolor articular",  icon: "🦵" },
  ],
  "Digestivos": [
    { id: "nauseas",  label: "Náuseas",            icon: "🤢" },
    { id: "diarrea",  label: "Diarrea",             icon: "🚽" },
    { id: "apetito",  label: "Pérdida de apetito",  icon: "🍽️" },
    { id: "estrenim", label: "Estreñimiento",       icon: "😣" },
  ],
};

const URINARY_IDS = ["frecuencia", "urgencia", "incontinencia", "retencion", "ardor"];

export default function SymptomsTab({ data, refresh }) {
  const [date, setDate] = useState(today());
  const [symptoms, setSymptoms] = useState({});
  const [notes, setNotes] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'iief5' | 'ipss' | null
  const [modalQueue, setModalQueue] = useState([]);

  const setSev = (id, v) => setSymptoms(p => ({ ...p, [id]: v }));

  const openNextModal = (queue) => {
    if (queue.length > 0) {
      setActiveModal(queue[0]);
      setModalQueue(queue.slice(1));
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
    if (modalQueue.length > 0) {
      setTimeout(() => openNextModal(modalQueue), 300);
    }
  };

  const handleSave = async () => {
    const entry = { date, symptoms, notes, sys: sys ? parseFloat(sys) : null, dia: dia ? parseFloat(dia) : null, weight: weight ? parseFloat(weight) : null, createdAt: new Date().toISOString() };
    await dbAdd("symptom_logs", entry);
    if (sys && dia) await dbAdd("bp_logs", { date, sys: parseFloat(sys), dia: parseFloat(dia) });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    const hasDE      = (symptoms.disfuncion || 0) > 0;
    const hasUrinary = URINARY_IDS.some(id => (symptoms[id] || 0) > 0);

    const queue = [];
    if (hasDE      && await canShowQuestionnaire("iief5")) queue.push("iief5");
    if (hasUrinary && await canShowQuestionnaire("ipss"))  queue.push("ipss");

    setSymptoms({});
    setNotes("");
    setSys("");
    setDia("");
    setWeight("");

    if (queue.length > 0) setTimeout(() => openNextModal(queue), 600);
  };

  const todayStr = today();

  return (
    <div style={{ paddingBottom: "6rem" }}>
      {activeModal === "iief5" && <IIEF5Modal onClose={handleModalClose} />}
      {activeModal === "ipss"  && <IPSSModal  onClose={handleModalClose} />}

      <div style={{ padding: "1.25rem 1rem .75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }} className="fade-up">
          <SectionTitle>Sintomómetro</SectionTitle>
          <input type="date" value={date} max={todayStr} onChange={e => setDate(e.target.value)} className="input" style={{ width: "auto", fontSize: ".85rem", padding: ".45rem .8rem" }} />
        </div>

        {date !== todayStr && (
          <div className="fade-up" style={{ padding: ".65rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "1rem" }}>
            <p style={{ fontSize: ".8rem", color: "var(--amber)", fontWeight: 700 }}>
              Registrando para el {new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        )}

        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d1">
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1rem" }}>Constantes vitales</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem" }}>
            {[
              { label: "Sistólica (mmHg)",  val: sys,    set: setSys,    ph: "120" },
              { label: "Diastólica (mmHg)", val: dia,    set: setDia,    ph: "80"  },
              { label: "Peso (kg)",          val: weight, set: setWeight, ph: "75"  },
            ].map(f => (
              <div key={f.label}>
                <p style={{ fontSize: ".68rem", color: "var(--muted)", marginBottom: ".3rem", fontWeight: 600 }}>{f.label}</p>
                <input type="number" className="input" style={{ fontSize: ".9rem", textAlign: "center", padding: "0.6rem 0.5rem" }} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
              </div>
            ))}
          </div>
          <TrafficLight sys={parseFloat(sys)} dia={parseFloat(dia)} />
        </Card>

        {Object.entries(SYMPTOM_GROUPS).map(([group, effects], idx) => (
          <Card key={group} style={{ padding: "1.2rem", marginBottom: "1rem" }} className={`fade-up fade-up-d${idx + 1}`}>
            <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1rem" }}>{group}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {effects.map(eff => (
                <div key={eff.id} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{eff.icon}</span>
                    <span style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text)" }}>{eff.label}</span>
                  </div>
                  <SeverityPicker value={symptoms[eff.id] || 0} onChange={v => setSev(eff.id, v)} />
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card style={{ padding: "1.2rem", marginBottom: "1.5rem" }} className="fade-up fade-up-d4">
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>Notas y observaciones</p>
          <textarea rows={3} className="input" style={{ resize: "none", lineHeight: "1.4" }} placeholder="Estado de ánimo, actividad física, alimentación u otras observaciones..." value={notes} onChange={e => setNotes(e.target.value)} />
        </Card>

        <button className="btn-primary fade-up fade-up-d4" onClick={handleSave} style={{ background: saved ? "var(--green)" : "var(--blue)", padding: "1rem", marginBottom: "1.25rem" }}>
          {saved ? "Guardado correctamente" : "Guardar registro del día"}
        </button>
      </div>
    </div>
  );
}
