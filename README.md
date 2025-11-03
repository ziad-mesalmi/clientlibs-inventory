# 📊 AEM Clientlibs Inventory

Modern React dashboard for analyzing and visualizing AEM clientlibs dependencies, usages, and potential issues.

## ✨ Features

- 🔍 **Interactive Dependency Graph** - Visualize clientlib relations with ReactFlow
- 🚨 **Smart Alerts System** - CVEs, jQuery conflicts, circular dependencies
- 📋 **Detailed Table View** - Filter and analyze all clientlibs
- 📍 **Usage Tracking** - See where clientlibs are used (HTL, JSP, Dialogs)
- ⚡ **Modern Stack** - React 18 + Vite + Java 11 Streams

## 🚀 Quick Start

### Prérequis

1. **AEM doit être démarré** sur `http://localhost:4502`
2. Le servlet Java doit être déployé dans AEM

### Démarrage

```bash
# Install dependencies
npm install

# Start development server
npm start
# L'application se lance sur http://localhost:3000
```

## ⚙️ Configuration

### Authentification AEM

Par défaut, l'application utilise un **proxy Vite** configuré dans `vite.config.js` pour communiquer avec AEM. Les credentials sont définis dans la configuration du proxy :

- **URL AEM** : `http://localhost:4502`
- **Utilisateur** : `admin`
- **Mot de passe** : `admin`

Si vous avez des credentials différents, modifiez directement le fichier `vite.config.js` :

```javascript
configure: (proxy, options) => {
  proxy.on("proxyReq", (proxyReq) => {
    const auth = Buffer.from("VOTRE_USER:VOTRE_PASSWORD").toString("base64");
    proxyReq.setHeader("Authorization", `Basic ${auth}`);
  });
},
```

### Mode Direct (sans proxy)

Vous pouvez aussi appeler AEM directement en remplissant le champ "URL AEM" dans l'interface avec `http://localhost:4502`.

⚠️ **Attention** : En mode direct, vous pourriez rencontrer des problèmes CORS si AEM n'est pas configuré pour accepter les requêtes cross-origin.

### Configuration des chemins de scan

L'application permet de configurer **plusieurs chemins spécifiques** à scanner dans le JCR. Cliquez sur le bouton **"▶ Configurer"** dans l'en-tête pour accéder aux options :

#### Chemins par défaut

Par défaut, l'application scanne :

- `/apps/ca/npc`
- `/apps/settings/wcm/designs/ca`

#### Ajouter/Modifier des chemins

1. Cliquez sur **"▶ Configurer"** dans l'en-tête
2. Modifiez les chemins existants directement dans les champs
3. Ajoutez un nouveau chemin avec le bouton **"➕ Ajouter"**
4. Supprimez un chemin avec le bouton **"✕"** (au moins 1 chemin doit rester)

#### Préconfigurations rapides

Deux boutons de préconfiguration sont disponibles :

- **NPC** : Configure `/apps/ca/npc` et `/apps/settings/wcm/designs/ca`
- **Tout** : Configure `/apps`, `/etc`, `/libs` pour un scan complet

#### Exemples de chemins

```
/apps/ca/npc
/apps/settings/wcm/designs/ca
/apps/myproject/clientlibs
/etc/designs/mysite
/libs/granite/ui/clientlibs
```

💡 **Astuce** : Utilisez des chemins spécifiques pour des analyses plus rapides et ciblées !

## 📁 Project Structure

```
clientlibs-inventory/
├── src/
│   ├── components/      # React components
│   ├── services/        # API services
│   └── styles/          # CSS styles
├── vite.config.js       # Vite configuration with proxy
└── package.json
```

## 🔧 Backend (AEM)

The Java servlet provides:

- Clientlib scanning with JCR-SQL2
- Dependency graph analysis
- CVE detection
- jQuery conflict detection
- Usage tracking (HTL/JSP/Dialogs)
- Java 11 Stream API for performance

## 📦 Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

Le build génère des fichiers statiques dans le dossier `dist/` que vous pouvez déployer sur n'importe quel serveur web statique.

## 🎯 Usage

1. Make sure AEM is running on `localhost:4502`
2. Deploy the Java servlet to AEM
3. Start the React app: `npm start`
4. Open `http://localhost:3000`

## 📸 Screenshots

### Alerts Dashboard

View critical alerts like CVEs, jQuery conflicts, and circular dependencies.

### Dependency Graph

Interactive visualization of clientlib dependencies and embed relations.

### Clientlibs Table

Filterable table with all clientlibs, categories, and sizes.

### Usage Tracking

See where each clientlib category is used across HTL, JSP, and Dialogs.

## 🤝 Contributing

Contributions welcome! This tool helps AEM developers maintain clean and optimized clientlib structures.

## 📄 License

MIT
