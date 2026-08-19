# Mini-WMS

Système de gestion d'entrepôt (Warehouse Management System) fullstack.
Application web permettant de gérer les produits, les fournisseurs, les emplacements de stockage, les entrées/sorties de marchandises, les réceptions fournisseurs, les inventaires physiques et les utilisateurs — avec traçabilité complète des mouvements de stock et autorisations par rôle.

## Technologies

- **Backend** : Node.js ≥ 22, Express 5, TypeScript, PostgreSQL ≥ 16, Drizzle ORM, Zod
- **Frontend** : React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query, React Router, Zod
- **Validation** : couche `validators/` (Zod, backend) + schémas de formulaires (frontend)
- **Tests** : Vitest — 27 tests unitaires sur la logique métier
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
│       ├── middlewares/   → auth (JWT), requireRole (rôles), validate (zod), erreurs
│       ├── validators/    → schémas Zod des corps de requêtes (POST/PATCH)
│       ├── types/         → augmentation Express (req.user)
│       ├── db/            → schéma Drizzle, connexion, seed
│       └── utils/         → JWT
└── frontend/   → React (Vite, Tailwind, TanStack Query, React Router)
    └── src/
        ├── pages/         → pages (login, dashboard, articles, entrepôt, users, ...)
        ├── components/    → composants réutilisables (formulaires)
        ├── services/      → appels API (axios)
        ├── schemas/       → validation Zod des formulaires frontend
        ├── layouts/       → layout applicatif (sidebar, navigation)
        └── lib/           → client axios (intercepteur JWT)
