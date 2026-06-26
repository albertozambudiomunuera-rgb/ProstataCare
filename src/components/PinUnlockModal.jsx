import React, { useState, useRef } from "react";
import { useSecurityContext } from "../context/SecurityContext";
import { Lock, AlertTriangle } from "lucide-react";

// ── Componente de entrada de PIN ─────────────────────────────────────────────

function PinInput({ value, onChange, disabled, autoFocus }) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const digits = (value + "    ").slice(0, 4).split("");

  const handleChange = (i, char) => {
    if (disabled) return;
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    const newPin = next.join("").replace(/ /g, "");
    onChange(newPin.slice(0, 4));
    if (digit && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (disabled) return;
    if (e.key === "Backspace" && (!digits[i] || digits[i] === " ") && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  return (
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
          disabled={disabled}
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
            background: disabled ? "var(--border)" : "var(--bg)",
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color var(--transition-fast)",
          }}
        />
      ))}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function PinUnlockModal() {
  const { unlockWithPin, resetAll } = useSecurityContext();

  const [pin, setPin]             = useState("");
  const [error, setError]         = useState("");
  const [busy, setBusy]           = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [attempts, setAttempts]   = useState(0);

  const handleUnlock = async () => {
    if (pin.length < 4) return;
    setBusy(true);
    setError("");
    const ok = await unlockWithPin(pin);
    if (!ok) {
      const next = attempts + 1;
      setAttempts(next);
      setError(next >= 3
        ? "PIN incorrecto. Si no lo recuerdas, puedes borrar todos los datos y empezar de nuevo."
        : "PIN incorrecto. Inténtalo de nuevo."
      );
      setPin("");
      setBusy(false);
    }
    // Si ok===true, SecurityContext pone status='ready' y este modal desaparece
  };

  const handleReset = async () => {
    setBusy(true);
    await resetAll();
    // El contexto pone status='needs-setup', SecuritySetupModal aparece
  };

  const overlay = {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1.5rem",
  };
  const card = {
    background: "var(--card)",
    borderRadius: "1.5rem",
    width: "100%", maxWidth: "360px",
    padding: "2rem 1.5rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    animation: "scaleIn .25s both",
  };

  // ── Pantalla de confirmación de reset ──
  if (showReset) {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "rgba(192,57,75,0.12)", border: "2px solid var(--rose)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
            <AlertTriangle size={22} color="var(--rose)" />
          </div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: ".6rem" }}>
            ¿Borrar todos los datos?
          </h2>
          <p style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Esta acción eliminará permanentemente todos tus registros de salud (PSA, síntomas, medicación…) y la configuración de seguridad. <strong>No se puede deshacer.</strong>
          </p>
          <button
            onClick={handleReset}
            disabled={busy}
            style={{ width: "100%", padding: "1rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--rose)", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: ".95rem", cursor: busy ? "wait" : "pointer", marginBottom: ".6rem", opacity: busy ? .6 : 1 }}
          >
            {busy ? "Borrando…" : "Sí, borrar todo y empezar de nuevo"}
          </button>
          <button className="btn-ghost" onClick={() => setShowReset(false)} style={{ width: "100%", justifyContent: "center" }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla de desbloqueo normal ──
  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ width: "3.5rem", height: "3.5rem", background: "linear-gradient(135deg, #0f2d4a, #1a5c8a)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Lock size={22} color="#fff" />
        </div>

        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: ".4rem" }}>
          Introduce tu clave de acceso
        </h2>
        <p style={{ fontSize: ".83rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "1.75rem" }}>
          Tus datos están protegidos. Introduce el PIN que configuraste para acceder.
        </p>

        <PinInput value={pin} onChange={setPin} disabled={busy} autoFocus />

        {error && (
          <p style={{ fontSize: ".8rem", color: "var(--rose)", textAlign: "center", marginTop: ".75rem", fontWeight: 600, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleUnlock}
          disabled={pin.length < 4 || busy}
          style={{ marginTop: "1.5rem", opacity: (pin.length < 4 || busy) ? .5 : 1 }}
        >
          {busy ? "Verificando…" : "Desbloquear"}
        </button>

        <button
          onClick={() => setShowReset(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: ".78rem", color: "var(--muted)", marginTop: "1.25rem", display: "block", width: "100%", textAlign: "center", padding: ".4rem" }}
        >
          Olvidé mi clave → borrar datos y empezar de nuevo
        </button>
      </div>
    </div>
  );
}
