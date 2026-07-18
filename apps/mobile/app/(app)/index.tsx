import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import {
  BrandMark,
  Card,
  EmptyState,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionTitle,
  StatusPill,
  mobileStyles,
} from "@/components/ui";
import { loadDashboardCounts } from "@/lib/data";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { colors, spacing, typography } from "@/theme/tokens";

export default function DashboardScreen() {
  const { workspace, loading: workspaceLoading, error, refresh: refreshWorkspace } =
    useWorkspace();
  const [counts, setCounts] = useState({ contacts: 0, followups: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    await refreshWorkspace();
    if (!workspace?.id) return;
    setLoading(true);
    const result = await loadDashboardCounts(workspace.id);
    if (!result.error) {
      setCounts({ contacts: result.contacts, followups: result.followups });
    }
    setLoading(false);
  }, [refreshWorkspace, workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;
    setLoading(true);
    loadDashboardCounts(workspace.id).then((result) => {
      if (!result.error) {
        setCounts({ contacts: result.contacts, followups: result.followups });
      }
      setLoading(false);
    });
  }, [workspace?.id]);

  if (workspaceLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Workspace wird geladen…" />
      </Screen>
    );
  }

  if (!workspace) {
    return (
      <Screen title="FanMind App" subtitle="Eigener mobiler Arbeitsbereich">
        <BrandMark />
        <EmptyState
          title="Noch kein Workspace"
          description={error ?? "Schließe das FanMind-Onboarding zuerst im Web ab."}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={`Hallo in ${workspace.name}`}
      subtitle="Dein mobiler FanMind-Arbeitsbereich"
      right={<StatusPill tone="good">Sicher verbunden</StatusPill>}
    >
      <BrandMark />
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{loading ? "…" : counts.contacts}</Text>
          <Text style={styles.kpiLabel}>Kontakte</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{loading ? "…" : counts.followups}</Text>
          <Text style={styles.kpiLabel}>Offene Follow-ups</Text>
        </Card>
      </View>

      <Card>
        <SectionTitle eyebrow="Mobile Fokus">Was jetzt wichtig ist</SectionTitle>
        <Text style={mobileStyles.body}>
          Öffne einen Kontakt, füge die aktuelle Nachricht ein und lasse FanMind drei passende
          Antworten vorbereiten. Du prüfst und sendest final selbst.
        </Text>
        <PrimaryButton onPress={() => router.push("/(app)/contacts")}>Kontakte öffnen</PrimaryButton>
      </Card>

      <Card>
        <SectionTitle eyebrow="Unabhängig">Eigene App, gemeinsamer Kern</SectionTitle>
        <Text style={mobileStyles.muted}>
          Diese App besitzt eigene Navigation, eigenes Design und eigene Releases. Sie teilt nur
          das sichere FanMind-Backend und das RLS-geschützte Datenmodell mit der Web-Anwendung.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: "row", gap: spacing.md },
  kpiCard: { flex: 1, minHeight: 125, justifyContent: "center" },
  kpiValue: {
    color: colors.cyan,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  kpiLabel: { color: colors.textMuted, fontSize: typography.small, fontWeight: "700" },
});
