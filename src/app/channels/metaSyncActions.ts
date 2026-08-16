"use server";

import { syncFacebookMessengerHistory } from "./facebookWebhookActions";
import { syncInstagramMessengerHistory } from "./instagramWebhookActions";
import { requireActiveAuthorizedWorkspace } from "@/lib/workspaceAuthorization";

export async function syncFacebookMessengerHistoryFromChannelPage(): Promise<void> {
  await requireActiveAuthorizedWorkspace();
  await syncFacebookMessengerHistory({ revalidate: true });
}

export async function syncInstagramMessengerHistoryFromChannelPage(): Promise<void> {
  await requireActiveAuthorizedWorkspace();
  await syncInstagramMessengerHistory({ revalidate: true });
}
