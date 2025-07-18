import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "../lib/useTranslation";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

interface LanguageOption {
  code: "fr" | "en" | "es";
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
  },
];

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

export default function LanguageSelector({
  onLanguageChange,
}: LanguageSelectorProps) {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (languageCode: "fr" | "en" | "es") => {
    changeLanguage(languageCode);
    onLanguageChange?.(languageCode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("settings.language")}</Text>
      <View style={styles.languageGrid}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageButton,
              currentLanguage === language.code && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange(language.code)}
          >
            <Text style={styles.flag}>{language.flag}</Text>
            <Text
              style={[
                styles.languageName,
                currentLanguage === language.code && styles.languageNameActive,
              ]}
            >
              {language.nativeName}
            </Text>
            <Text
              style={[
                styles.languageCode,
                currentLanguage === language.code && styles.languageCodeActive,
              ]}
            >
              {language.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    ...FestiFunTypography.title,
    color: FestiFunColors.textOnDark,
    marginBottom: 20,
    textAlign: "center",
  },
  languageGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 15,
  },
  languageButton: {
    backgroundColor: FestiFunColors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageButtonActive: {
    borderColor: FestiFunColors.primary,
    backgroundColor: FestiFunColors.primary + "20",
  },
  flag: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    ...FestiFunTypography.body,
    color: FestiFunColors.textOnDark,
    fontWeight: "600",
    marginBottom: 4,
  },
  languageNameActive: {
    color: FestiFunColors.primary,
  },
  languageCode: {
    ...FestiFunTypography.body,
    fontSize: 12,
    color: FestiFunColors.textOnDark + "80",
  },
  languageCodeActive: {
    color: FestiFunColors.primary + "80",
  },
});
