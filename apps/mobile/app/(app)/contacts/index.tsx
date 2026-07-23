import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  EmptyState,
  LoadingState,
  Screen,
  SecondaryButton,
  StatusPill,
  mobileStyles,
} from "@/components/ui";
import { listContacts } from "@/lib/data";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import type { Contact } from "@/types";

function ContactRow({ contact }: { contact: Contact }) {
  const platform = contact.source_platform || "manuell";
  return (
    <Pressable
      onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${contact.display_name} öffnen`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{contact.display_name.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.name}>{contact.display_name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {contact.handle || "ohne Handle"} · {platform}
        </Text>
        {contact.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {contact.summary}
          </Text>
        ) : null}
      </View>
      <StatusPill tone={contact.status === "vip" ? "accent" : "neutral"}>
        {contact.status || "neu"}
      </StatusPill>
    </Pressable>
  );
}

export default function ContactsScreen() {
  const {
    workspace,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!workspace?.id) {
        setContacts([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      isRefresh ? setRefreshing(true) : setLoading(true);
      const result = await listContacts(workspace.id, search);
      setContacts(result.contacts);
      setError(result.error);
      setLoading(false);
      setRefreshing(false);
    },
    [search, workspace?.id],
  );

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  if (workspaceLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Kontakte werden geladen…" />
      </Screen>
    );
  }

  if (!workspace) {
    return (
      <Screen
        title="Kontakte"
        subtitle="Suche, öffne und verstehe deinen Fan-Kontext"
      >
        <EmptyState
          title="Noch kein Workspace"
          description={
            workspaceError ??
            "Schließe zuerst das FanMind-Onboarding ab, damit Kontakte geladen werden können."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Kontakte"
      subtitle="Suche, öffne und verstehe deinen Fan-Kontext"
      scroll={false}
      right={
        <SecondaryButton onPress={() => router.push("/(app)/contacts/new")}>
          Neu
        </SecondaryButton>
      }
    >
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Name, Handle oder Zusammenfassung suchen"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={mobileStyles.input}
        accessibilityLabel="Kontakte suchen"
      />
      {error ? <Text style={mobileStyles.error}>{error}</Text> : null}
      {loading ? (
        <LoadingState label="Kontakte werden geladen…" />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContactRow contact={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.cyan}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Keine Kontakte gefunden"
              description={
                search
                  ? "Passe deine Suche an."
                  : "Lege den ersten Kontakt direkt in der App an."
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 110 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  rowPressed: { opacity: 0.72, transform: [{ scale: 0.995 }] },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(100, 230, 255, 0.16)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontWeight: "900" },
  rowText: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: typography.body, fontWeight: "900" },
  meta: { color: colors.textMuted, fontSize: typography.small },
  summary: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 3,
  },
});
