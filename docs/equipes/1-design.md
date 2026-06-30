# Équipe Design

## Responsabilités
- UI/UX de l'application mobile (Expo/React Native)
- Identité visuelle, palettes, composants réutilisables
- Site web (Next.js) — maquettes et intégration
- Cohérence visuelle (theme, polices, espacements, ombres)

## Tâches restantes

### Priorité Haute
- [ ] **Écran d'accueil** : retravailler la hiérarchie visuelle (compétitions en cours mises en avant, pas seulement la liste)
- [ ] **Écran de planning** : améliorer le rendu mobile des timelines (padding, grouping visuel des sessions)
- [ ] **État vide** : créer des illustrations/placeholders quand il n'y a pas de compétitions, pas de résultats, pas de feedback
- [ ] **Splash screen** : vérifier que l'icône/splash est cohérente avec la charte

### Priorité Moyenne
- [ ] **DARK MODE** : vérifier tous les écrans en mode sombre (contrastes, lisibilité)
- [ ] **Accessibilité** : tailles de police minimales, contrastes, labels sur les boutons
- [ ] **Animations** : transitions entre écrans, feedback visuel des boutons (ex: scale sur les tabs)
- [ ] **Site web** : si le site Next.js est prévu, créer les maquettes responsive

### Priorité Faible
- [ ] **Guide de style** : documenter les couleurs, polices, composants dans un fichier de référence
- [ ] **Icones personnalisées** : remplacer certains Ionicons par des SVG custom

## Fichiers clés
- `src/constants/theme.ts` — variables de theme (Accent, Shadows, Radii, Spacing)
- `src/hooks/use-theme.ts` — hook theme dynamique
- `src/hooks/use-theme-mode.ts` — dark/light mode
- `src/components/` — composants réutilisables (DoubleBezelCard, ThemedText, ThemedView, etc.)
- `src/app/(tabs)/` — tous les écrans principaux
