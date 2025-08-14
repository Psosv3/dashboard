# 📊 Séparation des Statistiques - Dashboard vs Chatbot Externe

## ✨ Fonctionnalités Implémentées

La page des statistiques du dashboard a été mise à jour pour différencier clairement les conversations internes (dashboard) des conversations externes (chatbot). Voici ce qui a été ajouté :

### 🎯 Interface avec Onglets

#### 🏢 Dashboard Interne
- **Sessions internes** : Conversations des utilisateurs authentifiés via le dashboard
- **Utilise** : Tables `chat_sessions` et `chat_messages`
- **Identifiant** : `user_id` (UUID Supabase)
- **Couleur** : Bleu (thème dashboard)

#### 🌐 Chatbot Externe  
- **Sessions publiques** : Conversations des visiteurs via le chatbot externe
- **Utilise** : Tables `public_chat_sessions` et `public_chat_messages`
- **Identifiant** : `external_user_id` (généré automatiquement)
- **Couleur** : Vert (thème externe)

### 📈 Statistiques Séparées

#### Métriques par Type
- **Sessions totales** (Internes/Externes)
- **Messages totaux**
- **Messages utilisateurs**
- **Réponses IA**
- **Moyenne messages/session**

#### Activité Temporelle
- **Aujourd'hui**
- **Cette semaine**
- **Ce mois**
- **Graphiques quotidiens** (30 derniers jours)

#### Utilisateurs les Plus Actifs
- **Dashboard** : Top 5 utilisateurs internes (par `user_id`)
- **Chatbot** : Top 5 utilisateurs externes (par `external_user_id`)

### 📋 Historique des Conversations

#### Visualisation Différenciée
- **Badge couleur** : 🏢 Dashboard (bleu) vs 🌐 Externe (vert)
- **Informations spécifiques** :
  - **Interne** : Utilisateur authentifié
  - **Externe** : ID utilisateur externe + anonyme
- **Messages colorés** :
  - **Interne** : Utilisateur (bleu), Assistant (gris)
  - **Externe** : Visiteur (vert), Assistant (gris)

### 🔄 Filtrage et Recherche

#### Filtres Communs
- **Recherche par titre**
- **Filtre par date**
- **Boutons Filtrer/Réinitialiser**

#### Données Contextuelles
- **Interne** : Utilise `fetchChatSessions()`
- **Externe** : Utilise `fetchPublicChatSessions()`

## 🛠️ Modifications Techniques

### Types TypeScript
```typescript
type PublicChatSession = {
  id: string
  session_id: string
  company_id: string
  external_user_id: string | null
  title: string
  created_at: string
  updated_at: string
  public_chat_messages: PublicChatMessage[]
}

type PublicChatMessage = {
  id: string
  message_id: string
  session_id: string
  content: string
  role: string
  created_at: string
}
```

### Interface StatsData
```typescript
interface StatsData {
  internal: {
    // Statistiques dashboard
    mostActiveUsers: Array<{
      user_id: string
      session_count: number
      message_count: number
    }>
    // ... autres stats
  }
  public: {
    // Statistiques chatbot externe
    mostActiveExternalUsers: Array<{
      external_user_id: string
      session_count: number
      message_count: number
    }>
    // ... autres stats
  }
}
```

### Fonctions de Calcul
- `calculateInternalStats()` : Calculs pour les sessions dashboard
- `calculatePublicStats()` : Calculs pour les sessions chatbot externe
- `fetchPublicChatSessions()` : Récupération des sessions publiques

### Requêtes Supabase
```typescript
// Sessions internes
const { data: internalSessions } = await supabase
  .from('chat_sessions')
  .select(`*, chat_messages (*)`)
  .eq('company_id', profile.company_id)

// Sessions publiques  
const { data: publicSessions } = await supabase
  .from('public_chat_sessions')
  .select(`*, public_chat_messages (*)`)
  .eq('company_id', profile.company_id)
```

## 🎨 Interface Utilisateur

### Onglets de Navigation
```tsx
<div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
  <button className={activeTab === 'internal' ? 'active' : ''}>
    🏢 Dashboard Interne
  </button>
  <button className={activeTab === 'public' ? 'active' : ''}>
    🌐 Chatbot Externe
  </button>
</div>
```

### Badges de Différenciation
- **Sessions internes** : Badge bleu "🏢 Dashboard"
- **Sessions externes** : Badge vert "🌐 Externe"
- **ID utilisateur externe** : Affiché pour traçabilité

### État de l'Application
```tsx
const [activeTab, setActiveTab] = useState<'internal' | 'public'>('internal')
const [publicChatSessions, setPublicChatSessions] = useState<PublicChatSession[]>([])
const [selectedPublicSession, setSelectedPublicSession] = useState<PublicChatSession | null>(null)
```

## 📊 Avantages de la Séparation

### 🔍 Clarté des Données
- **Séparation nette** entre trafic interne et externe
- **Métriques spécifiques** à chaque type d'usage
- **Traçabilité** des utilisateurs externes

### 📈 Analyse Précise
- **ROI dashboard** : Utilisation par les employés
- **Engagement externe** : Adoption par les visiteurs
- **Comparaison** des comportements d'usage

### 🎯 Optimisation Ciblée
- **Dashboard** : Améliorer l'expérience employé
- **Chatbot** : Optimiser la conversion visiteurs
- **Ressources** : Allocation selon l'usage réel

## 🚀 Utilisation

### Navigation
1. **Aller** sur `/dashboard/stats`
2. **Cliquer** sur l'onglet désiré (Interne/Externe)
3. **Consulter** les statistiques spécifiques
4. **Filtrer** les conversations par date/titre
5. **Explorer** les détails des conversations

### Export
- **Bouton Export** : Adapte les données selon l'onglet actif
- **Données exportées** : Sessions + statistiques du type sélectionné

## 🎉 Résultat

Vous disposez maintenant d'une **vue d'ensemble complète** avec :
- ✅ **Statistiques séparées** pour dashboard vs chatbot externe
- ✅ **Interface intuitive** avec onglets et badges colorés
- ✅ **Historique détaillé** avec informations contextuelles
- ✅ **Métriques précises** pour chaque type d'interaction
- ✅ **Traçabilité complète** des utilisateurs internes et externes

Cette séparation permet une **analyse fine** de l'utilisation et aide à **optimiser** chaque canal d'interaction selon ses spécificités.
