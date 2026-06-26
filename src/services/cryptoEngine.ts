/**
 * cryptoEngine.ts
 *
 * Primitive criptográficas usando la Web Crypto API nativa del navegador.
 * Algoritmo: AES-256-GCM (cifrado autenticado: garantiza confidencialidad + integridad).
 * Derivación de clave (modo PIN): PBKDF2-HMAC-SHA256 con 310 000 iteraciones (OWASP 2023).
 *
 * Ninguna función de este módulo tiene efectos secundarios ni conoce el estado de React.
 */

// 310 000 iteraciones: coste de cómputo ~300ms en mobile 2024, suficiente contra fuerza bruta
const PBKDF2_ITERATIONS = 310_000;
const IV_BYTES  = 12; // 96-bit IV recomendado para AES-GCM
const SALT_BYTES = 16; // 128-bit salt para PBKDF2

// Formato del payload cifrado que se almacena en cada registro
export type EncryptedBlob = {
  iv: string; // base64 — vector de inicialización aleatorio por registro
  ct: string; // base64 — ciphertext (incluye tag de autenticación GCM)
};

// ── Utilidades de codificación ────────────────────────────────────────────────

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromB64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ── Generación de material aleatorio ─────────────────────────────────────────

/** Salt aleatorio de 128 bits, codificado en base64. */
export function generateSalt(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)).buffer);
}

// ── Gestión de claves ─────────────────────────────────────────────────────────

/** Genera una clave AES-256-GCM aleatoria (modo transparente). */
export async function generateRandomKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/** Exporta una CryptoKey como string base64 para persistencia en la vault. */
export async function exportRawKey(key: CryptoKey): Promise<string> {
  return toB64(await crypto.subtle.exportKey("raw", key));
}

/** Importa un string base64 como CryptoKey AES-256-GCM lista para usar. */
export async function importRawKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    fromB64(b64),
    { name: "AES-GCM", length: 256 },
    false, // no exportable desde el contexto de uso
    ["encrypt", "decrypt"]
  );
}

/**
 * Deriva una CryptoKey AES-256-GCM a partir de un PIN de texto plano.
 * El mismo PIN + salt siempre produce la misma clave, pero el salt
 * impide ataques de diccionario precalculado (rainbow tables).
 */
export async function deriveKeyFromPin(pin: string, saltB64: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromB64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Cifrado / descifrado ──────────────────────────────────────────────────────

/** Cifra cualquier valor serializable. Genera un IV único por operación. */
export async function encryptValue(key: CryptoKey, value: unknown): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(value))
  );
  return { iv: toB64(iv.buffer), ct: toB64(ct) };
}

/** Descifra un EncryptedBlob y devuelve el valor original. Lanza si la clave es incorrecta. */
export async function decryptValue(key: CryptoKey, blob: EncryptedBlob): Promise<unknown> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(blob.iv) },
    key,
    fromB64(blob.ct)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

// ── Verificación de clave (modo PIN) ─────────────────────────────────────────

// Valor canario conocido: si el descifrado del token lo devuelve, la clave es correcta.
const CANARY = "ProstataCare::key-ok::v1";

/** Crea un token cifrado que permite verificar el PIN sin almacenar el PIN. */
export async function makeVerifier(key: CryptoKey): Promise<string> {
  return JSON.stringify(await encryptValue(key, CANARY));
}

/**
 * Verifica si una clave derivada es correcta comparándola contra el token guardado.
 * Retorna false (en vez de lanzar) si la clave es errónea o el token está corrupto.
 */
export async function checkVerifier(key: CryptoKey, verifierJson: string): Promise<boolean> {
  try {
    const blob: EncryptedBlob = JSON.parse(verifierJson);
    return (await decryptValue(key, blob)) === CANARY;
  } catch {
    return false;
  }
}
