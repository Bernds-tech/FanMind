import { Redirect, Stack, useSegments } from "expo-router";

import { isPasswordRecoverySegments } from "@/lib/authRecoveryPolicy.mjs";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const passwordRecovery = isPasswordRecoverySegments(segments);

  if (!loading && session && !passwordRecovery) {
    return <Redirect href="/(app)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
