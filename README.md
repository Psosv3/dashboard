# Dashboard Chatbot RAG Multi-Tenant

Un dashboard de gestion pour chatbots IA avec RAG (Retrieval-Augmented Generation) supportant la multi-tenancy par entreprise.

## 🚀 Fonctionnalités

- **Multi-tenant** : Isolation complète des données par entreprise
- **Authentification sécurisée** avec Supabase Auth
- **Gestion de fichiers** : Upload de PDF et DOCX
- **RAG Backend** : Intégration avec votre backend Python existant
- **Chatbot intégré** : Interface conversationnelle pour chaque entreprise
- **Dashboard complet** : Statistiques et gestion des documents

## 🏗️ Architecture

```
Frontend (Next.js 14)
├── Dashboard de gestion
├── Authentification (Supabase)
├── Upload et gestion de fichiers
└── Interface chatbot

Backend RAG (Python) - Existant
├── /upload/ - Upload de fichiers
├── /build_index - Construction d'index
└── /ask/ - Questions au chatbot

Base de données (Supabase)
├── Gestion des utilisateurs
├── Isolation par entreprise
└── Historique des conversations
```

## 📦 Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd dashboard-chatbot
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Exécutez le schéma SQL :
   ```bash
   # Copiez le contenu de database/schema.sql dans l'éditeur SQL de Supabase
   ```

### 4. Variables d'environnement

Créez un fichier `.env.local` :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# RAG Backend Configuration
RAG_BACKEND_URL=http://localhost:8000

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 5. Modifier votre Backend RAG

Votre backend Python doit être modifié pour supporter la multi-tenancy :

#### A. Endpoint `/upload/`
```python
@app.post("/upload/")
async def upload_file(file: UploadFile, company_id: str):
    # Créer un dossier par entreprise
    company_folder = f"data/{company_id}/"
    os.makedirs(company_folder, exist_ok=True)
    
    # Sauvegarder le fichier dans le dossier de l'entreprise
    file_path = f"{company_folder}{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"success": True, "file_path": file_path}
```

#### B. Endpoint `/build_index`
```python
@app.post("/build_index")
async def build_index(request: dict):
    company_id = request.get("company_id")
    company_folder = f"data/{company_id}/"
    
    # Construire l'index seulement pour cette entreprise
    # Votre logique de RAG ici, limitée aux fichiers de company_folder
    
    return {"success": True}
```

#### C. Endpoint `/ask/`
```python
@app.post("/ask/")
async def ask_question(request: dict):
    question = request.get("question")
    company_id = request.get("company_id")
    
    # Utiliser seulement l'index de cette entreprise
    # Votre logique RAG ici
    
    return {"answer": "..."}
```

### 6. Lancer l'application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🎯 Utilisation

### 1. Création de compte
- Visitez `http://localhost:3000`
- Créez un compte avec le nom de votre entreprise
- Confirmez votre email

### 2. Gestion des documents
- Uploadez vos fichiers PDF ou DOCX
- Construisez l'index RAG
- Les documents sont isolés par entreprise

### 3. Chatbot
- Accédez à l'interface chatbot
- Posez des questions basées sur vos documents
- L'IA répond uniquement avec vos données

## 🔧 Développement

### Structure du projet

```
dashboard-chatbot/
├── app/                    # Pages Next.js 14 (App Router)
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Pages du dashboard
│   └── globals.css        # Styles globaux
├── components/            # Composants React
├── lib/                   # Utilitaires et configuration
├── types/                 # Types TypeScript
├── database/              # Schémas SQL
└── public/               # Fichiers statiques
```

### Scripts disponibles

```bash
npm run dev       # Développement
npm run build     # Build de production
npm run start     # Serveur de production
npm run lint      # Linting
```

## 🛡️ Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Isolation des données** par entreprise
- **Authentification JWT** avec Supabase
- **Validation des fichiers** (types et taille)

## 🎨 Interface

- **Design moderne** avec Tailwind CSS
- **Responsive** pour mobile et desktop
- **Interface intuitive** pour la gestion des fichiers
- **Chatbot intégré** avec historique des conversations

## 📊 Base de données

Les tables principales :
- `companies` : Données des entreprises
- `user_profiles` : Profils utilisateurs avec rôles
- `documents` : Fichiers uploadés par entreprise
- `chat_sessions` : Sessions de conversation
- `chat_messages` : Messages du chatbot

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus d'informations.

## 🆘 Support

- Ouvrez une issue pour les bugs
- Consultez la documentation Supabase
- Vérifiez que votre backend RAG fonctionne correctement

---

**Note** : Ce dashboard est conçu pour fonctionner avec votre backend RAG Python existant. Assurez-vous de modifier les endpoints pour supporter la séparation par entreprise (`company_id`). 