import React, { useMemo } from "react";

export default function RecommendationsPanel({ data }) {
  const recommendations = useMemo(() => {
    const recs = [];

    // Extract alerts by level
    const alerts = data.alerts || [];
    const criticalAlerts = alerts.filter((a) => a.level === "CRITICAL");
    const highAlerts = alerts.filter((a) => a.level === "HIGH");
    const mediumAlerts = alerts.filter((a) => a.level === "MEDIUM");

    // 1. CRITICAL: CVEs
    const cveAlerts = criticalAlerts.filter((a) => a.type === "CVE");
    if (cveAlerts.length > 0) {
      recs.push({
        id: "cve-updates",
        priority: "CRITICAL",
        title: `🔴 ${cveAlerts.length} Security Vulnerabilities (CVEs)`,
        description:
          "Des vulnérabilités de sécurité ont été détectées dans vos librairies tierces.",
        impact: "Risque de sécurité majeur pour votre application",
        actions: cveAlerts.map((cve) => ({
          type: "update",
          library: cve.data.library,
          currentVersion: cve.data.version,
          issue: cve.data.cveId,
          suggestion: `Mettre à jour ${cve.data.library} ${cve.data.version} pour corriger ${cve.data.cveId}`,
        })),
        effort: "Moyen",
        benefit: "Critique - Sécurité",
      });
    }

    // 2. CRITICAL: jQuery Conflicts
    const jqueryAlert = criticalAlerts.find(
      (a) => a.type === "JQUERY_CONFLICT"
    );
    if (jqueryAlert) {
      const versions = jqueryAlert.data?.versions || [];
      recs.push({
        id: "jquery-conflicts",
        priority: "CRITICAL",
        title: `🔴 Conflits jQuery - ${versions.length} versions détectées`,
        description: `Votre application charge ${versions.join(
          ", "
        )} de jQuery simultanément.`,
        impact:
          "Erreurs JavaScript, fonctionnalités cassées, conflits $ et jQuery",
        actions: [
          {
            type: "consolidate",
            suggestion:
              "Option 1 (Recommandé) : Migrer toutes les clientlibs vers la dernière version stable de jQuery",
          },
          {
            type: "isolate",
            suggestion:
              "Option 2 : Utiliser jQuery.noConflict() et wrapper vos scripts dans des IIFE",
          },
          {
            type: "analyze",
            suggestion:
              "Option 3 : Analyser les dépendances pour identifier quelle version est nécessaire pour chaque composant",
          },
        ],
        conflicts: jqueryAlert.conflicts || [],
        effort: "Élevé",
        benefit: "Critique - Stabilité",
      });
    }

    // 3. HIGH: Circular Dependencies
    const cycleAlert = highAlerts.find((a) => a.type === "CIRCULAR_DEPENDENCY");
    if (cycleAlert) {
      const cycles = cycleAlert.data || [];
      recs.push({
        id: "circular-deps",
        priority: "HIGH",
        title: `🟠 ${cycles.length} Dépendances circulaires`,
        description:
          "Des cycles de dépendances ont été détectés, causant un ordre de chargement imprévisible.",
        impact:
          "Ordre de chargement imprévisible, erreurs d'initialisation potentielles",
        actions: cycles.map((cycle, idx) => ({
          type: "refactor",
          cycle: cycle,
          suggestion: `Cycle ${idx + 1}: ${cycle.join(
            " → "
          )} → ... Extraire les dépendances communes dans une clientlib séparée`,
        })),
        effort: "Moyen",
        benefit: "Élevé - Maintenabilité",
      });
    }

    // 4. HIGH: Unused Clientlibs
    const unusedAlert = highAlerts.find((a) => a.type === "NO_CATEGORY");
    if (unusedAlert) {
      const unused = unusedAlert.data || [];
      recs.push({
        id: "unused-clientlibs",
        priority: "HIGH",
        title: `🟠 ${unused.length} Clientlibs sans catégorie (obsolètes)`,
        description:
          "Ces clientlibs n'ont pas de catégorie et ne peuvent pas être référencées.",
        impact: "Code mort, complexité inutile, temps de build gaspillé",
        actions: [
          {
            type: "cleanup",
            suggestion: `Analyser et supprimer les ${unused.length} clientlibs obsolètes`,
            paths: unused,
          },
        ],
        effort: "Faible",
        benefit: "Moyen - Nettoyage",
      });
    }

    // 5. MEDIUM: Duplicates
    const duplicatesAlert = mediumAlerts.find((a) => a.type === "DUPLICATES");
    if (duplicatesAlert) {
      const duplicates = duplicatesAlert.data || [];
      recs.push({
        id: "duplicate-files",
        priority: "MEDIUM",
        title: `🟡 ${duplicates.length} Fichiers dupliqués`,
        description:
          "Des fichiers identiques (même checksum) existent dans plusieurs clientlibs.",
        impact: "Taille de payload augmentée, bande passante gaspillée",
        actions: duplicates.map((dup) => ({
          type: "consolidate",
          checksum: dup.checksum,
          paths: dup.paths,
          suggestion: `Consolider ${dup.paths.length} fichiers identiques en une seule clientlib partagée`,
        })),
        effort: "Moyen",
        benefit: "Moyen - Performance",
      });
    }

    // 6. MEDIUM: Embed Risks
    const embedAlert = mediumAlerts.find((a) => a.type === "EMBED_RISK");
    if (embedAlert) {
      const embedWarnings = embedAlert.data || [];
      recs.push({
        id: "embed-duplication",
        priority: "MEDIUM",
        title: `🟡 ${embedWarnings.length} Risques de duplication via embed`,
        description:
          "Des catégories sont 'embeddées' par plusieurs parents, causant une duplication du code.",
        impact: "Code dupliqué, payload augmenté, difficulté de maintenance",
        actions: embedWarnings.map((warn) => ({
          type: "refactor",
          category: warn.embeddedCategory,
          embeddedBy: warn.embeddedBy,
          suggestion: `"${warn.embeddedCategory}" est embed par ${warn.embeddedBy.length} clientlibs. Considérer 'dependencies' au lieu de 'embed'`,
        })),
        effort: "Faible",
        benefit: "Moyen - Optimisation",
      });
    }

    // 7. Additional: Unused categories (from usages with 0)
    const unusedCategories = Object.entries(data.usages || {})
      .filter(([cat, usages]) => usages.length === 0)
      .map(([cat]) => cat);

    if (unusedCategories.length > 0) {
      recs.push({
        id: "unused-categories",
        priority: "INFO",
        title: `🔵 ${unusedCategories.length} Catégories non utilisées`,
        description:
          "Ces catégories ne sont référencées dans aucun HTL, JSP ou Dialog.",
        impact:
          "Possiblement du code mort, ou utilisées uniquement en programmatique",
        actions: [
          {
            type: "audit",
            categories: unusedCategories,
            suggestion: `Auditer l'utilisation de ces ${
              unusedCategories.length
            } catégories : ${unusedCategories.slice(0, 3).join(", ")}${
              unusedCategories.length > 3 ? "..." : ""
            }`,
          },
        ],
        effort: "Faible",
        benefit: "Faible - Audit",
      });
    }

    return recs;
  }, [data]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "#ff4444";
      case "HIGH":
        return "#ff9944";
      case "MEDIUM":
        return "#ffdd44";
      case "INFO":
        return "#4499ff";
      default:
        return "#8b92a8";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      case "INFO":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return (
    <div className="recommendations-panel">
      <div className="recommendations-header">
        <h2>💡 Recommandations & Optimisations</h2>
        <p className="recommendations-subtitle">
          Suggestions d'amélioration pour optimiser vos clientlibs
        </p>
        <div className="recommendations-stats">
          <span className="stat-pill critical">
            {recommendations.filter((r) => r.priority === "CRITICAL").length}{" "}
            Critiques
          </span>
          <span className="stat-pill high">
            {recommendations.filter((r) => r.priority === "HIGH").length} Haute
            priorité
          </span>
          <span className="stat-pill medium">
            {recommendations.filter((r) => r.priority === "MEDIUM").length}{" "}
            Moyenne priorité
          </span>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          ✅ Excellent ! Aucune recommandation - Vos clientlibs sont bien
          optimisées
        </div>
      ) : (
        <div className="recommendations-list">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="recommendation-card"
              style={{ borderLeftColor: getPriorityColor(rec.priority) }}
            >
              <div className="rec-header">
                <div className="rec-title-group">
                  <span className="rec-icon">
                    {getPriorityIcon(rec.priority)}
                  </span>
                  <h3>{rec.title}</h3>
                </div>
                <div className="rec-badges">
                  <span className="badge-effort">⚡ {rec.effort}</span>
                  <span className="badge-benefit">📈 {rec.benefit}</span>
                </div>
              </div>

              <p className="rec-description">{rec.description}</p>

              <div className="rec-impact">
                <strong>💥 Impact:</strong> {rec.impact}
              </div>

              <div className="rec-actions">
                <strong>✅ Actions recommandées:</strong>
                <ul>
                  {rec.actions.map((action, idx) => (
                    <li key={idx} className="action-item">
                      <span className="action-type">{action.type}</span>
                      <span className="action-text">{action.suggestion}</span>
                      {action.paths && action.paths.length > 0 && (
                        <details className="action-details">
                          <summary>
                            Voir les {action.paths.length} chemins
                          </summary>
                          <ul className="path-list">
                            {action.paths.map((path, i) => (
                              <li key={i}>
                                <code>{path}</code>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {action.embeddedBy && (
                        <div className="embedded-info">
                          <small>
                            Embedded par: {action.embeddedBy.join(", ")}
                          </small>
                        </div>
                      )}
                      {action.cycle && (
                        <div className="cycle-info">
                          <code>{action.cycle.join(" → ")}</code>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {rec.conflicts && rec.conflicts.length > 0 && (
                <div className="rec-conflicts">
                  <strong>
                    ⚠️ Conflits détectés ({rec.conflicts.length}):
                  </strong>
                  <ul className="conflict-list">
                    {rec.conflicts.slice(0, 5).map((conflict, idx) => (
                      <li key={idx}>
                        <code>{conflict.clientlib}</code> →{" "}
                        <code>{conflict.dependency}</code>
                        <span className="conflict-risk">{conflict.risk}</span>
                      </li>
                    ))}
                    {rec.conflicts.length > 5 && (
                      <li className="more-conflicts">
                        ... et {rec.conflicts.length - 5} autres conflits
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
