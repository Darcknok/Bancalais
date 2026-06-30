# Reverse Engineering LiveFFN — Structure HTML & Données

> Analyse réalisée sur la compétition **Championnats de France Elite 2026** (ID `93581`)

---

## 1. Paramètres URL et leur signification

| Paramètre | Signification | Valeurs observées |
|---|---|---|
| `competition` | ID de la compétition | `93581` |
| `langue` | Langue | `fra`, `gbr` |
| `epreuve` | ID de l'épreuve (epr_id) | `2` (100NL Dames), `52` (100NL Messieurs), `81` (50Pap Messieurs), etc. |
| `go` | Mode d'affichage | `epreuve` (résultats par épreuve), `detail` (détails participant/structure) |
| `action` | Sous-mode détail | `participant`, `structure` |
| `cat_id` | Catégorie d'âge | Toujours `0` dans les données observées |
| `typ_id` | Type de course (tour) | Voir tableau ci-dessous |
| `num_epreuve` | Index séquentiel dans le programme | `0` à ~`200` |
| `iuf` | ID unique FFN du nageur | `1335004`, `1569301`, etc. |
| `structure` | ID du club | `192` (CN MARSEILLE), `387` (AMIENS), etc. |

### Correspondance typ_id

| typ_id | Signification |
|---|---|
| `60` | Séries (matin) |
| `61` | Série finale (course lente unique, ex: 800m/1500m) |
| `62` | Premières séries (ex: 800m/1500m with 2 series) |
| `11` | Finale A |
| `12` | Finale B |
| `13` | Finale C |
| `14` | Demi-finale (non observé mais probable) |

---

## 2. Page Programme

### Structure DOM

```
div#programme
  div.titrePage
  div#containeur_ajax        (zone où les détails AJAX sont injectés)
  div.ProgrammeEpreuve
    div#accordion            (jQuery accordion)
      h6 > a                "Réunion N° X : Jour Date Année"
      div
        ul.reunion
          li.debutEpreuve    "Les horaires sont donnés à titre indicatif<br><br>Ouverture des portes : 07h30"
          li.survol           (épreuve sportive)
            span.presenceOk  "»"
            span.time        "09h30"
            span.tooltip     (contenu cliquable AJAX)
          li.EventNonSportif  (événement non-sportif)
```

### Classes CSS identifiées

| Classe | Usage |
|---|---|
| `ProgrammeEpreuve` | Conteneur du programme |
| `survol` | Ligne d'une épreuve (sportive) |
| `debutEpreuve` | Informations générales (ouverture des portes, horaires indicatifs) |
| `EventNonSportif` | Événement non sportif (Second echauffement, Cérémonie protocolaire, Fin de la réunion) |
| `presenceOk` | Résultats disponibles (présence du `»`) |
| `presenceNonOk` | Résultats non disponibles (espace vide `&nbsp;`) |
| `time` | Horaire au format `HHhMM` |
| `tooltip` | Élément cliquable ouvrant le détail AJAX |

### Format du texte des épreuves

```
"{distance} {Nage} {Catégorie} {Type}"
Ex: "50 Papillon Messieurs Séries"
Ex: "100 Brasse Dames Finale A"
Ex: "800 Nage Libre Dames Premières séries"
```

### Mécanisme AJAX

La fonction `afficheEpreuve` est appelée avec les paramètres suivants :

```javascript
afficheEpreuve(
  'https://www.liveffn.com/cgi-bin',  // URL_CGI
  '/programme.php?',                   // resource
  'competition=93581&langue=fra' +
  '&cat_id=' + 0 +
  '&epr_id=' + epr_id +
  '&typ_id=' + typ_id +
  '&num_epreuve=' + num_epreuve,
  'containeur_ajax',                   // divId
  num_epreuve
);
```

Elle charge du HTML dans `div#containeur_ajax`. Ce HTML contient :

