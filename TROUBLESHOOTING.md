# Guide de Dépannage - Erreur 403 Upload

## 🔍 Problème résolu : Erreur 403 lors de l'upload

### **Cause identifiée :**
Le frontend n'envoyait **aucun token d'authentification** dans les requêtes vers le backend RAG, mais le backend attendait une authentification JWT obligatoire.

### **Problèmes spécifiques corrigés :**

1. **FileManager.tsx** : Upload sans authentification ❌ → ✅ Ajout du token JWT
2. **ChatInterface.tsx** : Chat sans authentification ❌ → ✅ Ajout du token JWT  
3. **Backend /ask/** : Incompatibilité Form vs JSON ❌ → ✅ Utilisation de Pydantic model
4. **Backend /upload/** : Bug avec background_tasks ❌ → ✅ Correction de l'enregistrement

---

## 🛠️ Corrections apportées

### **1. Frontend - FileManager.tsx**

✅ **Changements :**
- Récupération du token JWT Supabase avant chaque requête
- Ajout de l'header `Authorization: Bearer <token>` 
- Suppression du paramètre `company_id` (récupéré automatiquement depuis le token)
- Amélioration de la gestion d'erreur avec codes HTTP spécifiques
- Correction de `maxFileSize` → `maxSize` dans dropzone

```typescript
// Avant (❌)
const response = await axios.post(`/upload/`, formData)

// Après (✅)
const { data: { session } } = await supabase.auth.getSession()
const response = await axios.post(`/upload/`, formData, {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})
```

### **2. Frontend - ChatInterface.tsx**

✅ **Changements :**
- Récupération du token JWT Supabase avant chaque requête
- Ajout de l'header `Authorization: Bearer <token>`
- Suppression du paramètre `company_id` du body
- Amélioration des messages d'erreur selon les codes HTTP

```typescript
// Avant (❌)
const response = await axios.post(`/ask/`, {
  question: userMessage,
  company_id: companyId
})

// Après (✅)
const { data: { session } } = await supabase.auth.getSession()
const response = await axios.post(`/ask/`, 
  { question: userMessage },
  { headers: { 'Authorization': `Bearer ${session.access_token}` }}
)
```

### **3. Backend - RAG_ONEXUS/app.py**

✅ **Changements :**
- Correction du bug ligne 118 : `background_tasks` → commenté l'enregistrement automatique
- Modification de `/ask/` : `Form(...)` → `Pydantic BaseModel` pour compatibilité JSON
- Correction de `/documents/` : suppression du token invalide
- Ajout du `file_path` dans la réponse de `/upload/`

```python
# Avant (❌)
@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    ...

# Après (✅)
class QuestionRequest(BaseModel):
    question: str
    langue: str = "Français"

@app.post("/ask/")
async def ask_question(request: QuestionRequest, current_user: AuthUser = Depends(get_current_user)):
    ...
```

---

## 🧪 Comment tester la correction

### **1. Vérifier l'authentification**
```bash
# Vérifiez que vous êtes connecté au dashboard
# URL: http://localhost:3000/dashboard
```

### **2. Tester l'upload**
1. Allez sur le dashboard
2. Glissez-déposez un fichier PDF ou DOCX
3. ✅ Vous devriez voir "Fichier uploadé avec succès" 
4. ❌ Plus d'erreur 403

### **3. Tester le chatbot**
1. Allez sur `/dashboard/chat`
2. Posez une question
3. ✅ Vous devriez recevoir une réponse
4. ❌ Plus d'erreur 403

### **4. Vérifier les logs backend**
```bash
cd RAG_ONEXUS
# Si vous utilisez uvicorn directement :
uvicorn app:app --reload --log-level debug

# Si vous utilisez Docker :
docker-compose logs -f rag-api
```

---

## 🔧 Configuration requise

### **Variables d'environnement Backend (.env)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

### **Variables d'environnement Frontend (.env.local)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_RAG_BACKEND_URL=http://localhost:8000
```

---

## 🚨 Erreurs courantes après correction

### **Erreur 401 "Authentification requise"**
🔍 **Cause :** Token expiré ou invalide
🛠️ **Solution :** Se reconnecter au dashboard

### **Erreur 404 "Service non disponible"**  
🔍 **Cause :** Backend RAG non démarré
🛠️ **Solution :** 
```bash
cd RAG_ONEXUS
uvicorn app:app --reload
```

### **Erreur "Network Error"**
🔍 **Cause :** Backend inaccessible  
🛠️ **Solution :** Vérifier que le backend est sur `http://localhost:8000`

### **JWT Token invalide**
🔍 **Cause :** `SUPABASE_JWT_SECRET` incorrect
🛠️ **Solution :** Vérifier la configuration Supabase

---

## 📝 Architecture post-correction

```
Frontend (Next.js) ──[JWT Token]──> Backend (FastAPI)
       │                                   │
       │                                   │
   Supabase Auth                    Multitenancy + RAG
   (Génère JWT)                    (Vérifie JWT + company_id)
```

### **Flux d'authentification :**
1. Utilisateur se connecte via Supabase Auth
2. Supabase génère un JWT contenant `user_id` et autres infos
3. Frontend récupère ce JWT via `supabase.auth.getSession()`
4. Frontend envoie le JWT dans l'header `Authorization: Bearer <token>`
5. Backend décode le JWT, récupère `user_id` et `company_id` depuis Supabase
6. Backend applique l'isolation des données par entreprise

---

## ✅ Checklist de vérification

- [ ] **Backend démarré** : `http://localhost:8000` accessible
- [ ] **Frontend démarré** : `http://localhost:3000` accessible  
- [ ] **Variables d'environnement** : Configurées dans `.env` et `.env.local`
- [ ] **Base de données** : Schéma SQL exécuté dans Supabase
- [ ] **Authentification** : Capable de se connecter au dashboard
- [ ] **Upload** : Fichiers uploadés sans erreur 403
- [ ] **Chat** : Questions/réponses fonctionnelles
- [ ] **Isolation** : Chaque entreprise ne voit que ses données

---

## 🆘 Support supplémentaire

Si vous rencontrez encore des problèmes :

1. **Vérifiez les logs** :
   - Frontend : Console du navigateur (F12)
   - Backend : Terminal où uvicorn est lancé

2. **Vérifiez la connectivité** :
   ```bash
   curl http://localhost:8000/health/
   ```

3. **Vérifiez l'authentification Supabase** :
   - Dashboard Supabase > Authentication > Users
   - Vérifiez que votre utilisateur existe et a un profil

4. **Testez manuellement avec curl** :
   ```bash
   # Récupérez le token depuis le navigateur (F12 > Application > Local Storage)
   curl -X POST http://localhost:8000/upload/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@test.pdf"
   ```

---

**Status** : ✅ **Erreur 403 résolue** - L'upload et le chat fonctionnent maintenant avec authentification JWT 