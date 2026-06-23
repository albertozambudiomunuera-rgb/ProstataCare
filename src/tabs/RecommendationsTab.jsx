import React, { useState } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';

const SECTIONS = [
  {
    id: "alimentacion",
    icon: "🥗",
    title: "Alimentación Inteligente, Salud Metabólica y Microbiota",
    color: "rgba(16, 185, 129, 0.08)",
    accent: "rgba(16, 185, 129, 0.7)",
    border: "rgba(16, 185, 129, 0.2)",
    intro: "El cuerpo funciona como un sistema integrado. Mantener una alimentación de perfil mediterráneo es una herramienta terapéutica activa para proteger tus arterias y tu corazón, asegurar que tu cuerpo absorba correctamente los tratamientos orales y mantener tus defensas fuertes.",
    bullets: [
      "Potencia los antioxidantes naturales: Introduce en tu día a día alimentos ricos en licopeno (como el tomate cocinado, que se absorbe mejor), verduras de hoja verde y crucíferas (brócoli, coliflor).",
      "Grasas saludables frente a grasas saturadas: Prioriza el aceite de oliva virgen extra y los ácidos grasos Omega-3 (pescado azul como el salmón, los boquerones o las sardinas). Reduce al mínimo las carnes rojas procesadas y la bollería industrial.",
      "Protección de tus huesos: Si tu tratamiento afecta a la testosterona, es fundamental asegurar un buen aporte de calcio a través de lácteos desnatados, almendras o legumbres. Consulta con tu urólogo si es recomendable añadir un suplemento de Vitamina D.",
      "Cuida tu microbiota: Consumir alimentos ricos en fibra, yogur o kéfir no solo mejora las digestiones y evita el estreñimiento, sino que la evidencia científica actual demuestra que ayuda a mantener tus defensas fuertes y a que tu organismo asimile de forma óptima las terapias sistémicas.",
    ],
  },
  {
    id: "ejercicio",
    icon: "💪",
    title: "Actividad Física (Tu Medicina Diaria)",
    color: "rgba(59, 130, 246, 0.08)",
    accent: "rgba(59, 130, 246, 0.7)",
    border: "rgba(59, 130, 246, 0.2)",
    intro: "El ejercicio físico ya no se considera un simple consejo de bienestar, sino una parte fundamental del tratamiento médico. Ayuda a neutralizar el cansancio, protege el corazón y mantiene el tejido muscular frente a los tratamientos.",
    bullets: [
      "El valor del entrenamiento de fuerza: Caminar es fantástico, pero para evitar la pérdida de masa muscular es imprescindible realizar ejercicios de fuerza adaptados (pesas ligeras, bandas elásticas o ejercicios con el propio peso corporal) al menos 3 días por semana.",
      "Actividad aeróbica: Combina la fuerza con paseos a ritmo ligero, bicicleta o natación, buscando acumular unos 150 minutos semanales.",
      "Adiós al sedentarismo: Mantener el cuerpo activo mejora drásticamente el estado de ánimo, reduce la grasa abdominal y ayuda a regular el azúcar y el colesterol.",
    ],
  },
  {
    id: "kegel",
    icon: "🏋️",
    title: "Entrenamiento del Suelo Pélvico (Ejercicios de Kegel)",
    color: "rgba(245, 158, 11, 0.08)",
    accent: "rgba(245, 158, 11, 0.7)",
    border: "rgba(245, 158, 11, 0.2)",
    intro: "Mantener la musculatura pélvica activa y entrenada es un pilar básico para dar soporte a la vejiga y asegurar el máximo confort y control urinario durante las diferentes etapas de tus tratamientos.",
    type: "kegel",
    setup: "Imagina que quieres frenar un gas de forma súbita o interrumpir la salida de la orina. Sentirás una elevación interna en la zona del periné. Durante el ejercicio, mantén el abdomen, los glúteos y los muslos completamente relajados; sigue respirando con normalidad.",
    steps: [
      {
        num: 1,
        title: "Fase de Resistencia (Fibras Lentas)",
        text: "Contrae y eleva los músculos con firmeza durante 5 segundos, y luego relájalos por completo durante 10 segundos (es vital que el tiempo de descanso sea el doble). Repite esto 10 veces.",
      },
      {
        num: 2,
        title: "Fase de Reacción (Fibras Rápidas)",
        text: "Realiza 5 contracciones rápidas e intensas de apenas 1 segundo, seguidas de una relajación inmediata. Esto prepara al músculo para cerrarse de golpe ante un esfuerzo imprevisto, como un estornudo, una carcajada o al levantarte de un sofá.",
      },
    ],
    frequency: "Realiza estas series 3 veces al día en diferentes posturas (tumbado, sentado o de pie) para acostumbrar al músculo a trabajar en cualquier situación.",
  },
  {
    id: "sexual",
    icon: "❤️",
    title: "Salud Sexual y Acompañamiento",
    color: "rgba(244, 63, 94, 0.07)",
    accent: "rgba(244, 63, 94, 0.65)",
    border: "rgba(244, 63, 94, 0.18)",
    intro: "Es completamente normal y esperable que los tratamientos sistémicos y locales tengan un impacto directo sobre la esfera sexual, afectando tanto a la erección como al deseo. La clave médica aquí es el abordaje temprano y abierto.",
    bullets: [
      "Normaliza el proceso: La salud sexual cambia durante las terapias, pero esto no significa en absoluto que tu vida íntima o afectiva haya terminado.",
      "Apoyo médico: Hoy en día disponemos de múltiples estrategias farmacológicas, tratamientos locales y dispositivos clínicos que tu urólogo puede pautar para mantener los tejidos activos y oxigenados.",
      "Amplía el concepto de intimidad: La sexualidad y la complicidad en la pareja abarcan mucho más que la penetración. Hablar abiertamente con tu pareja o buscar el apoyo de especialistas reduce la ansiedad de rendimiento y fortalece el vínculo afectivo.",
    ],
  },
  {
    id: "emocional",
    icon: "🧠",
    title: "Bienestar Emocional y Apoyo Psicológico",
    color: "rgba(139, 92, 246, 0.08)",
    accent: "rgba(139, 92, 246, 0.7)",
    border: "rgba(139, 92, 246, 0.2)",
    intro: "El impacto emocional de convivir con un tratamiento médico continuado es profundo y afecta tanto al paciente como a su entorno cercano. Cuidar la mente es tan prioritario como cuidar el cuerpo.",
    bullets: [
      "Exterioriza tus emociones: Sentir miedo, incertidumbre o cansancio psicológico es una reacción humana lógica. Compartir estos sentimientos con tu familia, amigos o en asociaciones de pacientes ayuda a aliviar la carga.",
      "Soporte especializado: Si el insomnio, la ansiedad o el desánimo se vuelven persistentes, solicita a tu equipo médico la derivación a psicooncología. Contar con herramientas profesionales marca una diferencia enorme en la calidad de vida.",
    ],
  },
  {
    id: "hormonal",
    icon: "🌡️",
    title: "Manejo de los Efectos del Bloqueo Hormonal",
    color: "rgba(79, 70, 229, 0.08)",
    accent: "rgba(79, 70, 229, 0.7)",
    border: "rgba(79, 70, 229, 0.2)",
    intro: "Cuando el tratamiento requiere disminuir los niveles de testosterona para frenar el crecimiento de las células tumorales, el cuerpo experimenta una transición metabólica. Conocer estos efectos te permite neutralizarlos.",
    bullets: [
      "Control de los sofocos: Las oleadas de calor repentinas son comunes. Puedes mitigarlas vistiendo con prendas ligeras en capas, manteniendo los espacios frescos y evitando disparadores como las comidas muy picantes, el café o el alcohol. Si son muy molestos, tu médico dispone de tratamientos no hormonales muy eficaces para reducirlos.",
      "Vigilancia de la salud ósea: Al bajar las hormonas, los huesos pueden perder densidad. Además de caminar a diario, tu equipo médico programará pruebas de control (como densitometría ósea) para pautar protectores si fuera necesario.",
      "Seguimiento cardiovascular: Mide de forma regular tu presión arterial y tus niveles de azúcar y colesterol en las analíticas, ya que el bloqueo hormonal puede desajustar estos valores. El ejercicio de fuerza es tu mejor aliado aquí.",
    ],
  },
  {
    id: "innovacion",
    icon: "🔬",
    title: "El Paciente Informado y la Innovación Médica",
    color: "rgba(15, 45, 74, 0.06)",
    accent: "rgba(15, 45, 74, 0.5)",
    border: "rgba(15, 45, 74, 0.15)",
    intro: "El abordaje del cáncer de próstata ha vivido una auténtica revolución tecnológica. Hoy en día disponemos de un abanico terapéutico inmenso y personalizado para cada etapa de la enfermedad.",
    bullets: [
      "Tú marcas el ritmo: Existen múltiples escalones terapéuticos. Si un tratamiento genera efectos incómodos o tu cuerpo deja de responder a él, tu equipo médico dispone de alternativas avanzadas para cambiar de estrategia de inmediato. No estás solo en este camino.",
      "Medicina de precisión y Teranosis: La ciencia actual nos permite diseñar tratamientos dirigidos exclusivamente a las células tumorales (como los radiofármacos avanzados o los antiandrógenos de nueva generación), respetando al máximo los tejidos sanos de alrededor.",
      "El Síndrome de Fatiga Oncológica: Es un cansancio diferente, ligado al propio proceso médico. No se combate quedándose en la cama (el reposo absoluto prolongado lo empeora); la forma médica demostrada de recuperar la vitalidad es el movimiento suave y progresivo.",
      "Logística y vida cotidiana: El tratamiento no debe aislarte. Si vas a viajar o necesitas reincorporarte al trabajo, planifícalo con tu urólogo. Te facilitará informes detallados y pautas para adaptar tus esfuerzos físicos laborales.",
    ],
  },
];