```

**Principe de l'architecture en couches (backend)** : chaque requête traverse `route → middleware → contrôleur → service → repository → base de données`, dans cet ordre.

- Les **validators** vérifient la **forme** des données (types, champs requis, bornes) → `400 VALIDATION_ERROR`
- Les **services** portent les **règles métier** et les **transactions** (unicité, existence, stock)
- Les **repositories** sont le seul niveau qui parle SQL

## Fonctionnalités (cahier des charges)

### 1. Authentification et rôles

- Connexion JWT (`POST /api/auth/login`), déconnexion (`POST /api/auth/logout`), utilisateur courant (`GET /api/auth/me`)
- Trois rôles : **ADMIN**, **MANAGER**, **OPERATOR** — vérifiés côté backend (`requireRole`)
- Module **utilisateurs** (`/api/users`, ADMIN uniquement) : création, modification, désactivation, changement de rôle

| Action | ADMIN | MANAGER | OPERATOR |
|---|---|---|---|
| Consulter (articles, stocks, ...) | Oui | Oui | Oui |
| Créer/modifier/désactiver articles et fournisseurs | Oui | Oui | Non (403) |
| Gérer l'entrepôt (entrepôts, zones) | Oui | Non (403) | Non (403) |
| Gérer les emplacements | Oui | Oui | Non (403) |
| Effectuer des mouvements, créer réceptions/inventaires | Oui | Oui | Oui |
| Valider réceptions et inventaires | Oui | Oui | Non (403) |
| Gérer les utilisateurs | Oui | Non (403) | Non (403) |

### 2. Articles

- CRUD complet : `GET/POST /api/articles`, `GET/PATCH/DELETE /api/articles/:id`
- **Liste paginée** (`page`, `limit`) avec **recherche** (`search`) et **filtre actif/inactif** (`active`)
- **Référence unique** : doublon refusé (`409 REFERENCE_ALREADY_USED`)
- **Code-barres unique** si renseigné
- **Désactivation logique** : l'article reste en base, `active` passe à `false`

### 3. Fournisseurs

- CRUD complet, liste paginée + recherche
- **Email unique** si renseigné (`409 EMAIL_ALREADY_USED`)
- Relation **many-to-many** avec les articles (`article_suppliers`) : un produit peut avoir plusieurs fournisseurs et inversement
- Désactivation logique

### 4. Entrepôt → Zones → Emplacements

- Hiérarchie à 3 niveaux : `warehouses → zones → locations` (clés étrangères)
- Pages frontend : `/warehouse`, `/warehouse/zones`, `/warehouse/locations`
- **Unicité** : code de zone unique par entrepôt (`ZONE_CODE_ALREADY_USED`), code d'emplacement unique globalement
- **Suppression en cascade** gérée par la base (supprimer un entrepôt supprime ses zones et emplacements)
- Emplacements : **désactivation logique** (l'historique des stocks est préservé)

### 5. Stocks et mouvements (cœur métier)

- `GET /api/stocks` : liste filtrée par **article**, **emplacement** et **zone** (`zoneId`), paginée
- `GET /api/stocks/by-article/:articleId` : tous les stocks d'un article
- **Unicité (article, emplacement)** : un seul stock par couple
- `POST /api/movements` avec 4 types :
  - **IN** : entrée (incrémente le stock, le crée s'il n'existe pas — *upsert*)
  - **OUT** : sortie (décrémente, refusée si stock insuffisant → `409 INSUFFICIENT_STOCK`)
  - **TRANSFER** : transfert entre deux emplacements (source ≠ destination, vérifie le stock source)
  - **ADJUSTMENT** : ajustement (généré par les inventaires)
- **Gardes métier** : quantité strictement positive, produit désactivé interdit (`409 ARTICLE_INACTIVE`), emplacement désactivé interdit (`409 LOCATION_INACTIVE`)
- **Transactions atomiques** : mouvement + mise à jour du stock réussissent ensemble ou échouent ensemble (ROLLBACK)
- **Incrément SQL atomique** : `UPDATE ... SET quantity = quantity + N` (sûr en environnement concurrent)
- **Journal d'audit immuable** : `GET /api/movements` avec **pagination** et **filtres** (article, emplacement, type, utilisateur, période `from`/`to`) — chaque opération est tracée (qui, quoi, combien, où, quand, pourquoi)

### 6. Réceptions fournisseurs

- `GET/POST /api/receipts`, `GET /api/receipts/:id`, `POST /api/receipts/:id/validate`
- **Cycle de vie** : `DRAFT → VALIDATED` ; une réception brouillon ne touche pas au stock
- Lignes : article, quantité attendue, quantité reçue, emplacement (quantités prévue vs réelle)
- **À la validation** (ADMIN/MANAGER) : transaction qui passe le statut à VALIDATED, crée un mouvement **IN** par ligne et **incrémente le stock**
- Gardes : référence unique, pas de double validation (`409 RECEIPT_ALREADY_VALIDATED`), quantité reçue positive

### 7. Inventaires

- `GET/POST /api/inventories`, `GET /api/inventories/:id`, `POST /api/inventories/:id/validate`
- **Comptage physique** par emplacement : lignes (article, quantité théorique, quantité comptée)
- **À la validation** : calcul de l'écart `compté − théorique`, mouvement **ADJUSTMENT** par écart et correction du stock (incrément si positif, décrément si négatif)
- Lignes sans écart → ignorées (pas de mouvement inutile)

### 8. Dashboard

- `GET /api/dashboard` (lecture seule) :
  - **Stats** : articles actifs, fournisseurs, emplacements, total d'unités en stock
  - **Alertes de stock bas** : articles dont le stock total < minimum (agrégation `SUM` + `HAVING`)
  - **Répartition** : stock par emplacement avec zone (jointure `stocks → locations → zones`)
  - **Mouvements récents** (10 derniers)

### 9. Validation backend (couche `validators/`)

- **10 schémas Zod** couvrant toutes les routes d'écriture (articles, fournisseurs, utilisateurs, entrepôt, zones, emplacements, mouvements, réceptions, inventaires, login)
- Middleware `validate(schema)` : rejette avec `400 VALIDATION_ERROR` et un tableau `details` (champ + message) — toutes les erreurs d'un coup
- **Sanitization** : `req.body` est remplacé par les données validées — les champs parasites sont supprimés

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

### 2. Migration / seed

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
| `npm run dev` | backend | Serveur de dev (port 3001) |
| `npm run typecheck` | backend | Vérification TypeScript |
| `npm run test` | backend | Tests unitaires Vitest (27) |
| `npm run build` | backend | Compilation (tsc) |
| `npm run db:seed` | backend | Ré-initialise les données de démo |
| `npm run dev` | frontend | Serveur Vite (port 5173) |

## API (résumé)

| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/api/auth/login` | Connexion (token JWT) | public |
| POST | `/api/auth/logout` | Déconnexion | connecté |
| GET | `/api/auth/me` | Utilisateur courant | connecté |
| CRUD | `/api/users` | Utilisateurs (création, rôles) | ADMIN |
| GET/POST | `/api/articles` | Liste / créer article | POST : ADMIN/MANAGER |
| GET/PATCH/DELETE | `/api/articles/:id` | Détail / modifier / désactiver | PATCH/DELETE : ADMIN/MANAGER |
| GET/POST | `/api/suppliers` | Liste / créer fournisseur | POST : ADMIN/MANAGER |
| GET/PATCH/DELETE | `/api/suppliers/:id` | Détail / modifier / désactiver | PATCH/DELETE : ADMIN/MANAGER |
| GET/POST | `/api/warehouses` | Entrepôts | POST : ADMIN |
| GET/POST | `/api/zones` | Zones | POST : ADMIN |
| GET/POST | `/api/locations` | Emplacements | POST : ADMIN/MANAGER |
| GET | `/api/stocks` | Stocks (filtres article/emplacement/zone) | connecté |
| GET | `/api/stocks/by-article/:articleId` | Stocks d'un article | connecté |
| GET/POST | `/api/movements` | Journal / créer un mouvement | connecté |
| GET/POST | `/api/receipts` | Réceptions | connecté |
| POST | `/api/receipts/:id/validate` | Valider une réception | ADMIN/MANAGER |
| GET/POST | `/api/inventories` | Inventaires | connecté |
| POST | `/api/inventories/:id/validate` | Valider un inventaire | ADMIN/MANAGER |
| GET | `/api/dashboard` | Statistiques | connecté |

