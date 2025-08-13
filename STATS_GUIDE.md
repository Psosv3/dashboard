# Guide des Statistiques et Historique des Chats

## Vue d'ensemble

La page de statistiques (`/dashboard/stats`) fournit une analyse complète des conversations de chatbot pour votre entreprise. Elle permet de suivre l'activité, analyser les tendances et exporter les données pour des analyses plus approfondies.

## Fonctionnalités

### 📊 Tableau de Bord des Statistiques

#### Métriques Principales
- **Total Sessions** : Nombre total de conversations initiées
- **Total Messages** : Somme de tous les messages échangés
- **Messages Utilisateurs** : Nombre de questions posées
- **Réponses IA** : Nombre de réponses générées par l'assistant

#### Statistiques Temporelles
- **Activité Aujourd'hui** : Sessions créées dans les dernières 24h
- **Activité Cette Semaine** : Sessions des 7 derniers jours
- **Activité Ce Mois** : Sessions du mois en cours
- **Moyenne Messages/Session** : Indicateur d'engagement

#### Utilisateurs les Plus Actifs
- Classement des 5 utilisateurs les plus actifs
- Nombre de sessions et messages par utilisateur
- Identification anonymisée par ID utilisateur

### 📈 Graphiques d'Activité

#### Sessions Quotidiennes
- Graphique en barres des 14 derniers jours
- Visualisation des tendances d'utilisation
- Tooltips avec détails par jour

#### Messages Quotidiens
- Volume de messages par jour
- Permet d'identifier les pics d'activité
- Corrélation avec les sessions

### 📋 Historique des Conversations

#### Fonctionnalités de Recherche
- **Recherche par titre** : Filtrage des conversations
- **Filtre par date** : Sélection d'une journée spécifique
- **Boutons de contrôle** : Appliquer/Réinitialiser les filtres

#### Affichage des Conversations
- Liste chronologique inversée (plus récentes en premier)
- Informations par session :
  - Titre de la conversation
  - Date et heure de création
  - Nombre total de messages
  - Bouton "Voir détails"

#### Détails des Messages
- Affichage complet des échanges
- Messages utilisateur (bleu, alignés à droite)
- Messages assistant (gris, alignés à gauche)
- Horodatage de chaque message
- Zone scrollable pour les longues conversations

### 📤 Export des Données

#### Format CSV
- Export simplifié pour analyse dans Excel/Google Sheets
- Colonnes : ID Session, Titre, Date, Utilisateur, Nb Messages, etc.
- Nom de fichier automatique avec date

#### Format JSON
- Export complet incluant tous les messages
- Structure préservée pour réimport ou analyse technique
- Métadonnées et statistiques incluses

## Sécurité et Confidentialité

### Row Level Security (RLS)
- Isolation complète par entreprise (`company_id`)
- Les utilisateurs ne voient que les données de leur organisation
- Politique Supabase appliquée au niveau base de données

### Anonymisation
- IDs utilisateurs tronqués dans l'interface
- Pas d'exposition d'informations personnelles
- Respect des bonnes pratiques de confidentialité

## Structure Technique

### Tables Utilisées
```sql
-- Sessions de chat
chat_sessions (id, company_id, user_id, title, created_at, updated_at)

-- Messages des conversations
chat_messages (id, session_id, content, role, created_at)

-- Profils utilisateurs (pour la jointure)
user_profiles (id, user_id, company_id, role)
```

### Composants React
- `StatsPage` : Page principale avec logique métier
- `StatsChart` : Composant de graphique simple en barres
- `ExportButton` : Gestion des exports CSV/JSON
- `DashboardLayout` : Layout avec navigation mise à jour

### APIs et Requêtes
- Requêtes Supabase avec jointures optimisées
- Calculs statistiques côté client
- Pagination et filtrage dynamique

## Utilisation

### Accès
1. Connectez-vous au dashboard
2. Cliquez sur "📈 Statistiques" dans le menu latéral
3. La page charge automatiquement les données de votre entreprise

### Navigation
- Consultez les métriques en haut de page
- Explorez les graphiques pour les tendances
- Utilisez les filtres pour l'historique détaillé
- Exportez les données si nécessaire

### Optimisations
- Les données sont mises en cache côté client
- Requêtes optimisées avec index base de données
- Chargement progressif pour les grandes entreprises

## Développement

### Ajout de Nouvelles Métriques
1. Modifier l'interface `StatsData` dans `page.tsx`
2. Ajouter le calcul dans `fetchStatsData()`
3. Créer le composant d'affichage correspondant

### Personnalisation des Graphiques
- Modifier `StatsChart.tsx` pour de nouveaux types
- Ajouter des couleurs, animations ou interactivité
- Intégrer des bibliothèques de graphiques si nécessaire

### Extension des Exports
- Ajouter de nouveaux formats dans `ExportButton.tsx`
- Personnaliser les données exportées
- Implémenter la compression pour les gros volumes

## Support

Pour des questions techniques ou des demandes d'amélioration, consultez :
- Documentation Supabase pour les requêtes
- Guide Next.js pour les composants
- API React pour les hooks de state
