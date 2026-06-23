import React, { useState } from 'react';

export default function PatientProfileModal({ onDone }) {
  const [step, setStep] = useState("question"); // question | done
  const [operado, setOperado] = useState(null);

  const handleConfirm = () => {
    if (operado === null) return;
    localStorage.setItem("prostatacare-profile", JSON.stringify({ operado, setupDone: true }));
    setStep("done");
    setTimeout(() => onDone({ operado }), 800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "var(--card)", borderRadius: "1.5rem", width: "100%", maxWidth: "380px", padding: "2rem 1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "scaleIn .25s both" }}>

        {step === "question" && (
          <>
            <div style={{ width: "3.5rem", height: "3.5rem", background: "linear-gradient(135deg, #0f2d4a, #1a5c8a)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginBottom: "1.25rem" }}>P</div>
            <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>Configuración inicial</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3, marginBottom: ".75rem" }}>Bienvenido a ProstataCare</h2>
            <p style={{ fontSize: ".88rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: "1.75rem" }}>
              Para personalizar tu experiencia, necesitamos saber un dato clínico básico.
            </p>

            <p style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem", lineHeight: 1.4 }}>
              ¿Has sido operado de próstata?
            </p>
            <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.75rem" }}>
              {[{ val: true, label: "Sí", desc: "Prostatectomía radical u otra cirugía" }, { val: false, label: "No", desc: "Tratamiento farmacológico o vigilancia" }].map(opt => {
                const sel = operado === opt.val;
                return (
                  <button key={String(opt.val)} onClick={() => setOperado(opt.val)}
                    style={{ flex: 1, padding: "1rem .85rem", borderRadius: "var(--radius-md)", border: "2px solid", borderColor: sel ? "var(--blue)" : "var(--border)", background: sel ? "var(--accent-light)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all var(--transition-fast)" }}>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, color: sel ? "var(--blue)" : "var(--text)", marginBottom: ".25rem" }}>{opt.label}</p>
                    <p style={{ fontSize: ".72rem", color: sel ? "var(--blue)" : "var(--muted)", lineHeight: 1.35, fontWeight: sel ? 600 : 400 }}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <button onClick={handleConfirm} disabled={operado === null}
              style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: operado !== null ? "var(--blue)" : "var(--border)", cursor: operado !== null ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: ".95rem", fontWeight: 700, color: operado !== null ? "#fff" : "var(--muted)", transition: "background var(--transition-fast)" }}>
              Continuar
            </button>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", textAlign: "center", marginTop: ".85rem", lineHeight: 1.45 }}>
              Solo se pregunta una vez. Puedes cambiar la configuración en cualquier momento desde Ajustes.
            </p>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2.5px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.5rem" }}>✓</div>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)" }}>Todo listo</p>
            <p style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: ".35rem" }}>Tu perfil ha sido configurado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
