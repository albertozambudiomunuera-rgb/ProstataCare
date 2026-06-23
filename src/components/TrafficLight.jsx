import React from 'react';

export default function TrafficLight({ sys, dia }) {
  if (!sys || !dia) return null;

  let type = "green";
  let label = "Normal";

  if (sys >= 160 || dia >= 100) {
    type = "red";
    label = "Contacta tu médico urgentemente";
  } else if (sys >= 140 || dia >= 90) {
    type = "amber";
    label = "Elevada — vigila y reposa";
  }

  const dot = type === "green" ? "🟢" : type === "amber" ? "🟡" : "🔴";

  return (
    <div className={`traffic-light ${type}`}>
      <span style={{ fontSize: "1.1rem", display: "inline-flex" }}>{dot}</span>
      <span>{label}</span>
    </div>
  );
}
