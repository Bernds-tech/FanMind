import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { loadWorkspace } from "@/lib/data";
import { useAuth } from "@/providers/AuthProvider";
import type { Workspace } from "@/types";

type WorkspaceContextValue = {
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user.id) {
      setWorkspace(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await loadWorkspace(session.user.id);
    setWorkspace(result.workspace);
    setError(result.error);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ workspace, loading, error, refresh }),
    [error, loading, refresh, workspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace muss innerhalb des WorkspaceProvider verwendet werden.");
  }
  return value;
}