```html
<div id="containeurCourseProgramme" class="hide">
  <div class="ProgrammeDetail">
    <table class="tableau">
      <tbody id="epr_{num_epreuve}">
        <!-- par série -->
        <tr>
          <td colspan="5" class="prgTitre">{nom épreuve} - Séries - (1/12)</td>
          <td class="prgTime">09h41</td>
        </tr>
        <tr class="survol [prg_forfait_declare]">
          <td><img src="...ico_plot_{voie}.png"/></td>
          <td>{nom nageur}</td>
          <td>{année}</td>
          <td>{nationalité}</td>
          <td>{club}</td>
          <td class="temps">{00:00.00}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 3. Page Résultats (par épreuve)

### URL type

```
https://www.liveffn.com/cgi-bin/resultats.php?competition=93581&langue=fra&go=epreuve&epreuve=52
```

### Structure DOM

```
div#container
  div#left > ul.navigation  (menu résultats)
  div#right
    div.titrePage
    form[name="choix"]
      div.options            (sélecteurs Dames / Messieurs)
        select.epreuve
    table.tableau
      tr > td.epreuve        (titre : "100 Nage Libre Messieurs - Finale A" + date)
      tr.survol
        td.place             "1."
        td > a.underline     nom du nageur (lien participant)
        td                   année naissance "2004"
        td                   nationalité "FRA"
        td > a.underline     club (lien structure)
        td.temps > a.tooltip temps "00:48.82" + split tooltip
        td.reaction          "+0.63"
        td.points            "1302 pts"
        td.qualification     "QFA", "QFB"
        td.rem               "MPF17"
      tr > td.pole           (info pôle espoir)
```

### Données disponibles par ligne

| Colonne | Classe CSS | Exemple | Description |
|---|---|---|---|
| Place | `td.place` | `1.` | Classement |
| Nom | `td > a.underline` | `GABALI Cedric` | Lien vers participant |
| Année | `td` | `2004` | Année de naissance |
| Nation | `td` | `FRA` | Code pays |
| Club | `td > a.underline` | `CN MARSEILLE` | Lien vers structure |
| Temps | `td.temps a.tooltip` | `00:48.82` | Avec splits dans tooltip |
| Réaction | `td.reaction` | `+0.63` | Temps de réaction |
| Points | `td.points` | `1302 pts` | Points FFN |
| Qualification | `td.qualification` | `QFA` | Statut qualification |
| Remarque | `td.rem` | `MPF17` | Remarque fédérale |
| Pôle | `td.pole` | `CNE / INSEP` ou `CEx - RÉGION / VILLE` | Informations pôle espoir |

### Format des splits (tooltip)

```html
<b id="splitAutre">
  <table class="split">
    <tr>
      <td class="distance">50 m :</td>
      <td class="split">23.38</td>
      <td class="lap">(23.38)</td>
      <td class="relay"></td>
    </tr>
    <tr>
      <td class="distance">100 m :</td>
      <td class="split">48.82</td>
      <td class="lap">(25.44)</td>
      <td class="relay">[48.82]</td>
    </tr>
  </table>
</b>
```

- `split` = temps cumulé à la distance
- `lap` = temps du 50m partiel (entre les points)
- `relay` = temps total dans `[...]` pour les distances intermédiaires clés

---

## 4. Page Résultats (accueil)

### URL

```
https://www.liveffn.com/cgi-bin/resultats.php?competition=93581&langue=fra
```

Structure très similaire à la page programme mais avec des liens vers les résultats :

```html
<h1>Samedi 27 Juin 2026</h1>
<table class="programme">
  <tr>
    <td class="border">
      <ul class="reunion">
        <li class="titre">Réunion N° 1 : Samedi 27 Juin 2026</li>
        <li class="survol">
          <a href="...resultats.php?...go=epreuve&epreuve=81">
            <span class="presenceOk">»</span>
            <span class="time">09h30</span> - 50 Papillon Messieurs Séries
          </a>
        </li>
        <li class="EventNonSportif">Second echauffement</li>
      </ul>
    </td>
  </tr>
