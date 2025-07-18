import { useTranslation as useI18nTranslation } from "react-i18next";

// Types pour les clés de traduction
type TranslationKeys =
  | "common"
  | "navigation"
  | "home"
  | "festival"
  | "auth"
  | "profile"
  | "tickets"
  | "planning"
  | "activities"
  | "settings"
  | "dateRange"
  | "errors"
  | "alerts";

// Hook personnalisé avec typage TypeScript
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (language: "fr" | "en" | "es") => {
    i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const isLanguageLoaded = () => {
    return i18n.hasResourceBundle(i18n.language, "translation");
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    isLanguageLoaded,
    i18n,
  };
};

export default useTranslation;
