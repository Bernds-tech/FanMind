import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/providers/AuthProvider";

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (!loading && session) return <Redirect href="/(app)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