</table>
```

---

## 5. Page Live

### URL

```
https://www.liveffn.com/cgi-bin/live_contenaire.php?competition=93581&langue=fra
```

### Mécanisme de rafraîchissement

```javascript
var URL_CGI = 'https://www.liveffn.com/cgi-bin';
var ressource = '/live.php?competition=93581&langue=fra';
var INTERVAL_setCourseRecue = 45000 / 2; // 22.5 secondes

// Rafraîchit les métadonnées de la course en cours
var timer = setInterval(
  'setCourseRecue("res_cat_id","res_cat_mtr","res_epr_id","res_typ_id","res_num")',
  INTERVAL_setCourseRecue
);

// Rafraîchit tout le contenu live toutes les 45 secondes
var timerLive = setInterval('getServeurRessource(...)', 45000);
```

La page live charge son contenu depuis `live.php` via AJAX dans `div#containeur_ajax`.

### Structure des métadonnées live (dans `live.php`)

```html
<span id="res_cat_id"  style="visibility:hidden;">0</span>
<span id="res_cat_mtr" style="visibility:hidden;">0</span>
<span id="res_epr_id"  style="visibility:hidden;">42</span>
<span id="res_typ_id"  style="visibility:hidden;">11</span>
<span id="res_num"     style="visibility:hidden;">1</span>
<span id="page_donne"  style="visibility:hidden;">flag_page_deja_donne:0</span>
```

- `flag_page_deja_donne:0` = nouvelle donnée disponible (déclenche le pulsate)

### Structure live

```
div.liveReunionDate          "Réunion N° 6 : Lundi 29 Juin 2026"
div.liveColLeft
  div.ResultatsCourseEnCours  (course en cours)
    div.titreBoxLive
    table.tableau
      tr > td.epreuve         "400 4 Nages Dames Finale A"
      tr.survol
        td.place               "1."
        td > a > span          nom nageur
        td                     année naissance
        td                     nationalité
        td > a > span          club
        td.temps > span.tooltip  temps + splits (split2)
        td.reaction            "+0.73"
  
  div.ResultatsCourseSuivante  (course suivante, liste de départ)
    tr > td.epreuve           "09h30 - 200 Nage Libre Messieurs Séries (1/11)"
    tr.survol
      td.prgLeft
      td > img.ico_plot_{n}
      td                      nom
      td                      année
      td                      nationalité
      td                      club
      td.temps                "00:00.00" ou "59:59.99" (inconnu)

  div.programmeLive            (programme de la prochaine réunion)

div.liveColRight
  div.ClassementLive           (classement identique)
```

### Splits live : classe `split2`

Les splits en direct utilisent `class="split2"` et incluent des `<nobr>` tags :

```html
<table class="split2">
  <tr>
    <td class="distance"><nobr>50 m : </nobr></td>
    <td class="split"><nobr>29.62</nobr></td>
    <td class="lap"><nobr>(29.62)</nobr></td>
    <td class="relay"><nobr></nobr></td>
  </tr>
  <tr>
    <td class="distance"><nobr>100 m : </nobr></td>
    <td class="split"><nobr>1:03.98</nobr></td>
    <td class="lap"><nobr>(34.36)</nobr></td>
    <td class="relay"><nobr>[1:03.98]</nobr></td>
  </tr>
</table>
```

---

## 6. Formats des temps (Regex)

### Temps avec minutes

```
Pattern: ^(\d{2}):(\d{2})\.(\d{2})$
Ex:      00:48.82
→ minutes: 00, secondes: 48, centièmes: 82
→ total secondes: 48.82
```

### Temps sans minutes (< 1 minute)

```
Pattern: ^(\d{2})\.(\d{2})$
Ex:      23.38
→ secondes: 23, centièmes: 38
→ total secondes: 23.38
```

### Temps avec minutes (pour 400m+ et épreuves longues)

