# Configuration Multitenancy - API RAG

## Variables d'environnement requises

Créez un fichier `.env` dans le répertoire racine avec les variables suivantes :

```bash
# Configuration Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Configuration OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Configuration Mistral
MISTRAL_API_KEY=your_mistral_api_key_here

# Configuration serveur
DATA_DIR=data
HOST=0.0.0.0
PORT=8000

# Configuration CORS (pour la production)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Installation

1. Installer les dépendances :
```bash
pip install -r requirements.txt
```

2. Configurer Supabase :
   - Créer un projet Supabase
   - Exécuter le schéma SQL fourni dans `database/schema.sql`
   - Récupérer les clés API depuis le dashboard Supabase

3. Configurer les variables d'environnement dans le fichier `.env`

4. Lancer le serveur :
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Structure des données

### Organisation par entreprise

Les données sont automatiquement isolées par entreprise (`company_id`) :

- **Documents** : Stockés dans `data/company_{company_id}/`
- **Index vectoriels** : Stockés dans `data/indexes/company_{company_id}/`
- **Cache** : Isolé par entreprise en mémoire

### Authentification

- Utilise JWT Supabase
- Récupère automatiquement le `company_id` de l'utilisateur
- Vérifie les permissions (admin/user)

## Utilisation

### Authentification requise

Tous les endpoints (sauf `/` et `/health/`) nécessitent un token JWT :

```bash
Authorization: Bearer your_jwt_token_here
```

### Endpoints disponibles

- `POST /upload/` - Upload de fichiers (isolation automatique par entreprise)
- `POST /build_index/` - Construction d'index (pour votre entreprise)
- `POST /ask/` - Questions RAG (sur vos documents uniquement)
- `GET /stats/` - Statistiques de votre entreprise
- `GET /documents/` - Liste de vos documents
- `DELETE /clear_cache/` - Vider le cache (admin uniquement)

### Client Python

Utilisez `exemple-usage-multitenancy.py` pour tester l'API avec authentification.

## Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Isolation complète des données entre entreprises
- Validation JWT sur chaque requête
- Permissions par rôle (admin/user) 