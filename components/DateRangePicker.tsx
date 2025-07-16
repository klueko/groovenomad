import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Calendar, ChevronDown, X } from "lucide-react-native";
import { FestiFunColors, FestiFunTypography } from "../lib/design-system";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  placeholder?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Toutes les dates",
}: DateRangePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);

  // Générer les prochains 12 mois
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();

    // Option "Toutes les dates" (365 jours suivants)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);
    options.push({
      label: "Toutes les dates (365 jours)",
      startDate: new Date(),
      endDate,
      isDefault: true,
    });

    // Ce mois-ci
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    options.push({
      label: "Ce mois-ci",
      startDate: thisMonthStart,
      endDate: thisMonthEnd,
    });

    // Les 6 prochains mois
    for (let i = 1; i <= 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const monthName = monthStart.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });

      options.push({
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        startDate: monthStart,
        endDate: monthEnd,
      });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  const formatDisplayText = () => {
    if (!value.startDate || !value.endDate) {
      return placeholder;
    }

    // Vérifier si c'est l'option "Toutes les dates"
    const defaultOption = monthOptions.find((opt) => opt.isDefault);
    if (
      defaultOption &&
      value.startDate.getTime() === defaultOption.startDate.getTime() &&
      value.endDate.getTime() === defaultOption.endDate.getTime()
    ) {
      return "Toutes les dates";
    }

    // Vérifier si c'est un mois complet
    const matchingMonth = monthOptions.find(
      (opt) =>
        !opt.isDefault &&
        value.startDate &&
        value.endDate &&
        opt.startDate.getTime() === value.startDate.getTime() &&
        opt.endDate.getTime() === value.endDate.getTime()
    );

    if (matchingMonth) {
      return matchingMonth.label;
    }

    // Sinon afficher la plage personnalisée
    const start = value.startDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    const end = value.endDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    return `${start} - ${end}`;
  };

  const handleOptionPress = (option: (typeof monthOptions)[0]) => {
    const newRange = {
      startDate: option.startDate,
      endDate: option.endDate,
    };
    setTempRange(newRange);
    onChange(newRange);
    setModalVisible(false);
  };

  const isSelected = (option: (typeof monthOptions)[0]) => {
    return (
      value.startDate?.getTime() === option.startDate.getTime() &&
      value.endDate?.getTime() === option.endDate.getTime()
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dateContainer}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.dateRow}>
          <Calendar size={16} color={FestiFunColors.background} />
          <Text style={styles.dateText}>{formatDisplayText()}</Text>
          <ChevronDown size={14} color={FestiFunColors.background} />
        </View>
        <Text style={styles.dateSubtext}>Filtrer par période</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une période</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={FestiFunColors.background} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {monthOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    isSelected(option) && styles.optionItemSelected,
                  ]}
                  onPress={() => handleOptionPress(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected(option) && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.isDefault && (
                    <Text style={styles.optionSubtext}>
                      Recommandé pour voir tous les événements
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dateContainer: {
    gap: 2,
    alignItems: "flex-end",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  dateSubtext: {
    fontSize: 12,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: FestiFunColors.secondaryDark,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "70%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.title.fontFamily,
  },

  optionsList: {
    maxHeight: 400,
  },

  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },

  optionItemSelected: {
    backgroundColor: FestiFunColors.primary,
    borderColor: FestiFunColors.primary,
  },

  optionText: {
    fontSize: 16,
    color: FestiFunColors.background,
    fontFamily: FestiFunTypography.body.fontFamily,
    marginBottom: 2,
  },

  optionTextSelected: {
    fontWeight: "600",
    fontFamily: FestiFunTypography.bodySemiBold.fontFamily,
  },

  optionSubtext: {
    fontSize: 12,
    color: "#ad9cbb",
    fontFamily: FestiFunTypography.body.fontFamily,
  },
});
