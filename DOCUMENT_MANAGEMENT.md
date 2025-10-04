# Gestion des Documents

## 📋 Vue d'ensemble

Le système de gestion des documents permet désormais d'**éditer les fichiers DOCX** et de **visualiser les fichiers PDF** directement depuis le dashboard, sans avoir à télécharger les fichiers.

## ✨ Fonctionnalités

### 1. Édition de fichiers DOCX

- **Bouton "Modifier"** : Disponible pour tous les fichiers DOCX
- Ouvre un éditeur de texte modal avec le contenu du document
- Permet de modifier le texte directement dans le navigateur
- Sauvegarde les modifications dans le fichier backend
- **Rebuild automatique** : L'index RAG est reconstruit automatiquement après la sauvegarde

#### Comment utiliser :
1. Trouvez votre fichier DOCX dans la liste des documents
2. Cliquez sur l'icône **crayon** (Modifier)
3. Modifiez le contenu dans l'éditeur
4. Cliquez sur **"Sauvegarder"**
5. L'index sera reconstruit automatiquement pour prendre en compte les modifications

### 2. Visualisation de fichiers PDF

- **Bouton "Visualiser"** : Disponible pour tous les fichiers PDF
- Ouvre un viewer PDF modal intégré
- Permet de parcourir le document sans téléchargement
- Option de téléchargement disponible dans le viewer

#### Comment utiliser :
1. Trouvez votre fichier PDF dans la liste des documents
2. Cliquez sur l'icône **œil** (Visualiser)
3. Parcourez le document dans le viewer
4. (Optionnel) Cliquez sur **"Télécharger"** pour sauvegarder le fichier

## 🔧 Architecture technique

### Backend (FastAPI)

#### Nouveaux endpoints :

1. **GET `/documents/{filename}/content`**
   - Récupère le contenu textuel d'un fichier DOCX
   - Authentification requise (JWT token)
   - Retourne le texte formaté du document

2. **PUT `/documents/{filename}/content`**
   - Met à jour le contenu d'un fichier DOCX
   - Authentification requise (JWT token)
   - Reconstruit automatiquement l'index RAG
   - Vide le cache Redis pour la company_id

3. **GET `/documents/{filename}/view`**
   - Stream un fichier PDF pour visualisation
   - Authentification requise (JWT token)
   - Retourne le fichier PDF en format binaire

### Frontend (Next.js)

#### Nouvelles routes API :

1. **`/api/rag/document-content`** (GET & PUT)
   - Proxifie les appels vers le backend RAG
   - Gère l'authentification Supabase
   - Transmet le JWT token au backend

2. **`/api/rag/document-view`** (GET)
   - Proxifie les appels vers le backend RAG
   - Stream le PDF vers le frontend

#### Nouveaux composants :

1. **`DocumentEditor.tsx`**
   - Modal d'édition pour fichiers DOCX
   - Textarea grande taille pour l'édition
   - Compteur de caractères
   - Loading states et gestion d'erreurs

2. **`PDFViewer.tsx`**
   - Modal de visualisation pour fichiers PDF
   - Utilise un iframe pour afficher le PDF
   - Bouton de téléchargement intégré
   - Loading states et gestion d'erreurs

3. **`FileManager.tsx`** (mis à jour)
   - Ajout des boutons "Modifier" et "Visualiser"
   - Gestion des états des modals
   - Intégration des nouveaux composants

## 🔐 Sécurité

- ✅ Tous les endpoints nécessitent une authentification JWT
- ✅ Vérification que l'utilisateur appartient bien à la company_id du fichier
- ✅ Validation des types de fichiers (seuls DOCX et PDF acceptés)
- ✅ Gestion des erreurs et messages appropriés

## 📝 Notes importantes

1. **Reconstruction de l'index** : Après modification d'un fichier DOCX, l'index RAG est reconstruit automatiquement en arrière-plan. Cela peut prendre quelques instants.

2. **Cache** : Le cache Redis est vidé automatiquement après modification pour garantir que les nouvelles données soient utilisées immédiatement.

3. **Format DOCX** : L'éditeur préserve uniquement le texte simple. Les formatages complexes (tableaux, images, styles) ne sont pas conservés lors de la sauvegarde.

4. **Taille des fichiers** : Les fichiers PDF volumineux peuvent prendre du temps à charger dans le viewer.

## 🚀 Utilisation

### Exemple de flux de travail :

```
1. Upload d'un fichier DOCX
   ↓
2. Construction de l'index RAG
   ↓
3. Modification du contenu via l'éditeur
   ↓
4. Sauvegarde automatique
   ↓
5. Reconstruction automatique de l'index
   ↓
6. Les nouvelles informations sont disponibles dans le chatbot
```

## 🎨 Interface utilisateur

- **Icône crayon bleu** = Modifier (pour DOCX)
- **Icône œil violet** = Visualiser (pour PDF)
- **Icône corbeille rouge** = Supprimer

Les boutons apparaissent uniquement pour les types de fichiers appropriés.

## 🐛 Troubleshooting

### Problème : "Erreur lors du chargement du document"
**Solution** : Vérifiez que le fichier existe bien dans le dossier `data/company_{id}` du backend

### Problème : "Erreur lors de la sauvegarde"
**Solution** : Vérifiez que vous avez les permissions nécessaires et que votre session n'a pas expiré

### Problème : Le PDF ne s'affiche pas
**Solution** : Certains navigateurs bloquent les iframes. Vérifiez vos paramètres de navigateur ou utilisez le bouton "Télécharger"

