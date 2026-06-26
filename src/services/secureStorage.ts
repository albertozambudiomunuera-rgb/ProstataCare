/**
 * secureStorage.ts
 *
 * Wrapper sobre db.js que intercepta todas las operaciones de escritura y lectura
 * para cifrar/descifrar datos de salud de forma transparente.
 *
 * Re-exporta las mismas funciones que db.js (mismo nombre de símbolo), de modo que
 * cambiar el import en los tabs de '../db' a '../services/secureStorage' es todo
 * lo que hace falta: el resto del código no necesita tocar nada más.
 *
 * Formato de registro cifrado en IndexedDB:
 *   { id: number, _enc: string }   ← _enc = JSON(EncryptedBlob)
 *
 * Registros sin _enc (datos anteriores a esta versión) se devuelven tal cual
 * para garantizar retrocompatibilidad con instalaciones existentes.
 */

import {
  dbAll as _dbAll,
  dbAdd as _dbAdd,
  dbUpdate as _dbUpdate,
  dbDel,
  dbClearAll,
  today,
  fmtDate,
  calcPSADT,
  requestNotificationPermission,
  scheduleNotification,
} from "../db";

import { encryptValue, decryptValue, type EncryptedBlob } from "./cryptoEngine";

// Re-exportamos las utilidades que no manejan datos en IndexedDB
export { dbDel, dbClearAll, today, fmtDate, calcPSADT, requestNotificationPermission, scheduleNotification };

// ── Singleton de clave activa ─────────────────────────────────────────────────

let _activeKey: CryptoKey | null = null;

/** Llamado por SecurityContext cuando la clave está lista (tras setup o unlock). */
export function setEncryptionKey(key: CryptoKey): void {
  _activeKey = key;
}

export function clearEncryptionKey(): void {
  _activeKey = null;
}

// ── Key Vault (modo transparente) ─────────────────────────────────────────────
// Base de datos IndexedDB separada del resto de la app para mayor separación lógica.
// Un atacante con acceso al dispositivo puede encontrarla, pero los datos clínicos
// en la DB principal seguirán siendo ilegibles sin importar el key material.

const VAULT_DB_NAME = "ProstataCare_Vault";

async function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VAULT_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore("keys", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Lee la clave transparente exportada (base64) del vault. Devuelve null si no existe. */
export async function loadTransparentKey(): Promise<string | null> {
  try {
    const db = await openVault();
    return new Promise((resolve) => {
      const req = db.transaction("keys", "readonly").objectStore("keys").get(1);
      req.onsuccess = () => resolve((req.result as { rawKey?: string } | undefined)?.rawKey ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Persiste la clave transparente exportada (base64) en el vault. */
export async function saveTransparentKey(rawB64: string): Promise<void> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const req = db.transaction("keys", "readwrite").objectStore("keys").put({ id: 1, rawKey: rawB64 });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Elimina la clave transparente del vault (al hacer reset). */
export async function clearTransparentKey(): Promise<void> {
  try {
    const db = await openVault();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction("keys", "readwrite").objectStore("keys").delete(1);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Si el vault no existe aún, no hay nada que limpiar
  }
}

// ── Lógica interna de cifrado/descifrado por registro ────────────────────────

type RawRecord    = Record<string, unknown> & { id?: number };
type StoredRecord = { id?: number; _enc: string } | RawRecord;

async function encryptRecord(data: RawRecord): Promise<{ id?: number; _enc: string }> {
  if (!_activeKey) throw new Error("secureStorage: clave de cifrado no inicializada");
  const { id, ...payload } = data;
  const blob: EncryptedBlob = await encryptValue(_activeKey, payload);
  const out: { id?: number; _enc: string } = { _enc: JSON.stringify(blob) };
  if (id !== undefined) out.id = id as number;
  return out;
}

async function decryptRecord(record: { id?: number; _enc: string }): Promise<RawRecord> {
  if (!_activeKey) throw new Error("secureStorage: clave de cifrado no inicializada");
  const blob: EncryptedBlob = JSON.parse(record._enc);
  const payload = (await decryptValue(_activeKey, blob)) as RawRecord;
  return { id: record.id, ...payload };
}

// ── API pública (mismos nombres que db.js) ────────────────────────────────────

/**
 * Lee todos los registros de un store.
 * - Si la clave está activa: descifra los que tengan _enc, devuelve tal cual los legacy.
 * - Si la clave no está activa (estado intermedio): devuelve raw sin tocar.
 * Los registros que fallen el descifrado (clave incorrecta, datos corruptos) se descartan
 * en vez de romper toda la carga.
 */
export async function dbAll(store: string): Promise<RawRecord[]> {
  const rows = (await _dbAll(store)) as StoredRecord[];
  if (!_activeKey) return rows as RawRecord[];

  const settled = await Promise.allSettled(
    rows.map((row) =>
      "_enc" in row && typeof (row as { _enc: unknown })._enc === "string"
        ? decryptRecord(row as { id?: number; _enc: string })
        : Promise.resolve(row as RawRecord)
    )
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<RawRecord> => r.status === "fulfilled")
    .map((r) => r.value);
}

/** Añade un nuevo registro al store, cifrándolo si hay clave activa. */
export async function dbAdd(store: string, data: RawRecord): Promise<IDBValidKey> {
  if (!_activeKey) return _dbAdd(store, data);
  return _dbAdd(store, await encryptRecord(data));
}

/** Actualiza un registro existente (debe incluir id), cifrándolo si hay clave activa. */
export async function dbUpdate(store: string, item: RawRecord): Promise<IDBValidKey> {
  if (!_activeKey) return _dbUpdate(store, item);
  return _dbUpdate(store, await encryptRecord(item));
}

/**
 * Versión segura de canShowQuestionnaire: consulta los resultados ya descifrados
 * en vez de leer directamente de IndexedDB (los campos de fecha estarían cifrados).
 */
export async function canShowQuestionnaire(type: string): Promise<boolean> {
  const results = (await dbAll("questionnaire_results")) as Array<{ type: string; date: string }>;
  const last = results
    .filter((r) => r.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return true;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(last.date) < threeMonthsAgo;
}
