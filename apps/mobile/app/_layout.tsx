import "react-native-url-polyfill/auto";

import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  configureNotificationChannel,
  handleNotificationResponse,
  registerNotificationResponseListener,
} from "@/lib/pushNotifications";
import { AuthProvider } from "@/providers/AuthProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  useEffect(() => {
    void configureNotificationChannel();

    const subscription = registerNotificationResponseListener();
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </WorkspaceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
