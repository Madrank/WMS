# Mini-WMS

Système de gestion d'entrepôt (Warehouse Management System) fullstack.
Application web permettant de gérer les produits, les fournisseurs, les emplacements de stockage, les entrées/sorties de marchandises, les réceptions fournisseurs et les inventaires physiques — avec traçabilité complète des mouvements de stock.

## Technologies

- **Backend** : Node.js ≥ 22, Express 5, TypeScript, PostgreSQL ≥ 16, Drizzle ORM
- **Frontend** : React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query, React Router
- **Validation** : Zod (formulaires frontend) + règles métier (services backend)
- **Tests** : Vitest (unitaires sur la logique métier)
- **CI/CD** : GitHub Actions (typecheck + tests sur chaque push et PR)

## Architecture

```
mini-wms/
├── backend/    → API REST Express en couches
│   └── src/
│       ├── routes/        → définition des routes + middlewares
│       ├── controllers/   → liaison HTTP (parsing, codes de statut)
│       ├── services/      → règles métier et transactions
│       ├── repositories/  → accès SQL (via Drizzle ORM)
│       ├── middlewares/   → auth (JWT) + autorisation (rôles) + erreurs
│       ├── db/            → schéma Drizzle, connexion, seed
│       └── utils/         → JWT
└── frontend/   → SPA React (Vite, Tailwind, TanStack Query, React Router)
    └── src/
        ├── pages/         → pages (login, dashboard, articles, ...)
        ├── components/    → composants réutilisables (formulaires)
        ├── services/      → appels API (axios)
        ├── schemas/       → validation Zod des formulaires
        └── layouts/       → layout applicatif (sidebar, navigation)
```

**Principe de l'architecture en couches (backend)** : chaque requête traverse `route → contrôleur → service → repository → base de données`, dans cet ordre. Les services portent les **règles métier** et les **transactions** ; les repositories sont le seul niveau qui parle SQL.

## Fonctionnalités (cahier des charges)

### 1. Authentification et rôles

- Connexion JWT (`POST /api/auth/login`), utilisateur courant (`GET /api/auth/me`)
- Trois rôles : **ADMIN**, **MANAGER**, **OPERATOR**
- Middleware `requireAuth` (protège toutes les routes) et `requireRole` (autorisations fines)

| Action | ADMIN | MANAGER | OPERATOR |
|---|---|---|---|
| Consulter (articles, stocks, ...) | Oui | Oui | Oui |
| Créer/modifier des données | Oui | Oui | Oui |
| Valider réceptions et inventaires | Oui | Oui | Non (403) |

### 2. Articles

- CRUD complet : `GET/POST /api/articles`, `GET/PATCH/DELETE /api/articles/:id`
- **Liste paginée** (`page`, `limit`) avec **recherche** (`search` sur référence et nom)
- **Référence unique** : doublon refusé (`409 REFERENCE_ALREADY_USED`)
- **Désactivation logique** (soft delete) : l'article reste en base, `active` passe à `false`
- Champs : référence, nom, description, code-barres, unité, stock minimum

### 3. Fournisseurs

- CRUD complet : `GET/POST /api/suppliers`, `GET/PATCH/DELETE /api/suppliers/:id`
- Liste paginée + recherche (nom, email, ville)
- **Email unique** si renseigné (`409 EMAIL_ALREADY_USED`)
- Désactivation logique

### 4. Entrepôt → Zones → Emplacements

