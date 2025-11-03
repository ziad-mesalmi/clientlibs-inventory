import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

export default function DependencyGraph({
  relations = [],
  usages = {},
  clientlibs = [],
  initialSelectedCategory = null,
  onCategoryChange,
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    initialSelectedCategory || "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const layoutMode = "from-usage"; // Always use from-usage mode

  // Initialize with all used categories when no filter selected
  const [showAllUsed, setShowAllUsed] = useState(true);

  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
      setSearchTerm(initialSelectedCategory);
      setShowAllUsed(false);
    }
  }, [initialSelectedCategory]);

  // Get categories that are actually used
  const usedCategories = useMemo(() => {
    return Object.entries(usages)
      .filter(([cat, usageList]) => usageList.length > 0)
      .map(([cat]) => cat);
  }, [usages]);

  // Get all categories from clientlibs
  const allCategories = useMemo(() => {
    const uniqueCats = [
      ...new Set(clientlibs.flatMap((lib) => lib.categories)),
    ];
    return uniqueCats.sort();
  }, [clientlibs]);

  // Filter categories for autocomplete with priority for used ones
  const filteredCategories = useMemo(() => {
    let cats = allCategories;

    if (searchTerm) {
      cats = allCategories.filter((cat) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort: used categories first, then by path priority (/apps > /etc > /libs), then alphabetically
    return cats.sort((a, b) => {
      const aUsed = usedCategories.includes(a);
      const bUsed = usedCategories.includes(b);

      // Priority 1: Used categories first
      if (aUsed && !bUsed) return -1;
      if (!aUsed && bUsed) return 1;

      // Priority 2: Path priority (/apps > /etc > /libs)
      const aLib = clientlibs.find((lib) => lib.categories.includes(a));
      const bLib = clientlibs.find((lib) => lib.categories.includes(b));

      if (aLib && bLib) {
        const aPath = aLib.path || "";
        const bPath = bLib.path || "";

        const getPathPriority = (path) => {
          if (path.startsWith("/apps")) return 0;
          if (path.startsWith("/etc")) return 1;
          if (path.startsWith("/libs")) return 2;
          return 3;
        };

        const aPriority = getPathPriority(aPath);
        const bPriority = getPathPriority(bPath);

        if (aPriority !== bPriority) return aPriority - bPriority;
      }

      // Priority 3: Alphabetically
      return a.localeCompare(b);
    });
  }, [allCategories, searchTerm, usedCategories, clientlibs]);

  const initialData = useMemo(() => {
    // Filter relations by selected category and expanded nodes
    let filteredRelations = relations;

    if (expandedCategories.size > 0 && !showAllUsed) {
      // PRIORITY 1: Show all relations where at least one node is in expandedCategories
      // This allows cumulative/recursive exploration
      const expandedArray = Array.from(expandedCategories);
      console.log(
        "📊 Showing relations for expanded categories:",
        expandedArray.length
      );

      filteredRelations = relations.filter((rel) => {
        return (
          expandedArray.includes(rel.from) || expandedArray.includes(rel.to)
        );
      });

      console.log("  ✅ Relations found:", filteredRelations.length);
    } else if (showAllUsed) {
      // PRIORITY 2: By default, show all used categories (from JSP/HTL/Dialog)
      console.log("🏠 Showing all used categories");
      filteredRelations = relations.filter((rel) => {
        return (
          usedCategories.includes(rel.from) || usedCategories.includes(rel.to)
        );
      });
    }

    const nodeMap = new Map();
    const edgesList = [];
    const nodeConnections = new Map(); // Track connections per node

    // First pass: create nodes and count connections
    filteredRelations.forEach((rel) => {
      // Determine if node is used (referenced in JSP/HTL/Dialog)
      const isFromUsed = usedCategories.includes(rel.from);
      const isToUsed = usedCategories.includes(rel.to);

      if (!nodeMap.has(rel.from)) {
        nodeMap.set(rel.from, {
          id: rel.from,
          data: { label: rel.from },
          position: { x: 0, y: 0 },
          style: {
            background: isFromUsed ? "#2a5047" : "#2a3042",
            color: "#e6e8ee",
            border: `2px solid ${isFromUsed ? "#51cf66" : "#4dabf7"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            fontWeight: "500",
            minWidth: "120px",
            maxWidth: "200px",
            wordBreak: "break-word",
            whiteSpace: "normal",
            textAlign: "center",
          },
        });
        nodeConnections.set(rel.from, { in: 0, out: 0, isUsed: isFromUsed });
      }
      if (!nodeMap.has(rel.to)) {
        nodeMap.set(rel.to, {
          id: rel.to,
          data: { label: rel.to },
          position: { x: 0, y: 0 },
          style: {
            background: isToUsed ? "#2a5047" : "#2a3042",
            color: "#e6e8ee",
            border: `2px solid ${isToUsed ? "#51cf66" : "#4dabf7"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            fontWeight: "500",
            minWidth: "120px",
            maxWidth: "200px",
            wordBreak: "break-word",
            whiteSpace: "normal",
            textAlign: "center",
          },
        });
        nodeConnections.set(rel.to, { in: 0, out: 0, isUsed: isToUsed });
      }

      nodeConnections.get(rel.from).out++;
      nodeConnections.get(rel.to).in++;
    });

    // Second pass: create edges with better styling
    filteredRelations.forEach((rel, index) => {
      // More explicit labels
      const edgeLabel = rel.type === "embeds" ? "embed" : "depends on";

      edgesList.push({
        id: `e${index}`,
        source: rel.from,
        target: rel.to,
        label: edgeLabel,
        type: "smoothstep",
        animated: rel.type === "embeds",
        style: {
          stroke: rel.type === "embeds" ? "#ff6b6b" : "#4dabf7",
          strokeWidth: 2,
        },
        labelStyle: {
          fill: "#e6e8ee",
          fontSize: "10px",
          fontWeight: "600",
        },
        labelBgStyle: {
          fill: "#1a1f2e",
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: rel.type === "embeds" ? "#ff6b6b" : "#4dabf7",
        },
      });
    });

    // Convert nodeMap to array and sort for consistent layout
    const nodesArray = Array.from(nodeMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // Layout algorithm (simple layered approach)
    const layers = new Map();
    const positioned = new Set();

    let roots = [];

    if (layoutMode === "from-usage") {
      // Start from used categories (called in JSP/HTL/Dialog)
      roots = nodesArray
        .filter((node) => nodeConnections.get(node.id).isUsed)
        .sort(
          (a, b) => nodeConnections.get(b.id).in - nodeConnections.get(a.id).in
        );

      // If no used categories in filtered view, fallback to nodes with most incoming
      if (roots.length === 0 && nodesArray.length > 0) {
        roots = nodesArray
          .sort(
            (a, b) =>
              nodeConnections.get(b.id).in - nodeConnections.get(a.id).in
          )
          .slice(0, Math.min(5, nodesArray.length));
      }
    } else {
      // Hierarchical: start from nodes with no incoming (classic)
      roots = nodesArray
        .filter((node) => nodeConnections.get(node.id).in === 0)
        .sort(
          (a, b) =>
            nodeConnections.get(b.id).out - nodeConnections.get(a.id).out
        );

      if (roots.length === 0 && nodesArray.length > 0) {
        roots.push(
          ...nodesArray
            .sort(
              (a, b) =>
                nodeConnections.get(b.id).out - nodeConnections.get(a.id).out
            )
            .slice(0, Math.min(3, nodesArray.length))
        );
      }
    }

    // Layered positioning
    let currentLayer = 0;
    let queue = [...roots];
    layers.set(currentLayer, queue);

    while (queue.length > 0 && currentLayer < 10) {
      const nextQueue = [];
      queue.forEach((node) => {
        positioned.add(node.id);
        // Find children
        edgesList
          .filter((e) => e.source === node.id && !positioned.has(e.target))
          .forEach((e) => {
            const childNode = nodeMap.get(e.target);
            if (childNode && !nextQueue.includes(childNode)) {
              nextQueue.push(childNode);
            }
          });
      });

      if (nextQueue.length > 0) {
        currentLayer++;
        layers.set(currentLayer, nextQueue);
        queue = nextQueue;
      } else {
        break;
      }
    }

    // Position remaining nodes
    const unpositioned = nodesArray.filter((n) => !positioned.has(n.id));
    if (unpositioned.length > 0) {
      currentLayer++;
      layers.set(currentLayer, unpositioned);
      unpositioned.forEach((n) => positioned.add(n.id));
    }

    // Apply positions
    const horizontalSpacing = 250;
    const verticalSpacing = 150;
    const startX = 100;
    const startY = 100;

    layers.forEach((layerNodes, layer) => {
      const layerWidth = (layerNodes.length - 1) * horizontalSpacing;
      const offsetX = startX - layerWidth / 2;

      layerNodes.forEach((node, index) => {
        node.position = {
          x: offsetX + index * horizontalSpacing + layer * 50, // Slight offset per layer
          y: startY + layer * verticalSpacing,
        };
      });
    });

    return {
      nodes: nodesArray,
      edges: edgesList,
      connections: nodeConnections,
    };
  }, [
    relations,
    selectedCategory,
    usedCategories,
    layoutMode,
    expandedCategories,
    showAllUsed,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Update nodes and edges when initialData changes (filter/layout change)
  useEffect(() => {
    setNodes(initialData.nodes);
    setEdges(initialData.edges);
  }, [initialData, setNodes, setEdges]);

  const nodeConnections = initialData.connections || new Map();

  // Handle double-click on node to ADD its direct relations to the graph
  // This is CUMULATIVE/ADDITIVE - allows recursive exploration
  const onNodeDoubleClick = (event, node) => {
    const categoryId = node.id;
    console.log("🖱️ Double-click on:", categoryId);
    console.log("  ➕ Adding direct relations to graph (cumulative mode)");

    setExpandedCategories((prev) => {
      const newSet = new Set(prev);

      // Add the clicked category if not already there
      newSet.add(categoryId);

      // Find ONLY direct relations (1 hop)
      const directRelations = relations.filter(
        (rel) => rel.from === categoryId || rel.to === categoryId
      );

      console.log(
        `  📍 Will display ${directRelations.length} direct relation(s) of ${categoryId}:`
      );
      directRelations.forEach((rel) => {
        if (rel.from === categoryId) {
          console.log(
            `    → ${rel.type === "depends" ? "depends on" : "embeds"}:`,
            rel.to
          );
          // NE PAS ajouter rel.to dans expandedCategories
          // Cela permettra d'afficher SEULEMENT les relations de niveau 1
        } else {
          console.log(
            `    ← ${rel.type === "depends" ? "depended by" : "embedded by"}:`,
            rel.from
          );
          // NE PAS ajouter rel.from dans expandedCategories
        }
      });

      console.log(
        `  ✅ Expanded categories: ${newSet.size} (was ${prev.size}) - showing only their direct relations`
      );
      return newSet;
    });

    // Update search term to show current focus
    setSearchTerm(categoryId);
  };

  // Handle right-click on node to copy category to clipboard
  const onNodeContextMenu = (event, node) => {
    event.preventDefault(); // Prevent default context menu
    const categoryId = node.id;

    console.log("📋 Right-click on:", categoryId, "- copying to clipboard");

    // Copy to clipboard
    navigator.clipboard
      .writeText(categoryId)
      .then(() => {
        console.log("✅ Copied to clipboard:", categoryId);
        // You could add a toast notification here if desired
      })
      .catch((err) => {
        console.error("❌ Failed to copy:", err);
      });
  };

  const handleCategorySelect = (cat) => {
    console.log("🔍 Category selected:", cat);

    if (cat === "all") {
      // Reset to show all used categories
      setSelectedCategory("all");
      setSearchTerm("");
      setShowAllUsed(true);
      setExpandedCategories(new Set()); // Clear expanded categories
    } else {
      // Initialize with this category as starting point
      setSelectedCategory(cat);
      setSearchTerm(cat);
      setShowAllUsed(false);

      // Start with ONLY this category (level 0)
      // This will show only its direct relations without their interconnections
      const newExpanded = new Set();
      newExpanded.add(cat);

      const directRelations = relations.filter(
        (rel) => rel.from === cat || rel.to === cat
      );

      console.log(
        `  🎯 Starting with ${cat} - will show ${directRelations.length} direct relation(s) (level 1 only)`
      );
      console.log(
        `  📍 To explore deeper, double-click on a node to add its relations`
      );
      setExpandedCategories(newExpanded);
    }

    setShowSuggestions(false);
    if (onCategoryChange) onCategoryChange();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".autocomplete-wrapper")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="graph-container">
      <div className="graph-controls">
        <div className="graph-filters">
          <div className="filter-group autocomplete-group">
            <label>Filtrer par catégorie:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                  if (e.target.value === "") {
                    setSelectedCategory("all");
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Rechercher ou sélectionner..."
                className="autocomplete-input"
              />
              {selectedCategory !== "all" && (
                <button
                  onClick={() => handleCategorySelect("all")}
                  className="clear-btn"
                  title="Effacer"
                >
                  ✕
                </button>
              )}
              {showSuggestions && filteredCategories.length > 0 && (
                <div className="autocomplete-suggestions">
                  {/* Count used vs unused */}
                  {(() => {
                    const usedInList = filteredCategories.filter((cat) =>
                      usedCategories.includes(cat)
                    );
                    const unusedInList = filteredCategories.filter(
                      (cat) => !usedCategories.includes(cat)
                    );

                    return (
                      <>
                        {/* Used categories section */}
                        {usedInList.length > 0 && (
                          <>
                            <div className="suggestion-section-header">
                              ✓ Utilisées dans JSP/HTL/Dialog (
                              {usedInList.length})
                            </div>
                            {usedInList.slice(0, 10).map((cat) => (
                              <div
                                key={cat}
                                className="suggestion-item used"
                                onClick={() => handleCategorySelect(cat)}
                              >
                                <span className="used-badge">✓</span>
                                <span className="suggestion-name">{cat}</span>
                                <span className="usage-count">
                                  {usages[cat]?.length || 0} usage(s)
                                </span>
                              </div>
                            ))}
                            {usedInList.length > 10 && (
                              <div className="suggestion-more">
                                +{usedInList.length - 10} utilisées
                                supplémentaires...
                              </div>
                            )}
                          </>
                        )}

                        {/* Divider if both sections exist */}
                        {usedInList.length > 0 && unusedInList.length > 0 && (
                          <div className="suggestion-divider"></div>
                        )}

                        {/* Unused categories section */}
                        {unusedInList.length > 0 && (
                          <>
                            {usedInList.length > 0 && (
                              <div className="suggestion-section-header">
                                Autres catégories ({unusedInList.length})
                              </div>
                            )}
                            {unusedInList
                              .slice(0, Math.min(5, 10 - usedInList.length))
                              .map((cat) => (
                                <div
                                  key={cat}
                                  className="suggestion-item"
                                  onClick={() => handleCategorySelect(cat)}
                                >
                                  <span className="suggestion-name">{cat}</span>
                                </div>
                              ))}
                            {unusedInList.length >
                              Math.min(5, 10 - usedInList.length) && (
                              <div className="suggestion-more">
                                +
                                {unusedInList.length -
                                  Math.min(5, 10 - usedInList.length)}{" "}
                                autres...
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="graph-info">
          <div className="graph-stats">
            <span>📦 {nodes.length} Catégories</span>
            <span>🔗 {edges.length} Relations</span>
            <span>✅ {usedCategories.length} Utilisées</span>
            {expandedCategories.size > 0 && (
              <span>🔍 {expandedCategories.size} Étendues</span>
            )}
          </div>
          {selectedCategory === "all" && expandedCategories.size === 0 && (
            <div className="graph-hint">
              💡 Recherchez une clientlib pour commencer, puis double-cliquez
              pour explorer récursivement
              <br />
              🖱️ Clic droit sur un nœud pour copier sa catégorie
            </div>
          )}
          <div className="graph-actions">
            {selectedCategory !== "all" && (
              <button
                onClick={() => {
                  console.log("🔄 Réinitialisation du graphe");
                  setExpandedCategories(new Set());
                  setSelectedCategory("all");
                  setSearchTerm("");
                  setShowAllUsed(true);
                }}
                className="btn-secondary"
              >
                ↺ Afficher le graphe complet
              </button>
            )}
          </div>
          <div className="graph-legend">
            <span>
              <span className="legend-dot green"></span> Utilisée
              (JSP/HTL/Dialog)
            </span>
            <span>
              <span className="legend-dot yellow"></span> Étendue (double-clic)
            </span>
            <span>
              <span className="legend-line blue"></span> depends on
            </span>
            <span>
              <span className="legend-line red"></span> embed
            </span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#4dabf7" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const conn = nodeConnections.get(node.id);
            return conn?.isUsed ? "#51cf66" : "#4dabf7";
          }}
          maskColor="rgba(15, 20, 25, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
