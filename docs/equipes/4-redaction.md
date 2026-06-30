# Équipe Rédaction

## Responsabilités
- Contenu de l'application (textes, messages d'erreur, onboarding)
- Documentation utilisateur
- Communications in-app (notifications, annonces)
- Relecture et correction

## Tâches restantes

### Priorité Haute
- [ ] **Messages d'erreur** : uniformiser les messages d'erreur en français (actuellement mélangé FR/EN)
  - Exemple : "Connexion au serveur impossible (délai dépassé)" → OK
  - Vérifier "Failed to fetch", "Error", etc.
- [ ] **Page d'accueil** : rédiger les textes pour les états vides
  - "Aucune compétition trouvée" + suggestion d'action
  - "Aucun résultat LiveFFN pour ce nageur"
- [ ] **Onboarding** : créer un mini guide (3 slides) pour les nouveaux utilisateurs
  - Slide 1 : "Bienvenue sur Bancalais — suis tes performances en direct"
  - Slide 2 : "Sélectionne un nageur dans l'accueil pour voir son planning"
  - Slide 3 : "Ajoute ton ressenti après chaque course pour progresser"

### Priorité Moyenne
- [ ] **Notifications types** : finaliser les templates de notifications
  - "Rappel : {épreuve} dans 30 minutes"
  - "Nouveau temps : {nageur} a réalisé {temps} sur {épreuve}"
  - "Annonce du coach : {message}"
- [ ] **Aide/FAQ** : rédiger 5-10 questions/réponses
  - "Comment ajouter un nageur ?"
  - "Mes données sont-elles sauvegardées ?"
  - "Comment contacter mon coach ?"

### Priorité Faible
- [ ] **Mentions légales** : rédiger les CGU et politique de confidentialité
- [ ] **Email de bienvenue** : template pour l'email post-inscription

## Fichiers clés
- `src/app/(tabs)/` — tous les écrans (textes UI)
- `src/lib/api.ts` — messages d'erreur
- `backend/src/routes/notifications.ts` — templates notif
- `src/app/(auth)/` — écrans de connexion/inscription
