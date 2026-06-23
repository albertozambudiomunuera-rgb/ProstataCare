import React from 'react';

export default function SectionTitle({ children }) {
  return (
    <h2 className="serif" style={{ fontSize: "1.45rem", fontWeight: 400, color: "var(--navy)", marginBottom: "0.85rem", transition: "color var(--transition-normal)" }}>
      {children}
    </h2>
  );
}
