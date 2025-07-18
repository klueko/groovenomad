# 🌍 Système de Traduction Multilingue - FestiFun

## Vue d'ensemble

L'application FestiFun est maintenant entièrement multilingue avec support pour :

- 🇫🇷 **Français** (langue par défaut)
- 🇬🇧 **Anglais**
- 🇪🇸 **Espagnol**

## Structure des fichiers

```
lib/
├── i18n.ts                    # Configuration i18next
├── useTranslation.ts          # Hook personnalisé pour les traductions
└── locales/
    ├── fr.json               # Traductions françaises
    ├── en.json               # Traductions anglaises
    └── es.json               # Traductions espagnoles
```

## Comment utiliser les traductions

### 1. Import du hook

```typescript
import { useTranslation } from "../lib/useTranslation";

export default function MonComposant() {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();

  // Utilisation
  return <Text>{t("home.title")}</Text>;
}
```

### 2. Structure des clés de traduction

Les traductions sont organisées par sections :

```json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "save": "Enregistrer"
  },
  "home": {
    "title": "🎪 FestiFun",
    "searchPlaceholder": "Rechercher des festivals..."
  },
  "festival": {
    "card": {
      "distance": "{{distance}} km"
    }
  }
}
```

### 3. Utilisation avec variables

```typescript
// Avec interpolation
<Text>{t("festival.card.distance", { distance: "25" })}</Text>

// Résultat : "25 km"
```

### 4. Changer de langue

```typescript
const { changeLanguage } = useTranslation();

// Changer vers l'anglais
changeLanguage("en");

// Changer vers l'espagnol
changeLanguage("es");

// Revenir au français
changeLanguage("fr");
```

## Composants traduits

### ✅ Écrans traduits

- **Settings** (`app/settings.tsx`) - Sélecteur de langue intégré
- **Home** (`app/home.tsx`) - Interface principale
- **Festival Recommendations** (`app/festival-recommendations.tsx`) - Recommandations

### 🔄 Écrans à traduire

- `app/login.tsx`
- `app/register.tsx`
- `app/onboarding.tsx`
- `app/music-profile.tsx`
- `app/mes-billets.tsx`
- `app/trip-planning.tsx`
- `app/activity-config.tsx`
- `app/accommodation-config.tsx`
- `app/travel-config.tsx`
- `app/festival-detail.tsx`
- `components/FestivalCard.tsx`
- `components/DateRangePicker.tsx`
- `components/BottomNavigation.tsx`

## Comment ajouter une nouvelle traduction

### 1. Ajouter la clé dans les fichiers de traduction

**fr.json :**

```json
{
  "nouvelleSection": {
    "titre": "Mon nouveau titre",
    "description": "Ma description"
  }
}
```

**en.json :**

```json
{
  "nouvelleSection": {
    "titre": "My new title",
    "description": "My description"
  }
}
```

**es.json :**

```json
{
  "nouvelleSection": {
    "titre": "Mi nuevo título",
    "description": "Mi descripción"
  }
}
```

### 2. Utiliser dans le composant

```typescript
import { useTranslation } from "../lib/useTranslation";

export default function MonComposant() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("nouvelleSection.titre")}</Text>
      <Text>{t("nouvelleSection.description")}</Text>
    </View>
  );
}
```

## Bonnes pratiques

### ✅ À faire

- Utiliser des clés hiérarchiques : `section.sousSection.element`
- Garder les clés courtes et descriptives
- Utiliser des variables pour les valeurs dynamiques
- Tester toutes les langues

### ❌ À éviter

- Ne jamais utiliser la variable `t` dans les dépendances d'useEffect
- Ne pas hardcoder du texte en français
- Ne pas oublier de traduire les messages d'erreur
- Ne pas utiliser des clés trop longues

## Exemple complet

```typescript
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "../lib/useTranslation";

export default function ExempleComposant() {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();

  return (
    <View>
      <Text>{t("home.title")}</Text>

      <TouchableOpacity onPress={() => changeLanguage("en")}>
        <Text>English</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => changeLanguage("fr")}>
        <Text>Français</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => changeLanguage("es")}>
        <Text>Español</Text>
      </TouchableOpacity>

      <Text>Langue actuelle : {currentLang}</Text>
    </View>
  );
}
```

## Détection automatique de langue

Le système détecte automatiquement la langue de l'appareil et utilise :

1. La langue stockée en local (si disponible)
2. La langue de l'appareil
3. Le français comme fallback

## Persistance

La langue choisie est automatiquement sauvegardée et restaurée au redémarrage de l'application.

---

**Note :** Pour ajouter une nouvelle langue, il suffit de créer un nouveau fichier `xx.json` dans `lib/locales/` et de l'ajouter à la configuration dans `lib/i18n.ts`.
