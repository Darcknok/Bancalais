# Équipe Préparation Session de Test

## Responsabilités
- Build et distribution de l'APK de test
- Communication avec les testeurs
- Gestion des versions de test
- Support testeurs

## Tâches restantes

### Priorité Haute
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
- [ ] **Changelog** : créer un fichier CHANGELOG.md retraçant les versions

### Priorité Moyenne
- [ ] **Corrections post-test** : appliquer les correctifs remontés par les testeurs
- [ ] **Support testeurs** : créer une adresse email ou un groupe de discussion pour les retours

### Priorité Faible
- [ ] **Améliorations** : compiler la liste des améliorations suggérées pour la version suivante

## Contacts / Références
- EAS Build : accessible via `eas` CLI
- Dashboard Supabase : https://supabase.com/dashboard
- Backend : `http://192.168.1.60:4000` (dev)

## Planning
| Étape | Date | Responsable |
|-------|------|-------------|
| Session de test | ~juillet 2026 | Équipe QA + testeurs |
| Corrections post-test | 1 semaine après | Équipe Dev |
| Prochaine itération | À définir | Toutes les équipes |
