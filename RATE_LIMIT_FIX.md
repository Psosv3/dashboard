# Correction de l'erreur 429 (Rate Limit)

## 🔍 Problème identifié

L'erreur 429 "over_request_rate_limit" se produisait lors de la connexion en raison de **plusieurs appels simultanés** à l'API Supabase :

1. **React Strict Mode** en développement : double-mounting des composants
2. **SupabaseProvider** : appels multiples dans le `useEffect`
3. **Création multiple du client** Supabase à chaque render
4. **Absence de protection** contre les double-clics

## ✅ Solutions implémentées

### Fichiers modifiés
- ✅ `lib/supabase-provider.tsx`
- ✅ `app/auth/login/page.tsx`
- ✅ `app/auth/register/page.tsx`
- ✅ `app/auth/reset-password/page.tsx`
- ✅ `app/auth/forgot-password/page.tsx`

### 1. Protection dans SupabaseProvider (`lib/supabase-provider.tsx`)

#### a) Utilisation de `useMemo` pour le client Supabase
```typescript
const supabase = useMemo(() => createClientComponentClient(), [])
```
✨ Le client n'est créé qu'**une seule fois** au lieu d'être recréé à chaque render.

#### b) Protection contre les double-calls avec `useRef`
```typescript
const initialized = useRef(false)

useEffect(() => {
  if (initialized.current) return
  initialized.current = true
  // ...
}, [])
```
✨ Empêche l'exécution multiple du `useEffect` causée par React Strict Mode.

#### c) Séquencement des appels
- `getUser()` s'exécute **d'abord** au chargement initial
- `onAuthStateChange()` s'initialise **ensuite** pour écouter les changements futurs
✨ Évite les appels simultanés qui causent le rate limit.

### 2. Protection dans tous les formulaires d'authentification

**Fichiers concernés :**
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/reset-password/page.tsx`
- `app/auth/forgot-password/page.tsx`

#### a) Protection contre les double-soumissions
```typescript
if (loading) return
```
✨ Bloque les soumissions multiples du formulaire.

#### b) Cooldown de 2 secondes entre les tentatives
```typescript
const lastAttemptTime = useRef<number>(0)

// Vérification du cooldown
const timeSinceLastAttempt = now - lastAttemptTime.current
if (timeSinceLastAttempt < 2000) {
  toast.error('Veuillez attendre quelques secondes entre chaque tentative')
  return
}
```
✨ Force un délai minimum entre chaque tentative de connexion.

#### c) Gestion spécifique de l'erreur 429
```typescript
if (error.message.includes('rate_limit') || error.message.includes('429')) {
  toast.error('Trop de tentatives. Veuillez attendre 30 secondes avant de réessayer.')
}
```
✨ Message d'erreur clair pour l'utilisateur en cas de rate limit.

## 🧪 Test

1. **Redémarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Essayez de vous connecter** :
   - L'erreur 429 devrait avoir disparu
   - Un seul appel API sera effectué
   - Un cooldown empêche les clics multiples

3. **Vérifiez dans les DevTools** :
   - Ouvrez l'onglet Network
   - Filtrez par "token"
   - Vous devriez voir **un seul appel** POST vers `/auth/v1/token?grant_type=password`

## 📊 Avant vs Après

### Avant
- ❌ 2-4 appels simultanés à `getUser()`
- ❌ Appels multiples à `signInWithPassword()` possibles
- ❌ Client Supabase recréé à chaque render
- ❌ Pas de protection contre les double-clics
- ❌ Erreur 429 fréquente

### Après
- ✅ 1 seul appel à `getUser()` au chargement
- ✅ 1 seul appel à `signInWithPassword()` par tentative
- ✅ Client Supabase créé une seule fois
- ✅ Cooldown de 2 secondes entre les tentatives
- ✅ Gestion gracieuse de l'erreur 429

## 🔧 Si le problème persiste

### 1. Vérifiez les limites de votre projet Supabase
- Connectez-vous à votre [tableau de bord Supabase](https://app.supabase.com)
- Vérifiez les quotas dans Settings > API

### 2. Augmentez le cooldown
Si le problème persiste, augmentez le délai dans `app/auth/login/page.tsx` :
```typescript
if (timeSinceLastAttempt < 5000) { // 5 secondes au lieu de 2
```

### 3. Vérifiez les appels réseau
- Ouvrez les DevTools (F12)
- Onglet Network
- Cherchez tous les appels vers `supabase.co`
- Identifiez les appels multiples

### 4. Désactivez temporairement Strict Mode
Dans `next.config.js`, ajoutez :
```javascript
const nextConfig = {
  reactStrictMode: false, // ⚠️ Uniquement pour tester !
  // ...
}
```
**⚠️ Ne pas faire en production** - Strict Mode aide à détecter les bugs.

## 📝 Notes techniques

- Le rate limit de Supabase Auth est généralement de **6-10 requêtes par minute** par IP
- React Strict Mode en développement monte/démonte les composants **deux fois**
- `useMemo` et `useRef` sont essentiels pour éviter les re-créations inutiles
- Un cooldown côté client améliore l'UX même si le serveur a ses propres limites

## ✨ Améliorations futures possibles

1. **Retry avec backoff exponentiel** : réessayer automatiquement après un délai croissant
2. **État global du rate limit** : mémoriser le dernier rate limit pour bloquer les tentatives
3. **Indicateur visuel** : afficher un compteur de temps restant avant de pouvoir réessayer
4. **Cache du client Supabase** : utiliser un singleton global au lieu de Context

---

*Dernière mise à jour : 17 octobre 2025*