```
Pattern: ^(\d+):(\d{2})\.(\d{2})$
Ex:      4:44.65
→ minutes: 4, secondes: 44, centièmes: 65
→ total secondes: 284.65
```

### Temps inconnu / non parti

```
Pattern: ^59:59\.99$
→ Temps non renseigné / nageur non parti
```

### Fonction de parsing (JS/TS)

```typescript
function parseSwimTime(str: string): number | null {
  if (!str || str === '59:59.99') return null;
  const m = str.match(/^(?:(\d+):)?(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const minutes = m[1] ? parseInt(m[1]) : 0;
  const seconds = parseInt(m[2]);
  const centiseconds = parseInt(m[3]);
  return minutes * 60 + seconds + centiseconds / 100;
}
```

---

## 7. Types TypeScript

```typescript
// === Types principaux ===

interface Competition {
  id: number;           // 93581
  titre: string;        // "Championnats de France Elite - 50 m"
  lieu: string;         // "SAINT-ÉTIENNE"
  dateDebut: string;    // "Du Samedi 27 Juin"
  dateFin: string;      // "au Jeudi 2 Juillet 2026"
  langue: 'fra' | 'gbr';
}

interface Session {
  id: number;           // numéro de réunion (1-12)
  nom: string;          // "Réunion N° 1 : Samedi 27 Juin 2026"
  date: string;         // "Samedi 27 Juin 2026"
  horaireOuverture: string | null; // "07h30"
  horairesIndicatif: boolean;
  items: ProgrammeItem[];
}

type ProgrammeItem =
  | { type: 'epreuve'; data: Epreuve }
  | { type: 'nonSportif'; data: EventNonSportif }
  | { type: 'debutEpreuve'; data: InfoGenerale };

interface Epreuve {
  nom: string;             // "100 Nage Libre Messieurs"
  distance: number;        // 100
  nage: string;            // "Nage Libre"
  categorie: 'Messieurs' | 'Dames';
  tour: Tour;
  typ_id: number;          // 60, 11, 12, 13, 61, 62
  epr_id: number;          // 52
  cat_id: number;          // 0
  num_epreuve: number;     // index séquentiel dans le programme
  horaire: string;         // "09h30"
  hasResults: boolean;
  nbSeries: number | null; // 12
  nbParticipants: number | null; // 91
  participants?: Participant[];
}

type Tour =
  | 'Séries'
  | 'Premières séries'
  | 'Série finale'
  | 'Finale A'
  | 'Finale B'
  | 'Finale C';

interface EventNonSportif {
  type: 'echauffement' | 'evacuation' | 'ceremonie' | 'finReunion' | 'tempsSelection';
  label: string;           // "Second echauffement", "Cérémonie protocolaire du 100 brasse"
  horaire?: string;        // "10h35" (dans le live)
}

interface InfoGenerale {
  message: string;         // "Les horaires sont donnés à titre indicatif"
  ouverturePortes?: string;// "07h30"
}

// === Résultats ===

interface ResultatPage {
  epruves: ResultatEpreuve[];
}

interface ResultatEpreuve {
  nom: string;              // "100 Nage Libre Messieurs"
  tour: Tour;
  typ_id: number;
  date: string;             // "Dimanche 28 Juin 2026"
  horaire: string;          // "18h52"
  lignes: ResultatLigne[];
}

interface ResultatLigne {
  place: number;            // 1
  nom: string;              // "GABALI Cedric"
  anneeNaissance: number;   // 2004
  nationalite: string;      // "FRA"
  club: string;             // "CN MARSEILLE"
  structureId: number;      // 192
  iuf: number;              // 1335004
  temps: string;            // "00:48.82"
  tempsSecondes: number | null; // 48.82
  reaction: string;         // "+0.63"
  reactionSecondes: number | null; // 0.63
  points: number;           // 1302
  qualification: string | null; // "QFA" | "QFB" | null
  remarque: string | null;  // "MPF17"
  pole: string | null;      // "CNE / INSEP" ou "CEx - RÉGION / VILLE"
  splits: Split[];
}

interface Split {
  distance: number;         // 50, 100
  split: string;            // "23.38"
  splitSecondes: number;    // 23.38
  lap: string;              // "(23.38)"
  lapSecondes: number;      // 23.38
  relay: string | null;     // "[48.82]"
  relaySecondes: number | null;
}

// === Live ===

interface LiveData {
  currentRace: LiveRaceResult | null;
  nextRace: LiveNextRace | null;
  program: LiveProgramSession | null;
  ranking: LiveRaceResult | null;
  reunionDate: string;            // "Réunion N° 6 : Lundi 29 Juin 2026"
  metadata: LiveMetadata;
}

interface LiveMetadata {
  cat_id: number;
  cat_mtr: number;
  epr_id: number;
  typ_id: number;
  num: number;
  page_deja_donne: 0 | 1;  // si 0, nouvelle donnée → rafraîchir
}

interface LiveRaceResult {
  nom: string;                // "400 4 Nages Dames Finale A"
  lignes: LiveResultatLigne[];
  fiabilite: boolean;
}

interface LiveResultatLigne {
  place: number;
  nom: string;
  iuf: number;
  anneeNaissance: string;     // "04" (parfois 2 chiffres XX)
  nationalite: string;
  club: string;
  structureId?: number;
  temps: string;
  tempsSecondes: number | null;
  reaction: string;
  splits: Split[];
  placeClassementPro?: string;
}

interface LiveNextRace {
  horaire: string;            // "09h30"
  nom: string;                // "200 Nage Libre Messieurs Séries"
  seriesInfo: string;         // "(1/11)"
  participants: LiveStartParticipant[];
}

interface LiveStartParticipant {
  voie: number;               // 3 (de l'icône ico_plot_3.png)
  nom: string;
  anneeNaissance: number;
  nationalite: string;
  club: string;
  tempsInscription: string;   // "02:00.80" ou "59:59.99"
}

interface LiveProgramSession {
  nom: string;                // "Réunion N° 7 : Mardi 30 Juin 2026"
  horairesIndicatif: boolean;
  items: LiveProgramItem[];
}

type LiveProgramItem =
  | { type: 'info'; message: string }
  | { type: 'epreuve'; horaire: string; nom: string; nbSeries?: number }
  | { type: 'nonSportif'; horaire?: string; label: string };
```