function Kegel({ section, accent }) {
  return (
    <div style={{ marginTop: ".9rem", paddingTop: ".85rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: ".75rem" }}>
      <div style={{ background: "rgba(245,158,11,0.06)", borderRadius: "var(--radius-sm)", padding: ".6rem .8rem", borderLeft: "3px solid rgba(245,158,11,0.5)" }}>
        <p style={{ fontSize: ".82rem", color: "var(--text)", lineHeight: 1.5 }}><strong>Cómo identificar el músculo:</strong> {section.setup}</p>
      </div>
      {section.steps.map(s => (
        <div key={s.num} style={{ display: "flex", gap: ".7rem", alignItems: "flex-start" }}>
          <span style={{ width: "1.6rem", height: "1.6rem", borderRadius: "50%", background: "rgba(245,158,11,0.15)", color: "#92400e", fontWeight: 800, fontSize: ".78rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: ".05rem" }}>{s.num}</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: ".83rem", color: "var(--navy)", marginBottom: ".2rem" }}>{s.title}</p>
            <p style={{ fontSize: ".82rem", color: "var(--text)", lineHeight: 1.5 }}>{s.text}</p>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
        <span style={{ width: ".42rem", height: ".42rem", borderRadius: "50%", background: accent, flexShrink: 0, marginTop: ".48rem" }} />
        <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.5, fontStyle: "italic" }}>{section.frequency}</p>
      </div>
    </div>
  );
}

function BulletList({ bullets, accent }) {
  return (
    <div style={{ marginTop: ".9rem", paddingTop: ".85rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: ".6rem" }}>
      {bullets.map((tip, j) => (
        <div key={j} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
          <span style={{ width: ".42rem", height: ".42rem", borderRadius: "50%", background: accent, flexShrink: 0, marginTop: ".48rem" }} />
          <p style={{ fontSize: ".83rem", color: "var(--text)", lineHeight: 1.55 }}>{tip}</p>
        </div>
      ))}
    </div>
  );
}

export default function RecommendationsTab() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up">
        <SectionTitle>Recomendaciones</SectionTitle>
      </div>

      <div className="fade-up fade-up-d1" style={{ background: "rgba(139, 92, 246, 0.06)", border: "1.5px solid rgba(139, 92, 246, 0.15)", borderRadius: "var(--radius-lg)", padding: ".9rem 1.1rem", marginBottom: "1.5rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.2rem", lineHeight: "1" }}>💡</span>
        <div>
          <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.5 }}>
            Cuidarte va más allá del tratamiento médico. Esta guía está basada en los estándares clínicos de la AEU y EAU (2026). Toca cada apartado para ver los detalles.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
        {SECTIONS.map((section, i) => {
          const isOpen = expanded === i;
          return (
            <Card
              key={section.id}
              className={`fade-up fade-up-d${Math.min(i + 1, 4)}`}
              style={{ padding: "1rem 1.1rem", border: `1.5px solid ${isOpen ? section.border : "var(--border)"}`, cursor: "pointer", transition: "border-color var(--transition-fast)" }}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", background: section.color, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>{section.icon}</div>
                <p style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--navy)", flex: 1, lineHeight: 1.3 }}>{section.title}</p>
                <span style={{ color: "var(--muted)", fontSize: "1rem", display: "block", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform var(--transition-fast)", flexShrink: 0 }}>›</span>
              </div>

              {isOpen && (
                <>
                  <p style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.55, marginTop: ".85rem", paddingTop: ".75rem", borderTop: "1px solid var(--border)", fontStyle: "italic" }}>
                    {section.intro}
                  </p>
                  {section.type === "kegel"
                    ? <Kegel section={section} accent={section.accent} />
                    : <BulletList bullets={section.bullets} accent={section.accent} />
                  }
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: "1.5rem", padding: ".75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg)" }}>
        <p style={{ fontSize: ".72rem", color: "var(--muted)", lineHeight: 1.5, textAlign: "center", fontStyle: "italic" }}>
          Basado en los estándares clínicos de la AEU y EAU · Actualización 2026
        </p>
      </div>
    </div>
  );
}
