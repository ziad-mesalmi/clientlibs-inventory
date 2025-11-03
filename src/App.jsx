import React, { useState, useEffect, useCallback } from "react";
import { fetchInventory } from "./services/api";
import Summary from "./components/Summary";
import AlertsPanel from "./components/AlertsPanel";
import ClientlibsTable from "./components/ClientlibsTable";
import DependencyGraph from "./components/DependencyGraph";
import UsagesPanel from "./components/UsagesPanel";
import RecommendationsPanel from "./components/RecommendationsPanel";
import ImpactAnalysis from "./components/ImpactAnalysis";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aemHost, setAemHost] = useState("");
  const [activeTab, setActiveTab] = useState("table");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [scanPaths, setScanPaths] = useState([
    "/apps/ca/npc",
    "/apps/settings/wcm/designs/ca",
  ]);
  const [showPathsConfig, setShowPathsConfig] = useState(false);
  const [newPath, setNewPath] = useState("");

  const handleAddPath = () => {
    if (newPath.trim() && !scanPaths.includes(newPath.trim())) {
      setScanPaths([...scanPaths, newPath.trim()]);
      setNewPath("");
    }
  };

  const handleRemovePath = (index) => {
    if (scanPaths.length > 1) {
      // Keep at least one path
      setScanPaths(scanPaths.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePath = (index, value) => {
    const updated = [...scanPaths];
    updated[index] = value;
    setScanPaths(updated);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const inventory = await fetchInventory(aemHost, scanPaths);
      setData(inventory);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [aemHost, scanPaths]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 AEM Clientlibs Inventory</h1>
        <div className="controls-wrapper">
          <div className="paths-config-header">
            <span className="paths-label">
              📂 Scan paths ({scanPaths.length})
            </span>
            <button
              onClick={() => setShowPathsConfig(!showPathsConfig)}
              className="btn-config"
              title="Configurer les chemins à scanner"
            >
              {showPathsConfig ? "▼" : "▶"} Configurer
            </button>
          </div>

          {showPathsConfig && (
            <div className="paths-config">
              <div className="paths-list">
                {scanPaths.map((path, index) => (
                  <div key={index} className="path-item">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => handleUpdatePath(index, e.target.value)}
                      className="input-path"
                      placeholder="/apps/ca/npc"
                    />
                    <button
                      onClick={() => handleRemovePath(index)}
                      className="btn-remove"
                      title="Supprimer ce chemin"
                      disabled={scanPaths.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="path-add">
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPath()}
                  className="input-path"
                  placeholder="Ajouter un nouveau chemin..."
                />
                <button
                  onClick={handleAddPath}
                  className="btn-add"
                  disabled={!newPath.trim()}
                >
                  ➕ Ajouter
                </button>
              </div>
              <div className="path-presets">
                <span className="presets-label">Préconfigurations:</span>
                <button
                  onClick={() =>
                    setScanPaths([
                      "/apps/ca/npc",
                      "/apps/settings/wcm/designs/ca",
                    ])
                  }
                  className="btn-preset"
                >
                  NPC
                </button>
                <button
                  onClick={() => setScanPaths(["/apps", "/etc", "/libs"])}
                  className="btn-preset"
                >
                  Tout
                </button>
              </div>
            </div>
          )}
          <div className="controls">
            <input
              type="text"
              value={aemHost}
              onChange={(e) => setAemHost(e.target.value)}
              placeholder="Laisser vide pour utiliser le proxy (ou entrer http://localhost:4502)"
              className="input"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "⏳ Loading..." : "🔄 Reload"}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">❌ Error: {error}</div>}

      {data && (
        <>
          <Summary data={data} />

          <div className="tabs">
            <button
              className={`tab ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              📋 Clientlibs Table
            </button>
            <button
              className={`tab ${activeTab === "usages" ? "active" : ""}`}
              onClick={() => setActiveTab("usages")}
            >
              📍 Usages
            </button>
            <button
              className={`tab ${activeTab === "graph" ? "active" : ""}`}
              onClick={() => setActiveTab("graph")}
            >
              🕸️ Dependency Graph
            </button>
            <button
              className={`tab ${activeTab === "impact" ? "active" : ""}`}
              onClick={() => setActiveTab("impact")}
            >
              📊 Impact Analysis
            </button>
            <button
              className={`tab ${activeTab === "alerts" ? "active" : ""}`}
              onClick={() => setActiveTab("alerts")}
            >
              🚨 Alerts & Recommendations ({data.alerts?.length || 0})
            </button>
          </div>

          <div className="content">
            {activeTab === "table" && (
              <ClientlibsTable clientlibs={data.clientlibs} />
            )}
            {activeTab === "usages" && <UsagesPanel usages={data.usages} />}
            {activeTab === "graph" && (
              <DependencyGraph
                relations={data.relations}
                usages={data.usages}
                clientlibs={data.clientlibs}
                initialSelectedCategory={selectedCategory}
                onCategoryChange={() => setSelectedCategory(null)}
              />
            )}
            {activeTab === "impact" && <ImpactAnalysis data={data} />}
            {activeTab === "alerts" && (
              <>
                <AlertsPanel alerts={data.alerts} />
                <div style={{ marginTop: "2rem" }}>
                  <RecommendationsPanel data={data} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
