import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PoolWithdrawForm } from "../../components/PoolWithdrawForm";
import { usePoolRecord } from "../../utils/poolStore";

type PoolParams = {
  id: string;
};

export default function PoolDetailScreen(): JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<PoolParams>();
  const poolId = Array.isArray(id) ? id[0] : id ?? "";
  const pool = usePoolRecord(poolId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Pool</Text>
      <Text style={styles.title}>{pool.name}</Text>
      <Text style={styles.subtitle}>{pool.description}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={styles.summaryValue}>{pool.balance}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Threshold</Text>
            <Text style={styles.summaryValue}>{pool.threshold} sigs</Text>
          </View>
        </View>
        <View style={styles.adminList}>
          <Text style={styles.summaryLabel}>Admins</Text>
          {pool.admins.map((admin) => (
            <Text key={admin} style={styles.adminAddress}>
              {admin.slice(0, 10)}...{admin.slice(-6)}
            </Text>
          ))}
        </View>
      </View>

      <PoolWithdrawForm poolId={poolId} />

      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent withdrawals</Text>
          <Pressable
            onPress={() => router.push(`/pool/${encodeURIComponent(poolId)}/admins` as Parameters<
              typeof router.push
            >[0])}
            style={styles.historyButton}
          >
            <Text style={styles.historyButtonText}>Manage admins</Text>
          </Pressable>
        </View>

        {pool.withdrawals.length > 0 ? (
          pool.withdrawals.map((withdrawal) => (
            <View key={withdrawal.id} style={styles.withdrawalRow}>
              <Text style={styles.withdrawalRecipient}>
                {withdrawal.recipient.slice(0, 10)}...{withdrawal.recipient.slice(-6)}
              </Text>
              <Text style={styles.withdrawalAmount}>
                {withdrawal.amount} · {withdrawal.approvals.length} approvals
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistory}>No withdrawals yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  adminList: {
    gap: 6,
  },
  adminAddress: {
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "monospace",
  },
  historyCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  historyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  historyButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  historyButtonText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  withdrawalRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  withdrawalRecipient: {
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  withdrawalAmount: {
    color: "#94a3b8",
    fontSize: 12,
  },
  emptyHistory: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
