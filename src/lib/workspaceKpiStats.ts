import { countUniqueFans } from "@/lib/fanIdentity";
import {
  getWorkspaceContacts,
  getWorkspaceOpenFollowups,
  type ContactRow,
} from "@/lib/supabase/server";

export type WorkspaceKpiStats = {
  totalFans: number;
  openFollowups: number;
};

export function getWorkspaceKpiStatsFromContacts(
  contacts: ContactRow[],
  openFollowups = 0,
): WorkspaceKpiStats {
  return {
    totalFans: countUniqueFans(contacts),
    openFollowups,
  };
}

export async function getWorkspaceKpiStats(
  workspaceId: string,
): Promise<WorkspaceKpiStats> {
  const [contactsResult, followupsResult] = await Promise.all([
    getWorkspaceContacts(workspaceId),
    getWorkspaceOpenFollowups(workspaceId),
  ]);

  return getWorkspaceKpiStatsFromContacts(
    contactsResult.contacts,
    followupsResult.followups.length,
  );
}
