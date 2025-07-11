import { useEffect } from "react";
import { router } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useSession } from "../lib/auth-client";

export default function Index() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [session, isPending]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>Chargement...</Text>
    </View>
  );
}
