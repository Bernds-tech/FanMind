import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import {
  BrandMark,
  Card,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatusPill,
  mobileStyles,
} from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { colors, spacing, typography } from "@/theme/tokens";

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { workspace } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Abmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Konto" subtitle="Sitzung, Workspace und App-Grenzen">
      <BrandMark />
      <Card>
        <SectionTitle eyebrow="Angemeldet">Deine App-Sitzung</SectionTitle>
        <View style={styles.detailRow}>
          <Text style={styles.label}>E-Mail</Text>
          <Text style={styles.value}>{session?.user.email || "nicht verfügbar"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Workspace</Text>
          <Text style={styles.value}>{workspace?.name || "nicht geladen"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Rolle</Text>
          <StatusPill tone="accent">{workspace?.role || "offen"}</StatusPill>
        </View>
      </Card>

      <Card>
        <SectionTitle eyebrow="Unabhängigkeit">App und Website sind getrennt</SectionTitle>
        <Text style={mobileStyles.body}>
          Änderungen an Landingpage, Website-Navigation oder Web-CSS verändern diese App nicht.
          Die App hat eigene Releases, eigene Navigation und eigene mobile Komponenten.
        </Text>
        <Text style={mobileStyles.muted}>
          Gemeinsam verwendet werden ausschließlich die freigegebene FanMind-Produktlogik, das
          RLS-geschützte Supabase-Datenmodell und serverseitige KI-Endpunkte.
        </Text>
      </Card>

      <Card>
        <SectionTitle eyebrow="Sicherheit">Harte Grenzen</SectionTitle>
        <Text style={mobileStyles.muted}>• Kein Service-Role-Key in der App</Text>
        <Text style={mobileStyles.muted}>• Kein OpenAI-Key in der App</Text>
        <Text style={mobileStyles.muted}>• Keine automatische Sendefunktion</Text>
        <Text style={mobileStyles.muted}>• Keine eingebettete Website als Haupt-App</Text>
      </Card>

      <Card>
        <SectionTitle eyebrow="Lokale Daten">Sicheres Abmelden</SectionTitle>
        <Text style={mobileStyles.muted}>
          Beim Abmelden beendet FanMind die lokale Supabase-Sitzung, entfernt alle registrierten
          FanMind-Schlüssel aus SecureStore und leert den geladenen Workspace-Zustand. Kontakte
          und Kontaktwissen bleiben geschützt im Server-Workspace und werden nicht als Offline-
          Kopie auf dem Gerät behalten.
        </Text>
      </Card>

      <Card style={styles.dangerCard}>
        <SectionTitle eyebrow="Datenschutz">Account und Daten löschen</SectionTitle>
        <Text style={mobileStyles.muted}>
          Leite die vollständige Löschung des FanMind-Logins und der zugehörigen
          nicht aufbewahrungspflichtigen Daten ein. Dieser Prozess ist von einer
          Abo-Kündigung getrennt, zeigt den Bearbeitungsstatus und ist leicht
          auffindbar, ohne Support-E-Mail oder Telefonanruf.
        </Text>
        <SecondaryButton onPress={() => router.push("/(app)/account-deletion")}>
          Vollständige Account-Löschung verwalten
        </SecondaryButton>
      </Card>

      {error ? <Text style={mobileStyles.error}>{error}</Text> : null}
      <PrimaryButton busy={busy} onPress={() => void logout()}>
        Sicher abmelden und lokale Daten entfernen
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: typography.small },
  value: { flex: 1, color: colors.text, fontSize: typography.small, fontWeight: "800", textAlign: "right" },
  dangerCard: { borderColor: colors.red },
});
