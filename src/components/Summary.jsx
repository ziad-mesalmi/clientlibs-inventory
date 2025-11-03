import React from "react";

export default function Summary({ data }) {
  const { summary } = data;

  return (
    <div className="summary">
      <div className="stat-card">
        <div className="stat-value">{summary.totalClientlibs}</div>
        <div className="stat-label">Clientlibs</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{summary.totalCategories}</div>
        <div className="stat-label">Categories</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{summary.totalRelations}</div>
        <div className="stat-label">Relations</div>
      </div>
      <div className="stat-card critical">
        <div className="stat-value">{summary.alertsCount}</div>
        <div className="stat-label">Alerts</div>
      </div>
    </div>
  );
}
