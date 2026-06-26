import React, { useState, useRef } from "react";
import { useSecurityContext } from "../context/SecurityContext";
import { Shield, Lock, Zap } from "lucide-react";

// ── Componente de entrada de PIN (4 cajas, avance automático) ────────────────

function PinInput({ value, onChange, label, autoFocus = false }) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const digits = (value + "    ").slice(0, 4).split("");

  const handleChange = (i, char) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    const newPin = next.join("").replace(/ /g, "");
    onChange(newPin.slice(0, 4));
    if (digit && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (!digits[i] || digits[i] === " ") {
        if (i > 0) refs[i - 1].current?.focus();
      }
    }
  };

  return (
    <div>
      {label && (
        <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--muted)", marginBottom: ".6rem", textAlign: "center" }}>
          {label}
        </p>
      )}
      <div style={{ display: "flex", gap: ".6rem", justifyContent: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            value={digits[i]?.trim() || ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            style={{
              width: "3rem",
              height: "3.5rem",
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 700,
              border: "2px solid",
              borderColor: digits[i]?.trim() ? "var(--blue)" : "var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg)",
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color var(--transition-fast)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function SecuritySetupModal() {
  const { setupTransparent, setupPin } = useSecurityContext();

  // step: 'choice' | 'pin-create' | 'pin-confirm' | 'working'
  const [step, setStep] = useState("choice");
  const [pin, setPin]           = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  const handleChooseTransparent = async () => {
    setBusy(true);
    await setupTransparent();
    // El contexto ya pone status='ready', el modal desaparece solo
  };

  const handleChoosePin = () => {
    setStep("pin-create");
    setPin("");
    setPinConfirm("");
    setError("");
  };

  const handlePinNext = () => {
    if (pin.length < 4) { setError("Introduce los 4 dígitos."); return; }
    setError("");
    setStep("pin-confirm");
    setPinConfirm("");
  };

  const handlePinConfirm = async () => {
    if (pinConfirm.length < 4) { setError("Introduce los 4 dígitos de confirmación."); return; }
    if (pin !== pinConfirm) {
      setError("Los PINs no coinciden. Inténtalo de nuevo.");
      setPin("");
      setPinConfirm("");
      setStep("pin-create");
      return;
    }
    setBusy(true);
    setError("");
    await setupPin(pin);
    // El contexto pone status='ready', el modal desaparece
  };

  const overlay = {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1.5rem",
  };
  const card = {
    background: "var(--card)",
    borderRadius: "1.5rem",
    width: "100%", maxWidth: "380px",
    padding: "2rem 1.5rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    animation: "scaleIn .25s both",
  };
  const iconBox = (color) => ({
    width: "3.5rem", height: "3.5rem",
    background: color,
    borderRadius: "var(--radius-md)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "1.25rem",
  });

  // ── Pantalla de elección ──
  if (step === "choice") {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={iconBox("linear-gradient(135deg, #0f2d4a, #1a5c8a)")}>
            <Shield size={22} color="#fff" />
          </div>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>
            Privacidad de tus datos
          </p>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3, marginBottom: ".7rem" }}>
            ¿Cómo quieres proteger tu información de salud?
          </h2>
          <p style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Tus datos clínicos (PSA, síntomas, medicación…) se guardan solo en este dispositivo.
            Elige cómo protegerlos.
          </p>

          {/* Opción A — Con clave PIN */}
          <button
            onClick={handleChoosePin}
            style={{
              width: "100%", padding: "1rem 1.1rem",
              borderRadius: "var(--radius-md)",
              border: "2px solid var(--blue)",
              background: "var(--accent-light)",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "flex-start", gap: ".85rem",
              marginBottom: ".75rem",
              textAlign: "left",
              transition: "box-shadow var(--transition-fast)",
            }}
          >
            <div style={{ flexShrink: 0, marginTop: ".1rem" }}>
              <Lock size={20} color="var(--blue)" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--blue)", marginBottom: ".2rem" }}>
                Proteger con clave de acceso
                <span style={{ marginLeft: ".4rem", fontSize: ".7rem", background: "var(--blue)", color: "#fff", borderRadius: "1rem", padding: ".1rem .5rem", fontWeight: 700 }}>
                  Recomendado
                </span>
              </p>
              <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Defines un PIN de 4 dígitos. Los datos se cifran con AES-256 y solo son accesibles con tu clave.
              </p>
            </div>
          </button>

          {/* Opción B — Sin clave (cifrado transparente) */}
          <button
            onClick={handleChooseTransparent}
            disabled={busy}
            style={{
              width: "100%", padding: "1rem 1.1rem",
              borderRadius: "var(--radius-md)",
              border: "2px solid var(--border)",
              background: "transparent",
              cursor: busy ? "wait" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "flex-start", gap: ".85rem",
              textAlign: "left",
              opacity: busy ? .6 : 1,
              transition: "border-color var(--transition-fast)",
            }}
          >
            <div style={{ flexShrink: 0, marginTop: ".1rem" }}>
              <Zap size={20} color="var(--muted)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)", marginBottom: ".2rem" }}>
                Continuar sin clave (Modo rápido)
              </p>
              <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Sin PIN que recordar. Los datos se cifran automáticamente en segundo plano usando una clave generada por el navegador.
              </p>
            </div>
          </button>

          <p style={{ fontSize: ".7rem", color: "var(--muted)", textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
            En ambos casos los datos nunca salen de este dispositivo ni se comparten con terceros.
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla de creación de PIN ──
  if (step === "pin-create") {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={iconBox("linear-gradient(135deg, #0f2d4a, #1a5c8a)")}>
            <Lock size={22} color="#fff" />
          </div>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>
            Paso 1 de 2
          </p>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3, marginBottom: ".6rem" }}>
            Elige tu PIN de 4 dígitos
          </h2>
          <p style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: "1.5rem" }}>
            Necesitarás este PIN cada vez que abras la app para ver tus datos. No se puede recuperar si lo olvidas.
          </p>

          <PinInput value={pin} onChange={setPin} autoFocus />

          {error && (
            <p style={{ fontSize: ".8rem", color: "var(--rose)", textAlign: "center", marginTop: ".7rem", fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handlePinNext}
            disabled={pin.length < 4}
            style={{ marginTop: "1.5rem", opacity: pin.length < 4 ? .5 : 1 }}
          >
            Continuar
          </button>
          <button className="btn-ghost" onClick={() => setStep("choice")} style={{ width: "100%", marginTop: ".6rem", justifyContent: "center" }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla de confirmación de PIN ──
  if (step === "pin-confirm") {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={iconBox("linear-gradient(135deg, #0f2d4a, #1a5c8a)")}>
            <Lock size={22} color="#fff" />
          </div>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".35rem" }}>
            Paso 2 de 2
          </p>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.3, marginBottom: ".6rem" }}>
            Confirma tu PIN
          </h2>
          <p style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: "1.5rem" }}>
            Introduce los mismos 4 dígitos para confirmar.
          </p>

          <PinInput value={pinConfirm} onChange={setPinConfirm} autoFocus />

          {error && (
            <p style={{ fontSize: ".8rem", color: "var(--rose)", textAlign: "center", marginTop: ".7rem", fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handlePinConfirm}
            disabled={pinConfirm.length < 4 || busy}
            style={{ marginTop: "1.5rem", opacity: (pinConfirm.length < 4 || busy) ? .5 : 1 }}
          >
            {busy ? "Configurando…" : "Activar protección"}
          </button>
          <button className="btn-ghost" onClick={() => { setStep("pin-create"); setPin(""); setPinConfirm(""); setError(""); }} style={{ width: "100%", marginTop: ".6rem", justifyContent: "center" }}>
            Cambiar PIN
          </button>
        </div>
      </div>
    );
  }

  return null;
}
