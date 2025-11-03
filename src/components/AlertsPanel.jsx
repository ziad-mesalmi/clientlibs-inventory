import React from "react";

const LEVEL_ICONS = {
  CRITICAL: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  INFO: "🔵",
};

const LEVEL_COLORS = {
  CRITICAL: "#ff4444",
  HIGH: "#ff9944",
  MEDIUM: "#ffdd44",
  INFO: "#4499ff",
};

export default function AlertsPanel({ alerts = [] }) {
  if (!alerts.length) {
    return (
      <div className="no-alerts">✅ No alerts - Everything looks good!</div>
    );
  }

  return (
    <div className="alerts-panel">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className="alert-card"
          style={{ borderLeftColor: LEVEL_COLORS[alert.level] }}
        >
          <div className="alert-header">
            <span className="alert-icon">{LEVEL_ICONS[alert.level]}</span>
            <h3>{alert.title}</h3>
            <span
              className="alert-level"
              style={{ backgroundColor: LEVEL_COLORS[alert.level] }}
            >
              {alert.level}
            </span>
          </div>
          <p className="alert-description">{alert.description}</p>
          <div className="alert-impact">
            <strong>Impact:</strong> {alert.impact}
          </div>
          <div className="alert-action">
            <strong>Action:</strong> {alert.action}
          </div>
          {alert.data && (
            <details className="alert-details">
              <summary>View Details</summary>
              <pre>{JSON.stringify(alert.data, null, 2)}</pre>
            </details>
          )}
          {alert.conflicts && (
            <div className="alert-conflicts">
              <strong>Conflicts ({alert.conflicts.length}):</strong>
              <ul>
                {alert.conflicts.map((conflict, i) => (
                  <li key={i}>
                    <code>{conflict.clientlib}</code> →{" "}
                    <code>{conflict.dependency}</code>
                    <span
                      className={`risk ${
                        conflict.risk.includes("LOW") ? "low" : "high"
                      }`}
                    >
                      {conflict.risk}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
