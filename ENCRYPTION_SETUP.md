# Configuration du Décryptage des Messages

## Variables d'environnement requises

Pour que le décryptage des messages fonctionne, vous devez configurer la variable d'environnement suivante :

### `CHATBOT_KEK_V1_B64`

Cette variable doit contenir la clé de chiffrement AES-256 encodée en base64, identique à celle utilisée par le backend Python.

**Important** : Cette variable doit être accessible par le serveur Next.js (pas de préfixe `NEXT_PUBLIC_`).

## Configuration

### 1. Fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet `dashboard_chatbot/` avec le contenu suivant :

```env
# Clé de chiffrement pour le décryptage des messages
CHATBOT_KEK_V1_B64=votre_clé_base64_ici

# Autres variables Supabase (si nécessaire)
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

### 2. Production

En production, assurez-vous que la variable `CHATBOT_KEK_V1_B64` est configurée dans les variables d'environnement de votre plateforme d'hébergement (Vercel, etc.).

## Fonctionnement

Le système de décryptage fonctionne comme suit :

1. **Bibliothèque crypto** (`lib/crypto.ts`) : Contient les fonctions de décryptage utilisant AES-256-GCM
2. **API Route** (`app/api/decrypt/route.ts`) : Endpoint sécurisé qui décrypte les messages
3. **Page Stats** (`app/dashboard/stats/page.tsx`) : Appelle l'API pour décrypter les messages avant affichage

## Sécurité

- La clé de chiffrement n'est jamais exposée au client
- Le décryptage est effectué côté serveur (API Route)
- L'authentification est requise pour accéder à l'API de décryptage
- En cas d'erreur de décryptage, le message original est affiché (fallback)

## Vérification

Pour vérifier que tout fonctionne correctement :

1. Assurez-vous que `CHATBOT_KEK_V1_B64` est définie
2. Redémarrez le serveur Next.js : `npm run dev`
3. Accédez à la page des statistiques
4. Les messages devraient s'afficher déchiffrés

Si vous voyez des messages chiffrés (base64), vérifiez :
- Que la variable d'environnement est correctement définie
- Que la clé est identique à celle du backend Python
- Les logs du serveur pour d'éventuelles erreurs

