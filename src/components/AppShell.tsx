import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="workspace-app">
      <AppSidebar />
      {children}
    </main>
  );
}
