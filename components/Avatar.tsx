import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";

type AvatarProps = {
  imageUri?: string | null;
  name: string;
  size?: number;
  style?: any;
};

export default function Avatar({
  imageUri,
  name,
  size = 40,
  style,
}: AvatarProps) {
  // Générer les initiales à partir du nom
  const getInitials = (fullName: string): string => {
    if (!fullName) return "?";

    const words = fullName.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Générer une couleur de fond basée sur le nom pour la cohérence
  const getBackgroundColor = (name: string): string => {
    const colors = [
      FestiFunColors.primary,
      FestiFunColors.accent,
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#A8E6CF",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
              lineHeight: size,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: FestiFunColors.white,
    fontFamily: FestiFunFonts.variants.poppinsBold,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
