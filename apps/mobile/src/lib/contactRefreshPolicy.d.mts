export function createContactLoadSequence(): {
  begin(): number;
  invalidate(): void;
  isCurrent(sequence: number): boolean;
};

type ContactLoadTarget<TWorkspace> = {
  workspace: TWorkspace | null;
  transportUnavailable: boolean;
};

export function resolveContactLoadTarget<TWorkspace>(
  current: ContactLoadTarget<TWorkspace>,
  refreshResult?: ContactLoadTarget<TWorkspace>,
): ContactLoadTarget<TWorkspace>;
