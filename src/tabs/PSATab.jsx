import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { dbAdd, dbDel, today, fmtDate, calcPSADT } from '../services/secureStorage';

export default function PSATab({ psaLogs, theme, refresh }) {
  const [date, setDate] = useState(today());
  const [psa, setPsa] = useState("");
  const [saved, setSaved] = useState(false);
  const sorted = [...psaLogs].sort((a, b) => a.date.localeCompare(b.date));
  const psadt = calcPSADT(psaLogs);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || sorted.length < 2) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 180 * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width, H = 180;
    const pad = { top: 25, right: 25, bottom: 40, left: 45 };
    ctx.clearRect(0, 0, W, H);
    const vals = sorted.map(r => r.psa);
    const minV = Math.max(0, Math.min(...vals) * 0.8);
    const maxV = Math.max(...vals) * 1.2;
    const pts = sorted.map((r, i) => ({
      x: pad.left + (i / (sorted.length - 1)) * (W - pad.left - pad.right),
      y: H - pad.bottom - ((r.psa - minV) / (maxV - minV)) * (H - pad.top - pad.bottom),
    }));
    const isDark = theme === 'dark';
    ctx.strokeStyle = isDark ? "#1e293b" : "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = pad.top + i * (H - pad.top - pad.bottom) / 3;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = maxV - i * (maxV - minV) / 3;
      ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
      ctx.font = "500 9px 'DM Sans'"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(val.toFixed(2), pad.left - 8, y);
    }
    const grad = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0);
    grad.addColorStop(0, isDark ? "#3b82f6" : "#1a5c8a");
    grad.addColorStop(1, isDark ? "#14b8a6" : "#0d8a7a");
    ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    areaGrad.addColorStop(0, isDark ? "rgba(59, 130, 246, 0.22)" : "rgba(26, 92, 138, 0.18)");
    areaGrad.addColorStop(1, isDark ? "rgba(59, 130, 246, 0)" : "rgba(26, 92, 138, 0)");
    ctx.fillStyle = areaGrad; ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom); ctx.lineTo(pts[0].x, H - pad.bottom); ctx.closePath(); ctx.fill();
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#131b2e" : "#ffffff"; ctx.fill();
      ctx.strokeStyle = isDark ? "#3b82f6" : "#1a5c8a"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = isDark ? "#f1f5f9" : "#1e2d3d";
      ctx.font = "bold 9px 'DM Sans'"; ctx.textAlign = "center";
      ctx.fillText(sorted[i].psa.toFixed(2), p.x, p.y - 10);
    });
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.font = "600 9px 'DM Sans'"; ctx.textAlign = "center";
    sorted.forEach((r, i) => {
      const p = pts[i], d = new Date(r.date + "T12:00:00");
      ctx.fillText(`${d.getDate()}/${d.getMonth() + 1}`, p.x, H - pad.bottom + 16);
    });
  }, [sorted, theme]);

  const handleSave = async () => {
    if (!psa || isNaN(parseFloat(psa))) return;
    await dbAdd("psa_logs", { date, psa: parseFloat(psa), createdAt: new Date().toISOString() });
    refresh(); setSaved(true); setTimeout(() => setSaved(false), 2000); setPsa("");
  };

  return (
    <div style={{ padding: "1.25rem 1rem", paddingBottom: "6rem" }}>
      <div className="fade-up"><SectionTitle>Seguimiento PSA</SectionTitle></div>

      {psadt && (
        <Card className="fade-up fade-up-d1" style={{ padding: "1.2rem", marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0.04) 100%)", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: ".1em" }}>Tiempo de duplicación estimado</p>
          <p className="serif" style={{ fontSize: "2.2rem", color: "var(--navy)", margin: ".3rem 0 .2rem", lineHeight: 1 }}>
            {psadt} <span style={{ fontSize: "1.1rem", fontFamily: "inherit", color: "var(--muted)", fontWeight: 500 }}>meses</span>
          </p>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>Calculado automáticamente basado en tus {psaLogs.length} mediciones.</p>
        </Card>
      )}

      {sorted.length >= 2 ? (
        <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d2">
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1rem" }}>Evolución histórica</p>
          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "180px", display: "block" }} />
          </div>
        </Card>
      ) : sorted.length === 1 ? (
        <Card style={{ padding: "1.5rem 1.2rem", marginBottom: "1.25rem", textAlign: "center" }} className="fade-up fade-up-d2">
          <span style={{ fontSize: "1.5rem" }}>📈</span>
          <p style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: ".5rem" }}>Registra una medición más para ver el gráfico evolutivo.</p>
        </Card>
      ) : null}

      <Card style={{ padding: "1.2rem", marginBottom: "1.25rem" }} className="fade-up fade-up-d3">
        <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1rem" }}>Registrar medición</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: ".3rem", fontWeight: 600 }}>Fecha</p>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <p style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: ".3rem", fontWeight: 600 }}>PSA (ng/mL)</p>
            <input type="number" step="0.01" className="input" placeholder="Ej: 4.50" value={psa} onChange={e => setPsa(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" onClick={handleSave} style={{ background: saved ? "var(--green)" : "var(--blue)", padding: "0.85rem" }}>
          {saved ? "Guardado correctamente" : "Añadir a historial"}
        </button>
      </Card>

      {sorted.length > 0 && (
        <Card style={{ padding: "1.2rem" }} className="fade-up fade-up-d4">
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "0.85rem" }}>Historial de mediciones</p>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {[...sorted].reverse().map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".65rem .9rem", background: "var(--bg)", borderRadius: "var(--radius-sm)", transition: "background var(--transition-normal)" }}>
                <span style={{ fontSize: ".85rem", color: "var(--muted)", fontWeight: 500 }}>{fmtDate(r.date)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: ".95rem" }}>{r.psa} ng/mL</span>
                  <button onClick={async () => { if (confirm("¿Eliminar este registro de PSA?")) { await dbDel("psa_logs", r.id); refresh(); } }} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: "0.85rem", opacity: 0.6 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