---

## 8. Exemples concrets parsés

### Exemple 1 : Finale A - 100 Nage Libre Messieurs

| Champ | Valeur |
|---|---|
| place | 1 |
| nom | GABALI Cedric |
| année | 2004 |
| nation | FRA |
| club | CN MARSEILLE |
| temps | 00:48.82 → 48.82s |
| réaction | +0.63 → 0.63s |
| points | 1302 |
| qualification | null |
| remarque | null |
| splits | 50m: 23.38 (23.38), 100m: 48.82 (25.44) |
| pôle | (aucun) |

### Exemple 2 : Finale A - 100 Nage Libre Messieurs (3e place)

| Champ | Valeur |
|---|---|
| place | 3 |
| nom | CRISTOFINI Sauveur |
| année | 2009 |
| nation | FRA |
| club | G.F.C AJACCIO |
| temps | 00:48.99 → 48.99s |
| réaction | +0.68 → 0.68s |
| points | 1296 |
| qualification | null |
| remarque | MPF17 |

### Exemple 3 : Séries - 100 Nage Libre Messieurs (1er des séries)

| Champ | Valeur |
|---|---|
| place | 1 |
| nom | CHALENDAR Alexandre |
| année | 2006 |
| nation | FRA |
| club | CN MARSEILLE |
| temps | 00:49.05 → 49.05s |
| réaction | +0.64 |
| points | 1293 |
| qualification | QFA |
| pôle | CEx - PROVENCE-ALPES-CÔTE-D'AZUR / MARSEILLE |

### Exemple 4 : Live - 400 4 Nages Dames Finale A (1ère)

