import React from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

import { EmptyState } from "../../components/states/EmptyState";

export default function PoolsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon="🏊"
        title="No joined pools yet"
        subtitle="Browse the explorer or open a pool to start managing shared funds."
        actionLabel="Browse explorer"
        onAction={() => router.push("/(tabs)/explore" as Parameters<typeof router.push>[0])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});
