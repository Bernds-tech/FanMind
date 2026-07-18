import { Redirect } from "expo-router";

import { LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";

export default function IndexRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Sichere FanMind-Sitzung wird geladen…" />
      </Screen>
    );
  }
  return <Redirect href={session ? "/(app)" : "/(auth)/login"} />;
}
