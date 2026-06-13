import { type ContactRow } from "@/lib/supabase/server";

function normalizeFanIdentity(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getFanGroupKey(contact: ContactRow): string {
  const nameKey = normalizeFanIdentity(contact.display_name);
  const handleKey = normalizeFanIdentity(contact.handle);

  if (nameKey && handleKey) {
    return `name-handle:${nameKey}:${handleKey}`;
  }

  if (handleKey) {
    return `handle:${handleKey}`;
  }

  if (nameKey) {
    return `name:${nameKey}`;
  }

  return `contact:${contact.id}`;
}

export function countUniqueFans(contacts: ContactRow[]): number {
  return new Set(contacts.map(getFanGroupKey)).size;
}
