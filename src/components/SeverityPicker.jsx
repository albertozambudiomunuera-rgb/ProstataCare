import React from 'react';

export default function SeverityPicker({ value, onChange }) {
  const opts = [
    { v: 0, label: "—",    bg: "var(--border)",                  fg: "var(--muted)" },
    { v: 1, label: "Leve", bg: "rgba(46, 156, 106, 0.15)",       fg: "var(--green)" },
    { v: 2, label: "Mod.", bg: "rgba(224, 123, 42, 0.15)",       fg: "var(--amber)" },
    { v: 3, label: "Sev.", bg: "rgba(192, 57, 75, 0.15)",        fg: "var(--rose)"  },
  ];

  return (
    <div style={{ display: "flex", gap: "0.4rem", width: "100%" }}>
      {opts.map(o => (
        <button
          key={o.v}
          type="button"
          className="sev-btn"
          style={{
            background: value === o.v ? o.bg : "var(--bg)",
            color: value === o.v ? o.fg : "var(--muted)",
            borderColor: value === o.v ? o.fg : "transparent",
            transform: value === o.v ? "scale(1.03)" : "none",
            boxShadow: value === o.v ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
          }}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
