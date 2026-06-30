# Équipe Publication & Communication

## Responsabilités
- Publication de l'application (App Store, Google Play, ou distribution directe)
- Communication avec les testeurs
- Gestion des versions et releases
- Support utilisateur

## Tâches restantes

### Priorité Haute — Préparation session de test
- [ ] **Build APK** : générer un APK signé via EAS Build
  ```bash
  eas build --platform android --profile preview
  ```
- [ ] **Distribution** : envoyer l'APK aux testeurs (lien EAS ou fichier .apk)
- [ ] **Instructions de test** : rédiger un email/message avec :
  - Lien de téléchargement de l'APK
  - Identifiants de test (si nécessaire)
  - Fonctionnalités à tester en priorité
  - Comment remonter un bug (capture d'écran + description)

### Priorité Haute — Avant lancement public
- [ ] **Compte développeur** : vérifier le compte EAS/Expo pour le déploiement
- [ ] **Configuration production** :
  - Désactiver le bypass des rôles admin dans `backend/src/middleware/auth.ts`
  - Configurer le vrai JWT_SECRET en variable d'environnement
  - Vérifier les CORS pour le domaine de production
- [ ] **Serveur de production** : préparer le déploiement du backend (VPS, Railway, ou autre)
- [ ] **Nom de domaine** : choisir et configurer le nom de domaine pour l'API

### Priorité Moyenne
- [ ] **Changelog** : créer un fichier CHANGELOG.md retraçant les versions
- [ ] **Google Play Console** : préparer la fiche de l'application (si déploiement public)
- [ ] **Support** : créer une adresse email de support (support@bancalais.fr)
- [ ] **Analytics** : ajouter un outil d'analytics basique (combien d'utilisateurs, quels écrans)

### Priorité Faible
- [ ] **Site vitrine** : déployer une page d'accueil pour Bancalais (si pas déjà fait)
- [ ] **Réseaux sociaux** : créer un compte Instagram/X pour Bancalais
- [ ] **Communauté** : configurer un serveur Discord pour les testeurs/utilisateurs

## Contacts / Références
- EAS Build : accessible via `eas` CLI
- Dashboard Supabase : https://supabase.com/dashboard
- Backend : `http://192.168.1.60:4000` (dev) / à définir (prod)

## Planning suggéré
| Étape | Date | Responsable |
|-------|------|-------------|
| Session de test | ~juillet 2026 | Équipe QA + testeurs |
| Corrections post-test | 1 semaine après | Équipe Dev |
| Préprod | 2 semaines avant lancement | Équipe Dev + Com |
| Lancement public | Août 2026 | Toutes les équipes |
