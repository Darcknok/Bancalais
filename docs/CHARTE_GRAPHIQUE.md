# Charte Graphique — Bancalais Natation

Design monochrome noir & blanc minimaliste.

---

## 1. Couleurs

### Palette

| Rôle | Hex (clair) | Hex (sombre) | Usage |
|------|-------------|-------------|-------|
| **Texte** | `#000000` | `#FFFFFF` | Titres, corps |
| **Fond** | `#FFFFFF` | `#000000` | Arrière-plan |
| **Fond carte** | `#F5F5F5` | `#1A1A1A` | Cards, conteneurs |
| **Fond sélection** | `#E5E5E5` | `#2E2E2E` | État sélectionné |
| **Texte secondaire** | `#737373` | `#A3A3A3` | Sous-titres, métadonnées |
| **Accent** | `#404040` | `#BFBFBF` | Accents secondaires |
| **Danger** | `#DC2626` | `#F87171` | Alertes, erreurs |
| **Bordure** | `#E5E5E5` | `#262626` | Séparateurs, bordures |

---

## 2. Typographie

- **Système** : `system-ui` (police par défaut du système)
- **Titres** : Graisse `700`–`800`, lettrage serré (`letter-spacing: 1px`)
- **Sous-titres** : Graisse `600`, majuscules, `letter-spacing: 4px`
- **Corps** : Graisse `400`
- **Petit texte** : Graisse `400`, opacité réduite

---

## 3. Espacement

Basé sur une échelle de 4 px :

| Token | px |
|-------|----|
| `spacing-0.5` | 2 |
| `spacing-1` | 4 |
| `spacing-2` | 8 |
| `spacing-3` | 16 |
| `spacing-4` | 24 |
| `spacing-5` | 32 |
| `spacing-6` | 64 |

---

## 4. Composants

### Barre d'accent
Ligne horizontale de 3 px avec le dégradé FFN :
```
#4AB4E6 → #111F68 → #E2061A
```

### Cards
- Fond blanc
- Coins arrondis (`border-radius: 12–16 px`)
- Ombre légère (`box-shadow: 0 4px 12px rgba(0,0,0,0.08)`)
- Optionnel : barre d'accent en haut

### Boutons
- Bouton primaire : fond `#2563EB`, texte blanc, `border-radius: 8 px`
- Bouton secondaire : fond transparent, bordure `#2563EB`, texte `#2563EB`
- Effet hover : opacité réduite à 0.9

### Navigation
- Desktop : sidebar fixe avec fond blanc, liens en `#111827`, actif en `#2563EB`
- Mobile : hamburger menu, drawer latéral

### Liens
- Couleur : `#2563EB`
- Survol : souligné ou opacité réduite

---

## 5. Icônes

- Utilisation de **SymbolView** (`expo-symbols`) sur mobile/tablette
- Icônes FFN natives pour les disciplines :
  - 🏊 Natation course
  - 🤽 Water-polo
  - 🎭 Natation artistique
  - 🤿 Plongeon
  - 🌊 Eau libre
- Taille : 20–24 px dans la navigation, 16 px inline

---

## 6. Éléments graphiques

### Ligne de séparation
- Hauteur : 1 px
- Couleur : `#E5E7EB`
- Optionnel avec accent dégradé pour les sections importantes

### Badges / Chips
- Fond : `#DBEAFE` (bleu très clair)
- Texte : `#1E40AF` (bleu foncé)
- Coins arrondis (`border-radius: 999 px`)
- Taille police : petite (`12–13 px`)

---

## 7. Logo

Le logo FFN est disponible sur https://ffnatation.fr/. Il se compose du sigle **FFN** dans une typographie bold, accompagné du symbole des anneaux aquatiques.

Pour l'application Bancalais, utiliser le nom **Bancalais** suivi de **Natation** en sous-titre (majuscules, espacé).

---

## 8. Structure type d'une page

```
┌──────────────────────────────────────┐
│  Header (bleu marine #111F69)        │
│  Logo + Navigation                   │
├──────────────────────────────────────┤
│                                      │
│  Contenu principal                   │
│  (fond clair #F9FAFB)               │
│                                      │
│  ┌── Card ──────────────────────────┐│
│  │  Contenu (fond blanc #FFFFFF)    ││
│  │  Coins arrondis, ombre           ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌── Card ──────────────────────────┐│
│  │  ...                             ││
│  └──────────────────────────────────┘│
│                                      │
├──────────────────────────────────────┤
│  Footer (bleu marine #111F69)        │
│  Liens + copyright                   │
└──────────────────────────────────────┘
```

---

## 9. Accessibilité

- Contraste minimal : 4.5:1 pour le texte normal, 3:1 pour le grand texte
- Éviter le rouge seul pour les alertes (accompagner d'une icône ou d'un label)
- Support du mode sombre (inverser fond `#111827` ↔ `#F9FAFB`)

---

## 10. Ressources

- **FFN** : https://www.ffnatation.fr/
- **Extranat** : https://ffn.extranat.fr/
- **Live FFN** : https://www.liveffn.com/
- **Polices système** : `system-ui`, `ui-sans-serif`, `-apple-system`
