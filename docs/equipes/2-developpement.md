# Équipe Développement

## Responsabilités
- Backend API Express/TypeScript
- Base de données Supabase (PostgreSQL)
- Scraper LiveFFN (cheerio)
- Frontend mobile Expo (React Native)
- Déploiement et CI/CD

## Tâches restantes

### Priorité Critique
- [ ] **Migration Supabase** : exécuter `backend/migrations/003_race_feedback.sql` dans le dashboard Supabase
- [ ] **Redémarrer le backend** après la migration (`cd backend && npm run dev`)
- [ ] **Rebuild APK** : `eas build --platform android --profile preview`

### Priorité Haute
- [ ] **Admin routes** : activer le vrai rôle guard en production (actuellement bypassé en dev dans `middleware/auth.ts`)
- [ ] **JWT secret** : remplacer le fallback `'fallback-dev-secret-do-not-use-in-prod'` par une vraie variable d'environnement
- [ ] **Sécurité** : vérifier que le CORS est correctement configuré pour la prod (actuellement `origin: true`)
- [ ] **Race-feedback** : tester le flux complet API + AsyncStorage
- [ ] **Auto-refresh planning** : vérifier que le polling 3 min fonctionne correctement en production

### Priorité Moyenne
- [ ] **Tests backend** : ajouter des tests pour les routes feedback et liveffn
- [ ] **Gestion d'erreurs** : améliorer les messages d'erreur côté frontend (toasts plutôt que Alert)
- [ ] **Cache** : implémenter un cache persistant (AsyncStorage) pour les résultats LiveFFN côté mobile
- [ ] **RaceCard** : ajouter le numéro de série/place du nageur dans l'affichage
- [ ] **Notifications** : vérifier que les notifications push fonctionnent (si configurées)

### Priorité Faible
- [ ] **Site web Next.js** : déployer le site si existant dans `website/`
- [ ] **Logs** : ajouter un système de logging structuré (winston/pino)
- [ ] **Scripts** : créer un script `npm run migrate` pour exécuter les migrations Supabase automatiquement

## Fichiers clés
- `backend/src/` — tout le backend
- `src/app/` — frontend mobile
- `backend/migrations/` — SQL migrations
- `backend/src/middleware/auth.ts` — auth et guards
