import React, { useState, useMemo, useRef, useCallback } from "react";

export default function ClientlibsTable({ clientlibs = [] }) {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("relations"); // "relations", "size"
  const [sortOrder, setSortOrder] = useState("desc");
  const [highlightedRow, setHighlightedRow] = useState(null);
  const tableRef = useRef(null);
  const rowRefs = useRef({});

  const filtered = useMemo(() => {
    let result = clientlibs.filter(
      (lib) =>
        lib.name.toLowerCase().includes(filter.toLowerCase()) ||
        lib.path.toLowerCase().includes(filter.toLowerCase()) ||
        lib.categories.some((cat) =>
          cat.toLowerCase().includes(filter.toLowerCase())
        )
    );

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "size") {
        comparison = a.totalKB - b.totalKB;
      } else if (sortBy === "relations") {
        const aRelations = a.dependencies.length + a.embed.length;
        const bRelations = b.dependencies.length + b.embed.length;
        comparison = aRelations - bRelations;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [clientlibs, filter, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleBadgeClick = (category) => {
    console.log("🔍 Searching for category:", category);

    // Find the clientlib that has this category (search in all clientlibs)
    const targetLib = clientlibs.find((lib) =>
      lib.categories.includes(category)
    );

    if (!targetLib) {
      console.warn("❌ Category not found:", category);
      return;
    }

    console.log("✅ Found clientlib:", targetLib.path, targetLib.name);

    const rowKey = `${targetLib.path}-${targetLib.name}`;

    // Check if target is already visible in filtered list
    const isVisible = filtered.some(
      (lib) => `${lib.path}-${lib.name}` === rowKey
    );

    if (!isVisible) {
      console.log("📋 Clearing filter to show target row");
      // Clear the filter to show the target row
      setFilter("");
    }

    // Wait for DOM to update
    setTimeout(
      () => {
        const rowElement = rowRefs.current[rowKey];

        if (rowElement) {
          console.log("📍 Scrolling to row");
          // Scroll to the row
          rowElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Highlight the row temporarily
          setHighlightedRow(rowKey);

          // Remove highlight after 2 seconds
          setTimeout(() => {
            setHighlightedRow(null);
          }, 2000);
        } else {
          console.error("❌ Row element not found in refs:", rowKey);
          console.log("Available refs:", Object.keys(rowRefs.current));
        }
      },
      isVisible ? 50 : 300
    ); // Longer delay if we cleared the filter
  };

  return (
    <div className="table-container" ref={tableRef}>
      <div className="table-controls">
        <input
          type="text"
          placeholder="🔍 Filter clientlibs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input"
        />
        <span className="count">
          {filtered.length} / {clientlibs.length} clientlibs
        </span>
      </div>

      <table className="clientlibs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Categories</th>
            <th>Dependencies</th>
            <th>Embed</th>
            <th>jQuery</th>
            <th className="sortable" onClick={() => handleSort("size")}>
              Size (KB) {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((lib, index) => {
            const rowKey = `${lib.path}-${lib.name}`;
            const rowId = `row-${btoa(rowKey).replace(/[^a-zA-Z0-9]/g, "")}`;
            const isHighlighted = highlightedRow === rowKey;

            // Extract library info
            const jqueryInfo = lib.jqueryInfo || {};
            const libraries = jqueryInfo.libraries || {};
            const hasLibraries = Object.keys(libraries).length > 0;

            // Build tooltip for libraries
            const librariesTooltip = hasLibraries
              ? `Third-party libraries detected:\n${Object.entries(libraries)
                  .map(([name, version]) => `• ${name} v${version}`)
                  .join("\n")}`
              : lib.name;

            return (
              <tr
                key={index}
                id={rowId}
                ref={(el) => {
                  if (el) rowRefs.current[rowKey] = el;
                }}
                className={isHighlighted ? "highlighted-row" : ""}
              >
                <td>
                  <div
                    className="clientlib-name-wrapper"
                    title={librariesTooltip}
                  >
                    {hasLibraries && (
                      <span
                        className="library-indicator"
                        title={librariesTooltip}
                      >
                        📚
                      </span>
                    )}
                    <code className="path">{lib.name}</code>
                  </div>
                  <div className="path-small">{lib.path}</div>
                </td>
                <td>
                  {lib.categories.map((cat, i) => (
                    <span key={i} className="badge badge-cat">
                      {cat}
                    </span>
                  ))}
                </td>
                <td>
                  {lib.dependencies.map((dep, i) => (
                    <span
                      key={i}
                      className="badge badge-dep clickable"
                      onClick={() => handleBadgeClick(dep)}
                      title={`Depends on: ${dep} - Cliquez pour naviguer`}
                    >
                      ➜ {dep}
                    </span>
                  ))}
                </td>
                <td>
                  {lib.embed.map((emb, i) => (
                    <span
                      key={i}
                      className="badge badge-embed clickable"
                      onClick={() => handleBadgeClick(emb)}
                      title={`Embed: ${emb} - Cliquez pour naviguer`}
                    >
                      ⚡ {emb}
                    </span>
                  ))}
                </td>
                <td className="jquery-column">
                  {lib.usesJQuery ? (
                    <div className="jquery-info">
                      <span className="jquery-indicator" title="Uses jQuery">
                        ✅
                      </span>
                      {lib.jqueryVersion && (
                        <span
                          className="jquery-version"
                          title={`jQuery version: ${lib.jqueryVersion}`}
                        >
                          v{lib.jqueryVersion}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className="jquery-indicator-no"
                      title="Does not use jQuery"
                    >
                      ❌
                    </span>
                  )}
                </td>
                <td className="numeric">{lib.totalKB}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
