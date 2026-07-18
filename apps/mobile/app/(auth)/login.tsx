import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  BrandMark,
  Card,
  PrimaryButton,
  Screen,
  mobileStyles,
} from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { colors, spacing, typography } from "@/theme/tokens";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setError(result);
    setBusy(false);
  }

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={styles.wrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.intro}>
          <BrandMark />
          <Text style={styles.title}>Deine Kontakte. Dein Kontext. Deine Antwort.</Text>
          <Text style={styles.subtitle}>
            Die FanMind-App ist dein mobiler Arbeitsbereich. Sie ist keine umverpackte Website
            und sendet niemals automatisch.
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Sicher anmelden</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-Mail-Adresse"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="email"
            style={mobileStyles.input}
            accessibilityLabel="E-Mail-Adresse"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Passwort"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            style={mobileStyles.input}
            accessibilityLabel="Passwort"
            onSubmitEditing={() => void submit()}
          />
          {error ? <Text style={mobileStyles.error}>{error}</Text> : null}
          <PrimaryButton busy={busy} onPress={() => void submit()}>
            Anmelden
          </PrimaryButton>
          <Text style={styles.securityText}>
            Die Sitzung wird verschlüsselt im sicheren Gerätespeicher gehalten. Service-Role-
            und KI-Schlüssel befinden sich nicht in der App.
          </Text>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  intro: { gap: spacing.lg },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  formCard: { gap: spacing.lg },
  formTitle: { color: colors.text, fontSize: typography.heading, fontWeight: "900" },
  securityText: {
    color: colors.textMuted,
    fontSize: typography.micro,
    lineHeight: 17,
    textAlign: "center",
  },
});