| Champ | Valeur |
|---|---|
| place | 1 |
| nom | TISSANDIE Camille |
| année | 04 |
| nation | FRA |
| club | CANET 66 NATATION |
| temps | 04:44.65 → 284.65s |
| réaction | +0.73 |
| splits | 50m (29.62), 100m (1:03.98/34.36), 150m (1:41.90/37.92), 200m (2:18.26/36.36), 250m (2:58.60/40.34), 300m (3:39.72/41.12), 350m (4:13.00/33.28), 400m (4:44.65/31.65) |

---

## 9. Sélecteurs CSS / XPath complets

### Programme

| Donnée | Sélecteur CSS |
|---|---|
| Session | `#accordion > h6 > a` |
| Épreuves d'une session | `#accordion > div > ul.reunion > li.survol` |
| Horaire épreuve | `li.survol > span.time` |
| Nom + catégorie + tour | `li.survol > span.tooltip` (texte brut) |
| Participants/séries | `li.survol > span.tooltip > b` |
| Événements non sportifs | `li.EventNonSportif` |
| Résultats disponibles | `span.presenceOk` (présence de `»`) |

### Résultats par épreuve

| Donnée | Sélecteur CSS |
|---|---|
| Titre épreuve + tour | `table.tableau td.epreuve` |
| Ligne résultat | `table.tableau tr.survol` |
| Place | `td.place` |
| Nom nageur | `td > a.underline` → `textContent` |
| Année naissance | `tr.survol > td:nth-child(3)` |
| Nationalité | `tr.survol > td:nth-child(4)` |
| Club | `tr.survol > td:nth-child(5) > a` → `textContent` |
| Temps | `td.temps > a` → `textContent` |
| Réaction | `td.reaction` → `textContent` |
| Points FFN | `td.points` → `textContent` (enlever " pts") |
| Qualification | `td.qualification` |
| Remarque | `td.rem` |
| Pôle | `td.pole` (tr séparé après le tr.survol) |
| Splits | `td.temps > a.tooltip > b#splitAutre > table.split > tr` |

### Live

| Donnée | Sélecteur CSS |
|---|---|
| Métadonnées | `span#res_cat_id`, `#res_epr_id`, `#res_typ_id`, `#res_num`, `#res_cat_mtr` |
| Flag nouvelle donnée | `span#page_donne` → parse `flag_page_deja_donne:{0|1}` |
| Titre course en cours | `div.ResultatsCourseEnCours td.epreuve` |
| Ligne live | `div.ResultatsCourseEnCours tr.survol` |
| Place live | `td.place` |
| Nom live | `tr.survol > td:nth-child(2) a span.tooltip` |
| Année live | `tr.survol > td:nth-child(3)` |
| Temps live | `td.temps > span.tooltip` |
| Réaction live | `td.reaction` |
| Splits live | `td.temps > span.tooltip > b#split2_Autre > table.split2 > tr` |
| Course suivante | `div.ResultatsCourseSuivante tr.survol` |

---

## 10. Notes importantes

1. **Les splits** : en résultats utilisent `class="split"` et `id="splitAutre"`, alors que le live utilise `class="split2"` et `id="split2_Autre"`.
2. **Les années** sur les pages résultats sont sur 4 chiffres (`2004`), mais sur le live elles sont sur 2 chiffres (`04`).
3. **Le temps inconnu** est représenté par `59:59.99`.
4. **Les points FFN** incluent le suffixe `" pts"` dans le textContent.
5. **La réaction** inclut le préfixe `"+"` dans le textContent (`"+0.63"`).
6. **Les statuts de qualification** : `QFA` = qualifié finale A, `QFB` = qualifié finale B.
7. **Les remarques** fédérales incluent `MPF17` (meilleure performance fédérale des 17 ans) et autres codes FFN.
8. **L'information pôle** se trouve dans un `tr` séparé (pas `tr.survol`) avec `td.pole` juste après le `tr.survol` correspondant.
