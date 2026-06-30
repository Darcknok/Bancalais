# Équipe Inspection (QA / Test)

## Responsabilités
- Tests fonctionnels de l'application mobile
- Tests de régression avant chaque build
- Vérification de la cohérence des données LiveFFN
- Rapports de bugs

## Tâches restantes

### Priorité Haute — Tests du parcours complet
- [ ] **Inscription** : créer un compte nageur → vérifier que le rôle est bien 'swimmer' (pas de choix)
- [ ] **Connexion** : se connecter → accueil avec compétitions
- [ ] **Planning LiveFFN** : sélectionner un nageur → planning avec épreuves filtrées
- [ ] **Annotations session** : vérifier que les annotations (ouverture portes, etc.) n'apparaissent que pour les sessions du nageur
- [ ] **RaceCard** : cliquer sur une course → écran feedback → saisir du texte → sauvegarder → vérifier le badge "Sauvegardé"
- [ ] **Recharge planning** : vérifier l'auto-refresh 3 min (badge "Live" vert)

### Priorité Haute — Tests de régression
- [ ] **Mode déconnecté** : fermer/rouvrir l'app sans réseau → vérifier le comportement
- [ ] **Changement de thème** : basculer dark/light → tous les écrans lisibles
- [ ] **Planning sans nageur** : accéder au planning sans ID → doit rediriger
- [ ] **Compétition sans LiveFFN** : filtre "Global" → affiche les compétitions normales
- [ ] **DQ/DNS** : vérifier l'affichage des badges rouges dans RaceCard

### Priorité Moyenne
- [ ] **Tests backend** : exécuter `cd backend && npx jest` — tous les tests doivent passer
- [ ] **Tests de charge** : 10+ appels simultanés au scraper LiveFFN → pas de crash
- [ ] **Compatibilité Android** : tester sur Android 12, 13, 14
- [ ] **Performance** : mesurer le temps de chargement du planning avec un nageur ayant 20+ épreuves

### Critères de validation pour la session de test
- [ ] L'app ne crashe pas sur les écrans principaux (accueil, planning, réglages, feedback)
- [ ] Les données LiveFFN s'affichent correctement (temps, DQ, pauses, annotations)
- [ ] Le feedback se sauvegarde et se recharge (AsyncStorage + API)
- [ ] Le sélecteur de rôle n'apparaît pas dans l'inscription
- [ ] Les panneaux admin/coach ne sont visibles que pour les IDs 1 et 10

## Outils
- `npx tsc --noEmit` — vérification TypeScript
- `cd backend && npx jest` — tests backend
- `eas build --platform android --profile preview` — build APK de test
