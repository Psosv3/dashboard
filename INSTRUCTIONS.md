# Instructions de Configuration - Dashboard Chatbot RAG

## 🚀 Démarrage Rapide

### 1. Configuration Supabase

1. **Créer un projet Supabase :**
   - Allez sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet
   - Notez votre URL et votre clé anonyme

2. **Exécuter le schéma SQL :**
   - Ouvrez l'éditeur SQL dans Supabase
   - Copiez tout le contenu de `database/schema.sql`
   - Exécutez le script

3. **Configurer les variables d'environnement :**
   - Modifiez `.env.local` avec vos vraies valeurs Supabase
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   ```

### 2. Préparer votre Backend RAG Python

Votre backend Python doit être modifié pour supporter la multi-tenancy. 

**Exemple d'adaptation pour FastAPI :**

```python
from fastapi import FastAPI, UploadFile, File, Form
import os
import shutil

app = FastAPI()

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), company_id: str = Form(...)):
    # Créer un dossier par entreprise
    company_folder = f"data/{company_id}/"
    os.makedirs(company_folder, exist_ok=True)
    
    # Sauvegarder le fichier dans le dossier de l'entreprise
    file_path = f"{company_folder}{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"success": True, "file_path": file_path}

@app.post("/build_index")
async def build_index(request: dict):
    company_id = request.get("company_id")
    company_folder = f"data/{company_id}/"
    
    # Votre logique de construction d'index ici
    # Limitée aux fichiers de company_folder
    
    return {"success": True}

@app.post("/ask/")
async def ask_question(request: dict):
    question = request.get("question")
    company_id = request.get("company_id")
    
    # Votre logique RAG ici
    # Utiliser seulement l'index de cette entreprise
    
    return {"answer": "Votre réponse ici..."}
```

### 3. Lancer l'application

```bash
# Démarrer le backend RAG (dans un terminal séparé)
python your_rag_backend.py

# Démarrer le frontend Next.js
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📝 Notes Importantes

### Warnings sur les packages Supabase
Les helpers Supabase utilisés sont dépréciés mais fonctionnent encore. Pour la production, considérez migrer vers `@supabase/ssr`.

### Structure des données
- Chaque entreprise a son propre dossier dans `data/{company_id}/`
- Les fichiers sont isolés par `company_id`
- L'authentification assure que chaque utilisateur ne voit que ses données

### Sécurité
- Row Level Security (RLS) est activé automatiquement
- Chaque utilisateur ne peut accéder qu'aux données de son entreprise
- Les politiques de sécurité sont définies dans le schéma SQL

## 🔧 Développement

### Ajouter de nouvelles fonctionnalités
1. Créez de nouveaux composants dans `components/`
2. Ajoutez des pages dans `app/dashboard/`
3. Modifiez le schéma si besoin dans `database/schema.sql`

### Tests
- Créez plusieurs comptes avec différentes entreprises
- Vérifiez l'isolation des données
- Testez l'upload et le chatbot

## 🆘 Résolution de problèmes

### Erreurs communes
1. **"Cannot connect to Supabase"** : Vérifiez vos variables d'environnement
2. **"RAG backend error"** : Assurez-vous que votre backend Python fonctionne sur le port 8000
3. **"No documents found"** : Vérifiez que les fichiers sont bien uploadés et que l'index est construit

### Debugging
- Vérifiez les logs de la console browser
- Utilisez l'onglet Network pour voir les requêtes API
- Vérifiez les logs de votre backend RAG

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez cette documentation
2. Consultez les logs
3. Vérifiez la configuration Supabase
4. Testez votre backend RAG indépendamment 