Toutes les réponses d'erreur suivent ce format : `{ "error": { "code": "...", "message": "..." } }` (la validation ajoute un champ `details`).

## Base de données

13 tables (gérées par Drizzle ORM, migrations dans `backend/drizzle/`) :

```
users, suppliers, articles, article_suppliers (many-to-many),
warehouses, zones, locations,
stocks, stock_movements,
receipts, receipt_items,
inventories, inventory_items
```

Contraintes : clés primaires et étrangères, UNIQUE (email, référence, code emplacement, couples zone/entrepôt et article/emplacement), CHECK (quantités > 0, statuts, rôles).

## Tests

```bash
cd backend
npm run test
```

**27 tests unitaires** (Vitest) couvrant le §28 du cahier des charges — les repositories et la base sont **mockés** :

- **Authentification (4)** : connexion valide, mauvais mot de passe, utilisateur inexistant, utilisateur désactivé
- **Stock / mouvements (9)** : entrée IN, sortie OUT, sortie > stock disponible, transfert, transfert > stock disponible, transfert vers le même emplacement, quantité non positive, produit désactivé, emplacement désactivé
- **Réceptions (7)** : création, réception vide, référence dupliquée, fournisseur inexistant, validation avec mise à jour du stock (mouvements IN), double validation refusée, quantité reçue nulle
- **Inventaires (7)** : création, inventaire vide, référence dupliquée, emplacement inexistant, calcul des écarts + mouvements ADJUSTMENT, double validation refusée, validation sans articles

## CI / CD

Workflow GitHub Actions (`.github/workflows/ci.yml`) exécuté sur chaque push vers `main` et chaque pull request :

- **Job typecheck** : `npm run typecheck` (backend) + `npx tsc -b --noEmit` (frontend)
- **Job test** : `npm run test` (vitest, backend)

Une PR dont la CI échoue est **bloquée** jusqu'à sa correction.

## Workflow Git

- Développement par module sur une branche dédiée : `feature/<nom>`
- Chaque module est fusionné dans `main` via une **Pull Request** (la CI vérifie typecheck + tests)
- `main` reste toujours dans un état stable et déployable

Historique des modules : auth → articles → fournisseurs → entrepôt → stocks/mouvements → réceptions → inventaires → dashboard → frontend → CI → tests → rôles → utilisateurs → frontend entrepôt → validation (zod) → documentation.