import React, { useState, useMemo, useRef, useEffect } from "react";

export default function ImpactAnalysis({ data }) {
  const [selectedClientlib, setSelectedClientlib] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const clientlibs = data.clientlibs || [];
  const relations = data.relations || [];

  // Debug: Log data
  console.log("🔍 Impact Analysis - Clientlibs count:", clientlibs.length);
  console.log("🔍 Impact Analysis - Relations count:", relations.length);
  console.log("🔍 Impact Analysis - Sample relations:", relations.slice(0, 5));

  // Build reverse dependency map by CATEGORIES (who depends on whom)
  const reverseDependencyMap = useMemo(() => {
    const map = new Map();

    relations.forEach((rel) => {
      const { from, to, type } = rel;
      // 'to' is the category that is being depended on
      // 'from' is the category that depends on 'to'
      if (!map.has(to)) {
        map.set(to, []);
      }
      map.get(to).push({ category: from, type });
    });

    console.log("🗺️ Reverse dependency map (by category):", map);
    return map;
  }, [relations]);

  // Build forward dependency map by CATEGORIES (what this clientlib depends on)
  const forwardDependencyMap = useMemo(() => {
    const map = new Map();

    relations.forEach((rel) => {
      const { from, to, type } = rel;
      if (!map.has(from)) {
        map.set(from, []);
      }
      map.get(from).push({ category: to, type });
    });

    return map;
  }, [relations]);

  // Build category-to-clientlib map
  const categoryToClientlibMap = useMemo(() => {
    const map = new Map();
    clientlibs.forEach((lib) => {
      if (lib.categories) {
        lib.categories.forEach((cat) => {
          if (!map.has(cat)) {
            map.set(cat, []);
          }
          map.get(cat).push(lib);
        });
      }
    });
    console.log("📚 Category to clientlib map:", map);
    return map;
  }, [clientlibs]);

  // Calculate impact for a given clientlib (works with categories)
  const calculateImpact = (selectedClientlib) => {
    if (!selectedClientlib || !selectedClientlib.categories) {
      return { direct: [], indirect: [], all: [] };
    }

    const visited = new Set();
    const directMap = new Map(); // category -> { category, type, clientlibs }
    const indirectMap = new Map();

    // For each category of the selected clientlib
    selectedClientlib.categories.forEach((category) => {
      console.log("🔍 Looking for dependents of category:", category);

      // Find direct dependents (who directly depends on this category)
      const directDeps = reverseDependencyMap.get(category) || [];
      console.log(`  ↪ Found ${directDeps.length} direct dependents`);

      directDeps.forEach((dep) => {
        if (!directMap.has(dep.category)) {
          // Find clientlibs for this category
          const clientlibsForCat =
            categoryToClientlibMap.get(dep.category) || [];
          directMap.set(dep.category, {
            category: dep.category,
            type: dep.type,
            clientlibs: clientlibsForCat,
          });
          visited.add(dep.category);
        }
      });

      // Find indirect dependents (cascade effect)
      const queue = [...directDeps.map((d) => d.category)];
      while (queue.length > 0) {
        const currentCategory = queue.shift();
        const deps = reverseDependencyMap.get(currentCategory) || [];

        deps.forEach((dep) => {
          if (!visited.has(dep.category)) {
            const clientlibsForCat =
              categoryToClientlibMap.get(dep.category) || [];
            indirectMap.set(dep.category, {
              category: dep.category,
              type: dep.type,
              clientlibs: clientlibsForCat,
            });
            visited.add(dep.category);
            queue.push(dep.category);
          }
        });
      }
    });

    const direct = Array.from(directMap.values());
    const indirect = Array.from(indirectMap.values());

    console.log("📊 Impact calculated:", {
      direct: direct.length,
      indirect: indirect.length,
      total: direct.length + indirect.length,
    });

    return {
      direct,
      indirect,
      all: [...direct, ...indirect],
    };
  };

  // Get filtered clientlibs for autocomplete
  const filteredClientlibs = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return clientlibs
      .filter(
        (lib) =>
          lib.path.toLowerCase().includes(term) ||
          (lib.categories &&
            lib.categories.some((cat) => cat.toLowerCase().includes(term)))
      )
      .slice(0, 20); // Limit to 20 results
  }, [clientlibs, searchTerm]);

  // Calculate impact for selected clientlib
  const impactResult = useMemo(() => {
    if (!selectedClientlib) return null;
    console.log("🎯 Calculating impact for:", selectedClientlib.path);
    console.log("🎯 Categories:", selectedClientlib.categories);
    const result = calculateImpact(selectedClientlib);
    return result;
  }, [selectedClientlib, reverseDependencyMap, categoryToClientlibMap]);

  // Calculate dependencies of selected clientlib (what it depends on)
  const dependenciesResult = useMemo(() => {
    if (!selectedClientlib || !selectedClientlib.categories) return [];

    const depsMap = new Map();
    selectedClientlib.categories.forEach((category) => {
      const deps = forwardDependencyMap.get(category) || [];
      deps.forEach((dep) => {
        if (!depsMap.has(dep.category)) {
          const clientlibsForCat =
            categoryToClientlibMap.get(dep.category) || [];
          depsMap.set(dep.category, {
            category: dep.category,
            type: dep.type,
            clientlibs: clientlibsForCat,
          });
        }
      });
    });

    return Array.from(depsMap.values());
  }, [selectedClientlib, forwardDependencyMap, categoryToClientlibMap]);

  // Handle clientlib selection
  const handleSelectClientlib = (lib) => {
    setSelectedClientlib(lib);
    setSearchTerm(lib.path);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="impact-analysis">
      <div className="impact-header">
        <h2>🎯 Clientlib Impact Analysis</h2>
        <p className="impact-description">
          Sélectionnez une clientlib pour voir l'impact de sa modification sur
          toutes les autres clientlibs
        </p>
      </div>

      {/* Search and Select Clientlib */}
      <div className="clientlib-selector" ref={inputRef}>
        <label>
          <strong>Rechercher une Clientlib :</strong>
        </label>
        <div className="autocomplete-wrapper">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value) {
                setSelectedClientlib(null);
              }
            }}
            onFocus={() => searchTerm && setShowSuggestions(true)}
            placeholder="Tapez un path ou une catégorie..."
            className="clientlib-search-input"
          />
          {showSuggestions && filteredClientlibs.length > 0 && (
            <div className="autocomplete-suggestions">
              {filteredClientlibs.map((lib, idx) => (
                <div
                  key={idx}
                  className="autocomplete-item"
                  onClick={() => handleSelectClientlib(lib)}
                >
                  <div className="autocomplete-path">{lib.path}</div>
                  {lib.categories && lib.categories.length > 0 && (
                    <div className="autocomplete-categories">
                      {lib.categories.map((cat, i) => (
                        <span key={i} className="autocomplete-badge">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display Results */}
      {selectedClientlib && (
        <div className="impact-results">
          {/* Selected Clientlib Info */}
          <div className="selected-clientlib-info">
            <h3>📦 Clientlib Sélectionnée</h3>
            <div className="clientlib-details-card">
              <div className="detail-row">
                <strong>Path:</strong>
                <span>{selectedClientlib.path}</span>
              </div>
              {selectedClientlib.categories &&
                selectedClientlib.categories.length > 0 && (
                  <div className="detail-row">
                    <strong>Categories:</strong>
                    <div className="categories-list">
                      {selectedClientlib.categories.map((cat, i) => (
                        <span key={i} className="category-badge">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {selectedClientlib.size && (
                <div className="detail-row">
                  <strong>Size:</strong>
                  <span>{(selectedClientlib.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </div>
          </div>

          {/* Dependencies (what this clientlib uses) */}
          {dependenciesResult.length > 0 && (
            <div className="dependencies-section">
              <h3>📥 Dépendances ({dependenciesResult.length})</h3>
              <p className="section-description">Cette clientlib dépend de :</p>
              <div className="dependency-list">
                {dependenciesResult.map((dep, idx) => (
                  <div key={idx} className="dependency-item">
                    <div className="dependency-type-badge">
                      {dep.type === "depends" ? "🔗 Depends" : "📌 Embed"}
                    </div>
                    <div className="dependency-info">
                      <div className="dependency-category">
                        📂 {dep.category}
                      </div>
                      {dep.clientlibs && dep.clientlibs.length > 0 && (
                        <div className="dependency-paths">
                          {dep.clientlibs.map((lib, i) => (
                            <div key={i} className="dependency-path-item">
                              📄 {lib.path}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Summary */}
          <div className="impact-summary-section">
            <h3>⚠️ Impact d'une Modification</h3>
            <div className="impact-stats">
              <div className="impact-stat-card direct">
                <div className="stat-number">{impactResult.direct.length}</div>
                <div className="stat-label">Impact Direct</div>
                <div className="stat-description">
                  Clientlibs qui dépendent directement
                </div>
              </div>
              <div className="impact-stat-card indirect">
                <div className="stat-number">
                  {impactResult.indirect.length}
                </div>
                <div className="stat-label">Impact Indirect</div>
                <div className="stat-description">
                  Clientlibs impactées en cascade
                </div>
              </div>
              <div className="impact-stat-card total">
                <div className="stat-number">{impactResult.all.length}</div>
                <div className="stat-label">Impact Total</div>
                <div className="stat-description">
                  Total des clientlibs à tester
                </div>
              </div>
            </div>
          </div>

          {/* Direct Impact */}
          {impactResult.direct.length > 0 && (
            <div className="impact-details-section">
              <h3>🎯 Impact Direct ({impactResult.direct.length})</h3>
              <p className="section-description">
                Ces clientlibs seront directement impactées par toute
                modification :
              </p>
              <div className="impact-list">
                {impactResult.direct.map((dep, idx) => (
                  <div key={idx} className="impact-item direct-impact">
                    <div className="impact-type-badge">
                      {dep.type === "depends" ? "🔗 Depends" : "📌 Embed"}
                    </div>
                    <div className="impact-info">
                      <div className="impact-category">📂 {dep.category}</div>
                      {dep.clientlibs && dep.clientlibs.length > 0 && (
                        <div className="impact-paths">
                          {dep.clientlibs.map((lib, i) => (
                            <div key={i} className="impact-path-item">
                              📄 {lib.path}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="impact-warning">
                      {dep.type === "embed" && "⚠️ Code inliné - impact fort"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indirect Impact */}
          {impactResult.indirect.length > 0 && (
            <div className="impact-details-section">
              <h3>🔄 Impact Indirect ({impactResult.indirect.length})</h3>
              <p className="section-description">
                Ces clientlibs seront impactées par effet cascade :
              </p>
              <div className="impact-list">
                {impactResult.indirect.map((dep, idx) => (
                  <div key={idx} className="impact-item indirect-impact">
                    <div className="impact-type-badge cascade">🔄 Cascade</div>
                    <div className="impact-info">
                      <div className="impact-category">📂 {dep.category}</div>
                      {dep.clientlibs && dep.clientlibs.length > 0 && (
                        <div className="impact-paths">
                          {dep.clientlibs.map((lib, i) => (
                            <div key={i} className="impact-path-item">
                              📄 {lib.path}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Impact */}
          {impactResult.all.length === 0 && (
            <div className="no-impact-message">
              <div className="no-impact-icon">✅</div>
              <h3>Aucun Impact Détecté</h3>
              <p>
                Cette clientlib n'est utilisée par aucune autre clientlib. Elle
                peut être modifiée sans risque de casser d'autres dépendances.
              </p>
            </div>
          )}

          {/* Testing Recommendation */}
          {impactResult.all.length > 0 && (
            <div className="testing-recommendation">
              <h3>✅ Recommandations de Test</h3>
              <div className="recommendation-content">
                <p>
                  <strong>
                    Après modification de cette clientlib, vous devez tester :
                  </strong>
                </p>
                <ol>
                  <li>
                    Les{" "}
                    <strong>
                      {impactResult.direct.length} clientlibs avec impact direct
                    </strong>
                    {impactResult.direct.some((d) => d.type === "embed") && (
                      <span className="critical">
                        {" "}
                        (⚠️ attention aux embeds)
                      </span>
                    )}
                  </li>
                  <li>
                    Les{" "}
                    <strong>
                      {impactResult.indirect.length} clientlibs avec impact
                      indirect
                    </strong>{" "}
                    (tests de régression recommandés)
                  </li>
                  <li>Tous les composants et pages utilisant ces clientlibs</li>
                </ol>
                <div className="testing-tip">
                  💡 <strong>Astuce :</strong> Utilisez l'onglet "Usages" pour
                  voir où ces clientlibs sont appelées (JSP/HTL/Dialogs)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedClientlib && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Sélectionnez une Clientlib</h3>
          <p>
            Utilisez la barre de recherche ci-dessus pour sélectionner une
            clientlib et voir l'impact de sa modification sur votre projet.
          </p>
          <div className="empty-state-stats">
            <div className="stat-item">
              <strong>{clientlibs.length}</strong>
              <span>Clientlibs totales</span>
            </div>
            <div className="stat-item">
              <strong>{relations.length}</strong>
              <span>Relations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
