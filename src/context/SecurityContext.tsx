/**
 * SecurityContext.tsx
 *
 * Contexto React que orquesta el ciclo de vida de la clave criptográfica.
 *
 * Estados posibles:
 *   'loading'      — inicializando (leyendo configuración de localStorage / vault)
 *   'needs-setup'  — primera visita, sin configuración de seguridad
 *   'needs-unlock' — modo PIN configurado, esperando que el usuario introduzca el PIN
 *   'ready'        — clave lista, la app puede leer/escribir datos normalmente
 *
 * Llaves de localStorage usadas (solo metadatos, nunca datos clínicos):
 *   prostatacare-security-mode    — 'transparent' | 'pin'
 *   prostatacare-security-salt    — base64, solo en modo PIN
 *   prostatacare-security-verify  — JSON(EncryptedBlob) del canario, solo en modo PIN
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  generateRandomKey,
  exportRawKey,
  importRawKey,
  deriveKeyFromPin,
  generateSalt,
  makeVerifier,
  checkVerifier,
} from "../services/cryptoEngine";
import {
  setEncryptionKey,
  clearEncryptionKey,
  loadTransparentKey,
  saveTransparentKey,
  clearTransparentKey,
  dbClearAll,
} from "../services/secureStorage";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type SecurityStatus = "loading" | "needs-setup" | "needs-unlock" | "ready";

interface SecurityContextValue {
  status: SecurityStatus;
  /** Configura modo transparente (sin PIN). Genera y guarda clave automáticamente. */
  setupTransparent: () => Promise<void>;
  /** Configura modo PIN con el PIN elegido por el usuario. */
  setupPin: (pin: string) => Promise<void>;
  /**
   * Desbloquea la app con el PIN del usuario (en visitas posteriores).
   * Devuelve true si el PIN es correcto, false si no.
   */
  unlockWithPin: (pin: string) => Promise<boolean>;
  /**
   * Elimina TODOS los datos clínicos y la configuración de seguridad,
   * volviendo a la pantalla de configuración inicial.
   * Usar solo tras confirmar con el usuario (acción irreversible).
   */
  resetAll: () => Promise<void>;
}

// ── Contexto ─────────────────────────────────────────────────────────────────

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function useSecurityContext(): SecurityContextValue {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurityContext debe usarse dentro de <SecurityProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SecurityStatus>("loading");

  // Al montar: detectar el modo de seguridad ya configurado
  useEffect(() => {
    (async () => {
      const mode = localStorage.getItem("prostatacare-security-mode");

      if (!mode) {
        setStatus("needs-setup");
        return;
      }

      if (mode === "transparent") {
        const rawB64 = await loadTransparentKey();
        if (rawB64) {
          const key = await importRawKey(rawB64);
          setEncryptionKey(key);
          setStatus("ready");
        } else {
          // La vault se perdió (borrado de datos del navegador u otro motivo).
          // Regeneramos una clave nueva — los datos anteriores serán ilegibles,
          // pero en modo transparente el usuario no tenía PIN y nunca exportó la clave,
          // por lo que este escenario implica que los datos ya estaban inaccesibles.
          const key = await generateRandomKey();
          const raw = await exportRawKey(key);
          await saveTransparentKey(raw);
          setEncryptionKey(key);
          setStatus("ready");
        }
        return;
      }

      if (mode === "pin") {
        // Hay configuración PIN — esperar a que el usuario desbloquee
        setStatus("needs-unlock");
        return;
      }

      // Modo desconocido — resetear a estado inicial
      setStatus("needs-setup");
    })();
  }, []);

  const setupTransparent = useCallback(async () => {
    const key = await generateRandomKey();
    const raw = await exportRawKey(key);
    await saveTransparentKey(raw);
    setEncryptionKey(key);
    localStorage.setItem("prostatacare-security-mode", "transparent");
    setStatus("ready");
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    const salt = generateSalt();
    const key = await deriveKeyFromPin(pin, salt);
    const verifier = await makeVerifier(key);
    setEncryptionKey(key);
    localStorage.setItem("prostatacare-security-mode", "pin");
    localStorage.setItem("prostatacare-security-salt", salt);
    localStorage.setItem("prostatacare-security-verify", verifier);
    setStatus("ready");
  }, []);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const salt = localStorage.getItem("prostatacare-security-salt");
    const verifier = localStorage.getItem("prostatacare-security-verify");
    if (!salt || !verifier) return false;
    const key = await deriveKeyFromPin(pin, salt);
    const valid = await checkVerifier(key, verifier);
    if (valid) {
      setEncryptionKey(key);
      setStatus("ready");
    }
    return valid;
  }, []);

  const resetAll = useCallback(async () => {
    // Borrar datos clínicos de IndexedDB
    await dbClearAll();
    // Borrar clave transparente de la vault
    await clearTransparentKey();
    // Borrar configuración de seguridad de localStorage
    localStorage.removeItem("prostatacare-security-mode");
    localStorage.removeItem("prostatacare-security-salt");
    localStorage.removeItem("prostatacare-security-verify");
    // También limpiar perfil para forzar flujo de bienvenida completo
    localStorage.removeItem("prostatacare-profile");
    clearEncryptionKey();
    setStatus("needs-setup");
  }, []);

  return (
    <SecurityContext.Provider value={{ status, setupTransparent, setupPin, unlockWithPin, resetAll }}>
      {children}
    </SecurityContext.Provider>
  );
}
