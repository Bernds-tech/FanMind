import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  EmptyState,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatusPill,
  mobileStyles,
} from "@/components/ui";
import { requestReplySuggestions } from "@/lib/api";
import {
  createContactMemory,
  createFollowup,
  getContact,
  listContactMemories,
} from "@/lib/data";
import { addLocalDaysDate } from "@/lib/localDate";
import { useAuth } from "@/providers/AuthProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import type { Contact, ContactMemory, ReplySuggestions } from "@/types";

export default function ContactDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const contactId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session } = useAuth();
  const {
    workspace,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace();
  const [contact, setContact] = useState<Contact | null>(null);
  const [memories, setMemories] = useState<ContactMemory[]>([]);
  const [incomingMessage, setIncomingMessage] = useState("");
  const [chatContext, setChatContext] = useState("");
  const [instruction, setInstruction] = useState("");
  const [suggestions, setSuggestions] = useState<ReplySuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [followupBusy, setFollowupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contactId) {
      setContact(null);
      setMemories([]);
      setError("Kontakt-ID fehlt.");
      setLoading(false);
      return;
    }

    if (!workspace?.id) {
      setContact(null);
      setMemories([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [contactResult, memoriesResult] = await Promise.all([
      getContact(workspace.id, contactId),
      listContactMemories(workspace.id, contactId),
    ]);
    setContact(contactResult.contact);
    setMemories(memoriesResult.memories);
    setError(contactResult.error ?? memoriesResult.error);
    setLoading(false);
  }, [contactId, workspace?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const tags = useMemo(() => contact?.tags ?? [], [contact?.tags]);

  async function generateSuggestions() {
    if (!session?.access_token || !contact) return;
    setAiBusy(true);
    setError(null);
    setNotice(null);
    const result = await requestReplySuggestions({
      accessToken: session.access_token,
      contact,
      incomingMessage,
      pastedChatContext: chatContext,
      responseInstruction: instruction,
    });
    setSuggestions(result.data);
    setError(result.error);
    setAiBusy(false);
  }

  async function copy(text: string) {
    await Clipboard.setStringAsync(text);
    setNotice("Antwort wurde kopiert. Prüfe sie vor dem Versand.");
  }

  async function saveMemory() {
    if (!workspace?.id || !contact || !suggestions?.suggested_memory.content) return;
    setMemoryBusy(true);
    const result = await createContactMemory({
      workspaceId: workspace.id,
      contactId: contact.id,
      content: suggestions.suggested_memory.content,
      importance: suggestions.suggested_memory.importance,
    });
    setError(result);
    if (!result) {
      setNotice("Kontaktwissen wurde gespeichert.");
      await load();
    }
    setMemoryBusy(false);
  }

  async function saveFollowup() {
    if (!workspace?.id || !contact || !suggestions?.suggested_followup.recommended) return;
    const days = suggestions.suggested_followup.in_days ?? 3;
    setFollowupBusy(true);
    const result = await createFollowup({
      workspaceId: workspace.id,
      contactId: contact.id,
      dueDate: addLocalDaysDate(days),
      reason: suggestions.suggested_followup.reason || "Kontakt erneut ansprechen",
      priority: "normal",
    });
    setError(result);
    if (!result) setNotice(`Follow-up in ${days} Tagen wurde gespeichert.`);
    setFollowupBusy(false);
  }

  if (workspaceLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Workspace wird geladen…" />
      </Screen>
    );
  }

  if (!workspace) {
    return (
      <Screen
        title="Kontakt"
        right={<SecondaryButton onPress={() => router.back()}>Zurück</SecondaryButton>}
      >
        <EmptyState
          title="Noch kein Workspace"
          description={
            workspaceError ??
            "Schließe zuerst das FanMind-Onboarding ab, damit Kontakte geöffnet werden können."
          }
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Kontakt wird geladen…" />
      </Screen>
    );
  }

  if (!contact) {
    return (
      <Screen
        title="Kontakt"
        right={<SecondaryButton onPress={() => router.back()}>Zurück</SecondaryButton>}
      >
        <EmptyState
          title="Kontakt nicht verfügbar"
          description={error ?? "Dieser Kontakt gehört nicht zu deinem Workspace."}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={contact.display_name}
      subtitle={`${contact.handle || "ohne Handle"} · ${contact.source_platform || "manuell"}`}
      right={<SecondaryButton onPress={() => router.back()}>Zurück</SecondaryButton>}
    >
      <View style={styles.pills}>
        <StatusPill tone="accent">{contact.status || "neu"}</StatusPill>
        <StatusPill>{contact.language || "de"}</StatusPill>
        {tags.slice(0, 3).map((tag) => (
          <StatusPill key={tag}>{tag}</StatusPill>
        ))}
      </View>

      <Card>
        <SectionTitle eyebrow="Profil">Kurzüberblick</SectionTitle>
        <Text style={mobileStyles.body}>
          {contact.summary || "Noch keine Zusammenfassung gespeichert."}
        </Text>
      </Card>

      <Card>
        <SectionTitle eyebrow="Kontaktwissen">Was FanMind berücksichtigen darf</SectionTitle>
        {memories.length ? (
          memories.slice(0, 8).map((memory) => (
            <View key={memory.id} style={styles.memoryRow}>
              <View style={styles.memoryDot} />
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.body}>{memory.content}</Text>
                <Text style={mobileStyles.muted}>
                  {memory.importance || "normal"} · {memory.type || "Hinweis"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={mobileStyles.muted}>Noch kein Kontaktwissen gespeichert.</Text>
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="Neue Nachricht">Antworten vorbereiten</SectionTitle>
        <TextInput
          value={incomingMessage}
          onChangeText={setIncomingMessage}
          placeholder="Füge die neue Nachricht des Kontakts ein…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
          style={[mobileStyles.input, mobileStyles.textArea]}
          accessibilityLabel="Neue eingehende Nachricht"
        />
        <TextInput
          value={chatContext}
          onChangeText={setChatContext}
          placeholder="Optional: letzter Gesprächskontext"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={12000}
          style={[mobileStyles.input, styles.contextInput]}
          accessibilityLabel="Optionaler Gesprächskontext"
        />
        <TextInput
          value={instruction}
          onChangeText={setInstruction}
          placeholder="Optional: z. B. kurz, direkt und ohne Verkaufsdruck"
          placeholderTextColor={colors.textMuted}
          maxLength={1000}
          style={mobileStyles.input}
          accessibilityLabel="Optionale Antwortanweisung"
        />
        {error ? <Text style={mobileStyles.error}>{error}</Text> : null}
        {notice ? <Text style={mobileStyles.success}>{notice}</Text> : null}
        <PrimaryButton busy={aiBusy} onPress={() => void generateSuggestions()}>
          Drei Antworten vorbereiten
        </PrimaryButton>
        <Text style={styles.safety}>
          Mensch prüft und sendet final selbst. Keine automatische Sendefunktion.
        </Text>
      </Card>

      {suggestions ? (
        <>
          <Card>
            <SectionTitle eyebrow="KI Standard">Antwortvorschläge</SectionTitle>
            {suggestions.reply_options.map((option, index) => (
              <View key={`${option.label}-${index}`} style={styles.replyCard}>
                <View style={mobileStyles.rowBetween}>
                  <Text style={styles.replyLabel}>{option.label}</Text>
                  <StatusPill>{option.tone}</StatusPill>
                </View>
                <Text style={mobileStyles.body}>{option.text}</Text>
                <SecondaryButton onPress={() => void copy(option.text)}>
                  Antwort kopieren
                </SecondaryButton>
              </View>
            ))}
          </Card>

          {suggestions.suggested_memory.content ? (
            <Card>
              <SectionTitle eyebrow="Vorschlag">Kontaktwissen speichern?</SectionTitle>
              <Text style={mobileStyles.body}>{suggestions.suggested_memory.content}</Text>
              <PrimaryButton busy={memoryBusy} onPress={() => void saveMemory()}>
                Kontaktwissen speichern
              </PrimaryButton>
            </Card>
          ) : null}

          {suggestions.suggested_followup.recommended ? (
            <Card>
              <SectionTitle eyebrow="Vorschlag">Follow-up einplanen?</SectionTitle>
              <Text style={mobileStyles.body}>
                In {suggestions.suggested_followup.in_days ?? 3} Tagen · {suggestions.suggested_followup.reason}
              </Text>
              <PrimaryButton busy={followupBusy} onPress={() => void saveFollowup()}>
                Follow-up speichern
              </PrimaryButton>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  memoryRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  memoryDot: {
    width: 9,
    height: 9,
    marginTop: 7,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
  contextInput: { minHeight: 90, textAlignVertical: "top" },
  safety: {
    color: colors.amber,
    fontSize: typography.micro,
    lineHeight: 17,
    textAlign: "center",
    fontWeight: "700",
  },
  replyCard: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundRaised,
    padding: spacing.lg,
  },
  replyLabel: { color: colors.text, fontSize: typography.body, fontWeight: "900" },
});
