const DB_NAME = "ProstataCareV2";
const DB_VERSION = 4;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const stores = [
        { name: "symptom_logs",         opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "psa_logs",             opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "prescriptions",        opts: { keyPath: "id", autoIncrement: true }, indexes: [] },
        { name: "home_meds",            opts: { keyPath: "id", autoIncrement: true }, indexes: [] },
        { name: "kegel_logs",           opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "bone_logs",            opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "bp_logs",              opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "reminders",            opts: { keyPath: "id", autoIncrement: true }, indexes: [] },
        { name: "questionnaire_results", opts: { keyPath: "id", autoIncrement: true }, indexes: [["type", "type"], ["date", "date"]] },
        { name: "adverse_events",        opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
        { name: "inr_logs",              opts: { keyPath: "id", autoIncrement: true }, indexes: [["date", "date"]] },
      ];
      stores.forEach(({ name, opts, indexes }) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, opts);
          indexes.forEach(([idxName, keyPath]) => store.createIndex(idxName, keyPath));
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function dbAdd(store, data) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readwrite").objectStore(store).add(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function dbUpdate(store, item) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(item);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function dbDel(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

export async function dbClearAll() {
  const db = await openDB();
  const stores = ["symptom_logs", "psa_logs", "prescriptions", "home_meds", "kegel_logs", "bone_logs", "bp_logs", "reminders", "questionnaire_results", "adverse_events", "inr_logs"];
  const tx = db.transaction(stores, "readwrite");
  const promises = stores.map(storeName => new Promise((resolve, reject) => {
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
  await Promise.all(promises);
}

export async function canShowQuestionnaire(type) {
  const results = await dbAll("questionnaire_results");
  const last = results
    .filter(r => r.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return true;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(last.date) < threeMonthsAgo;
}

export const today = () => new Date().toISOString().split("T")[0];

export const fmtDate = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

export function calcPSADT(records) {
  const sorted = [...records].filter(r => r.psa > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const first = sorted[0], last = sorted[sorted.length - 1];
  const t = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24 * 30.44);
  const dt = (t * Math.log(2)) / Math.log(last.psa / first.psa);
  return isFinite(dt) && dt > 0 ? dt.toFixed(1) : null;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export function scheduleNotification(title, body, delayMs) {
  if (Notification.permission !== "granted") return;
  setTimeout(() => new Notification(title, { body }), delayMs);
}
