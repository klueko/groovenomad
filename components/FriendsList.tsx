import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FestiFunColors, FestiFunFonts } from "../lib/design-system";
import Avatar from "./Avatar";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
};

type FriendsListProps = {
  friends: Friend[];
  onAddFriend?: () => void;
  maxVisible?: number;
  showAddButton?: boolean;
};

export default function FriendsList({
  friends,
  onAddFriend,
  maxVisible = 6,
  showAddButton = true,
}: FriendsListProps) {
  const visibleFriends = friends.slice(0, maxVisible);
  const remainingCount = Math.max(0, friends.length - maxVisible);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatars des amis avec chevauchement */}
        <View style={styles.avatarsContainer}>
          {visibleFriends.map((friend, index) => (
            <View
              key={friend.id}
              style={[
                styles.avatarWrapper,
                { zIndex: visibleFriends.length - index },
                index > 0 && { marginLeft: -12 },
              ]}
            >
              <Avatar
                imageUri={friend.avatar}
                name={friend.name}
                size={40}
                style={styles.friendAvatar}
              />
              {/* Indicateur en ligne */}
              {friend.isOnline && <View style={styles.onlineIndicator} />}
            </View>
          ))}

          {/* Afficher le nombre d'amis restants */}
          {remainingCount > 0 && (
            <View style={[styles.avatarWrapper, { marginLeft: -12 }]}>
              <View
                style={[
                  styles.remainingCount,
                  { width: 40, height: 40, borderRadius: 20 },
                ]}
              >
                <Text style={styles.remainingText}>+{remainingCount}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bouton ajouter ami */}
        {showAddButton && onAddFriend && (
          <TouchableOpacity
            style={[
              styles.addButton,
              visibleFriends.length > 0 && { marginLeft: 12 },
            ]}
            onPress={onAddFriend}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  friendAvatar: {
    borderWidth: 2,
    borderColor: FestiFunColors.white,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: FestiFunColors.white,
  },
  remainingCount: {
    backgroundColor: FestiFunColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: FestiFunColors.white,
  },
  remainingText: {
    color: FestiFunColors.white,
    fontSize: 12,
    fontFamily: FestiFunFonts.variants.poppinsBold,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FestiFunColors.backgroundLight,
    borderWidth: 2,
    borderColor: FestiFunColors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: FestiFunColors.primary,
    fontSize: 20,
    fontFamily: FestiFunFonts.variants.poppinsBold,
    lineHeight: 24,
  },
});
