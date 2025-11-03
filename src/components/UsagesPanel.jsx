import React, { useState, useMemo } from "react";

export default function UsagesPanel({ usages = {} }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort categories by usage count (descending) and filter by search
  const sortedCategories = useMemo(() => {
    return Object.keys(usages)
      .filter((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => usages[b].length - usages[a].length);
  }, [usages, searchTerm]);

  // Get usage stats
  const totalUsages = useMemo(() => {
    return Object.values(usages).reduce((sum, arr) => sum + arr.length, 0);
  }, [usages]);

  const unusedCount = useMemo(() => {
    return Object.values(usages).filter((arr) => arr.length === 0).length;
  }, [usages]);

  return (
    <div className="usages-panel">
      <div className="usages-sidebar">
        <div className="usages-header">
          <h3>Categories ({sortedCategories.length})</h3>
          <div className="usages-stats">
            <div className="stat-badge">
              <span className="stat-icon">📍</span>
              <span>{totalUsages} usages</span>
            </div>
            {unusedCount > 0 && (
              <div className="stat-badge warning">
                <span className="stat-icon">⚠️</span>
                <span>{unusedCount} unused</span>
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input search-input"
        />

        <div className="categories-list">
          {sortedCategories.map((cat) => {
            const count = usages[cat].length;
            const isUnused = count === 0;

            return (
              <button
                key={cat}
                className={`usage-cat-btn ${
                  selectedCategory === cat ? "active" : ""
                } ${isUnused ? "unused" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="cat-name">{cat}</span>
                <span className={`badge ${isUnused ? "badge-warning" : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {sortedCategories.length === 0 && (
            <div className="no-results">
              No categories found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      <div className="usages-content">
        {selectedCategory ? (
          <>
            <h3>Usages of "{selectedCategory}"</h3>
            {usages[selectedCategory].length === 0 ? (
              <p className="no-data">⚠️ No usages found (possibly unused)</p>
            ) : (
              <ul className="usages-list">
                {usages[selectedCategory].map((usage, index) => (
                  <li key={index} className="usage-item">
                    <span
                      className={`usage-type type-${usage.type.toLowerCase()}`}
                    >
                      {usage.type}
                    </span>
                    <code>{usage.path}</code>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="no-selection">
            ← Select a category to view its usages
          </div>
        )}
      </div>
    </div>
  );
}