- Hiérarchie à 3 niveaux : `warehouses → zones → locations` (clés étrangères)
- `GET/POST /api/warehouses`, `GET/POST/PATCH/DELETE /api/zones`, etc.
- **Unicité composite** : deux zones ne peuvent pas partager le même code dans le même entrepôt (`ZONE_CODE_ALREADY_USED`)
- **Code d'emplacement unique** globalement
- **Suppression en cascade** gérée par la base : supprimer un entrepôt supprime ses zones et emplacements
- Emplacements : désactivation logique (préservation de l'historique des stocks)

### 5. Stocks et mouvements (cœur métier)

- `GET /api/stocks` : liste filtrée par article et/ou emplacement
- **Unicité (article, emplacement)** : un seul stock par couple
- `POST /api/movements` avec 4 types :
  - **IN** : entrée (incrémente le stock, le crée s'il n'existe pas — *upsert*)
  - **OUT** : sortie (décrémente, refusée si stock insuffisant → `409 INSUFFICIENT_STOCK`)
  - **TRANSFER** : transfert entre deux emplacements (source ≠ destination, vérifie le stock source)
  - **ADJUSTMENT** : ajustement (généré par les inventaires)
- **Transactions atomiques** : le mouvement et la mise à jour du stock réussissent ensemble ou échouent ensemble (ROLLBACK)
- **Incrément SQL atomique** : `UPDATE ... SET quantity = quantity + N` (sûr en environnement concurrent)
- **Journal d'audit immuable** : `GET /api/movements` — chaque opération est tracée (qui, quoi, combien, où, quand, pourquoi)

### 6. Réceptions fournisseurs

- `GET/POST /api/receipts`, `GET /api/receipts/:id`, `POST /api/receipts/:id/validate`
- **Cycle de vie** : `DRAFT → VALIDATED` (ou refus)
- Un bon de réception contient des **lignes** (article, quantité attendue, quantité reçue, emplacement)
- **Quantités attendue vs reçue** : on enregistre ce qui a réellement été livré
- **À la validation** (ADMIN/MANAGER) : transaction qui passe le statut à VALIDATED, crée un mouvement **IN** par ligne et **incrémente le stock**
- Gardes : référence unique, pas de double validation (`RECEIPT_ALREADY_VALIDATED`), quantité positive

### 7. Inventaires

- `GET/POST /api/inventories`, `GET /api/inventories/:id`, `POST /api/inventories/:id/validate`
- **Comptage physique** : par emplacement, lignes (article, quantité théorique, quantité comptée)
- **À la validation** : calcul de l'écart `compté − théorique`, génération d'un mouvement **ADJUSTMENT** et correction du stock (incrément si positif, décrément si négatif)
- Lignes sans écart → ignorées (pas de mouvement inutile)

### 8. Dashboard

- `GET /api/dashboard` (lecture seule) :
  - **Stats** : articles actifs, fournisseurs, emplacements, total d'unités en stock
  - **Alertes de stock bas** : articles dont le stock total < stock minimum (agrégation `SUM` + `HAVING`)
  - **Répartition** : stock par emplacement avec zone (jointure `stocks → locations → zones`)
  - **Mouvements récents** (10 derniers)

## Installation

### Prérequis

- Node.js ≥ 22
- PostgreSQL ≥ 16

### 1. Base de données

```bash
createdb mini_wms
cd backend
cp .env.example .env   # renseigne DATABASE_URL et JWT_SECRET
```

### 2. Migration et seed

```bash
cd backend
npm install
npx drizzle-kit migrate   # crée les 13 tables
npm run db:seed           # données de démo
```

### 3. Démarrage (2 terminaux)

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173, proxy /api → backend)
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Comptes de démo

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | admin@wms.local | admin123 |
| MANAGER | manager@wms.local | manager123 |
| OPERATOR | operator@wms.local | operator123 |

## Scripts

| Script | Dossier | Description |
|---|---|---|
| `npm run dev` | backend | Serveur de dev (tsx watch, port 3001) |
| `npm run typecheck` | backend | Vérification TypeScript |
| `npm run test` | backend | Tests unitaires Vitest |
| `npm run build` | backend | Compilation (tsc) |
| `npm run db:seed` | backend | Ré-initialise les données de démo |
| `npm run dev` | frontend | Serveur Vite (port 5173) |

## API (résumé)

| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/api/auth/login` | Connexion (token JWT) | public |
| GET | `/api/auth/me` | Utilisateur courant | connecté |
| GET/POST | `/api/articles` | Liste / créer article | connecté |
| GET/PATCH/DELETE | `/api/articles/:id` | Détail / modifier / désactiver | connecté |
| GET/POST | `/api/suppliers` | Liste / créer fournisseur | connecté |
| GET/PATCH/DELETE | `/api/suppliers/:id` | Détail / modifier / désactiver | connecté |
| GET/POST | `/api/warehouses` | Entrepôts | connecté |
| GET/POST/PATCH/DELETE | `/api/zones` | Zones | connecté |
| GET/POST/PATCH/DELETE | `/api/locations` | Emplacements | connecté |
| GET | `/api/stocks` | Stocks (filtre article/emplacement) | connecté |
| GET/POST | `/api/movements` | Journal / créer un mouvement | connecté |
| GET/POST | `/api/receipts` | Réceptions | connecté |
| POST | `/api/receipts/:id/validate` | Valider une réception | ADMIN/MANAGER |
| GET/POST | `/api/inventories` | Inventaires | connecté |
| POST | `/api/inventories/:id/validate` | Valider un inventaire | ADMIN/MANAGER |
| GET | `/api/dashboard` | Statistiques | connecté |

Toutes les réponses d'erreur suivent le format : `{ "error": { "code": "...", "message": "..." } }`.

## Base de données

13 tables (gérées par Drizzle ORM, migrations dans `backend/drizzle/`) :

```
users, suppliers, articles, article_suppliers (many-to-many),
warehouses, zones, locations,
stocks, stock_movements,
receipts, receipt_items,
inventories, inventory_items
```

## Tests

```bash
cd backend
npm run test
```

Tests unitaires (Vitest) sur les règles métier du service des mouvements :

- sortie refusée si stock insuffisant (`INSUFFICIENT_STOCK`)
- entrée IN → incrément du stock à la destination
- transfert vers le même emplacement refusé

Les repositories et la base sont **mockés** : les tests vérifient la logique du service sans toucher PostgreSQL.

## CI / CD

Workflow GitHub Actions (`.github/workflows/ci.yml`) exécuté sur chaque push vers `main` et chaque pull request :

- **Job typecheck** : `npm run typecheck` (backend) + `tsc -b --noEmit` (frontend)
- **Job test** : `npm run test` (vitest, backend)

Une PR dont la CI échoue est **bloquée** jusqu'à correction.

## Workflow Git

- Développement par module sur une branche dédiée : `feature/<nom>`
- Chaque module est fusionné dans `main` via une **Pull Request**
- `main` reste toujours dans un état stable et déployable

Historique des modules : auth → articles → fournisseurs → entrepôt → stocks/mouvements → réceptions → inventaires → dashboard → frontend → CI → tests → rôles → documentation.