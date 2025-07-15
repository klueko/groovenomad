// Design System FestiFun avec Pedro la mascotte
export const FestiFunColors = {
  // Palette de couleurs officielle FestiFun
  darkGreen: "#02270F", // Vert très foncé
  primaryDark: "#18002B", // Violet très foncé principal
  secondaryDark: "#22003C", // Violet foncé secondaire
  primary: "#7742FE", // Violet principal
  primaryLight: "#8555FF", // Violet plus clair
  backgroundLight: "#ECDFFF", // Fond violet très clair
  background: "#F5EFFD", // Fond principal violet clair
  lightGray: "#FAFAFA", // Gris très clair
  white: "#FFFEFC", // Blanc cassé
  pureWhite: "#FFFFFF", // Blanc pur

  // Alias pour faciliter l'usage
  text: "#18002B", // Texte principal (violet très foncé)
  textLight: "#7742FE", // Texte secondaire (violet principal)
  textOnDark: "#F5EFFD", // Texte sur fond foncé
  surface: "#FFFEFC", // Surface des cartes
  accent: "#7742FE", // Couleur d'accent

  // États (on garde quelques couleurs système)
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",

  // Transparences
  overlay: "rgba(24, 0, 43, 0.3)",
  primaryAlpha: "rgba(119, 66, 254, 0.1)",
} as const;

export const FestiFunFonts = {
  // ✅ NOUVEAU SYSTÈME : Une seule famille avec variants
  // Utilisation recommandée 2024 pour Expo SDK 53
  family: {
    poppins: "Poppins-Regular", // Police de base
    logo: "FasterOne-Regular",
  },

  // ✅ Variants avec noms explicites (sans fontWeight)
  variants: {
    // Poppins variants
    poppinsRegular: "Poppins-Regular",
    poppinsMedium: "Poppins-Medium",
    poppinsSemiBold: "Poppins-SemiBold",
    poppinsBold: "Poppins-Bold",

    // Logo
    logo: "FasterOne-Regular",
  },

  // Tailles
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    logo: 48,
    hero: 64,
  },

  // ❌ SUPPRIMÉ : weights (car intégrés dans les fichiers TTF)
} as const;

// ✅ NOUVEAU : Helpers pour utilisation simplifiée
export const FestiFunTypography = {
  // Styles pré-définis SANS fontWeight
  logo: {
    fontFamily: FestiFunFonts.variants.logo,
    fontSize: FestiFunFonts.sizes.logo,
  },

  heroTitle: {
    fontFamily: FestiFunFonts.variants.logo,
    fontSize: FestiFunFonts.sizes.hero,
  },

  title: {
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    fontSize: FestiFunFonts.sizes.xxl,
  },

  subtitle: {
    fontFamily: FestiFunFonts.variants.poppinsMedium,
    fontSize: FestiFunFonts.sizes.lg,
  },

  body: {
    fontFamily: FestiFunFonts.variants.poppinsRegular,
    fontSize: FestiFunFonts.sizes.md,
  },

  bodySemiBold: {
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    fontSize: FestiFunFonts.sizes.md,
  },

  bodyBold: {
    fontFamily: FestiFunFonts.variants.poppinsBold,
    fontSize: FestiFunFonts.sizes.md,
  },

  button: {
    fontFamily: FestiFunFonts.variants.poppinsSemiBold,
    fontSize: FestiFunFonts.sizes.md,
  },

  buttonLarge: {
    fontFamily: FestiFunFonts.variants.poppinsBold,
    fontSize: FestiFunFonts.sizes.lg,
  },
} as const;

export const FestiFunSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FestiFunBorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  round: 50,
  full: 999,
} as const;

export const FestiFunShadows = {
  sm: {
    shadowColor: FestiFunColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: FestiFunColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: FestiFunColors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Styles communs réutilisables
export const FestiFunCommonStyles = {
  // Container principal
  container: {
    flex: 1,
    backgroundColor: FestiFunColors.background,
  },

  // Centrage
  centered: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  // Bouton primaire
  primaryButton: {
    backgroundColor: FestiFunColors.primary,
    borderRadius: FestiFunBorderRadius.lg,
    paddingVertical: FestiFunSpacing.md,
    paddingHorizontal: FestiFunSpacing.lg,
    ...FestiFunShadows.md,
  },

  // Texte du bouton primaire
  primaryButtonText: {
    color: FestiFunColors.textOnDark,
    ...FestiFunTypography.button,
    textAlign: "center" as const,
  },

  // Titre principal
  heroTitle: {
    ...FestiFunTypography.heroTitle,
    color: FestiFunColors.primary,
    textAlign: "center" as const,
  },

  // Titre section
  sectionTitle: {
    ...FestiFunTypography.title,
    color: FestiFunColors.text,
  },

  // Texte corps
  bodyText: {
    ...FestiFunTypography.body,
    color: FestiFunColors.text,
    lineHeight: 24,
  },

  // Input
  input: {
    backgroundColor: FestiFunColors.surface,
    borderRadius: FestiFunBorderRadius.md,
    paddingVertical: FestiFunSpacing.md,
    paddingHorizontal: FestiFunSpacing.lg,
    ...FestiFunTypography.body,
    color: FestiFunColors.text,
    borderWidth: 2,
    borderColor: FestiFunColors.backgroundLight,
    ...FestiFunShadows.sm,
  },

  // Input focus
  inputFocused: {
    borderColor: FestiFunColors.primary,
  },
} as const;

// Branding specifique Pedro
export const PedroBranding = {
  // Emoji Pedro pour les cas où on n'a pas l'image
  emoji: "🦝",

  // Messages de Pedro
  welcomeMessages: [
    "Salut ! Moi c'est Pedro ! 🦝",
    "Prêt pour l'aventure FestiFun ? 🎉",
    "Pedro is here pour tes festivals ! 🎪",
    "PEDRO PEDRO PEDRO ! 🎵",
  ],

  // Couleurs spécifiques à Pedro
  colors: {
    fur: "#8B5A3C",
    mask: "#2D2D2D",
    accent: FestiFunColors.primary,
  },
} as const;

export default {
  colors: FestiFunColors,
  fonts: FestiFunFonts,
  typography: FestiFunTypography,
  spacing: FestiFunSpacing,
  borderRadius: FestiFunBorderRadius,
  shadows: FestiFunShadows,
  styles: FestiFunCommonStyles,
  pedro: PedroBranding,
};
