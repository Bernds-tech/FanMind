import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertResourceInWorkspace, assertWorkspaceId, WorkspaceAuthorizationError } from "../workspaceAuthorization";

describe("workspace authorization guards", () => {
  it("rejects missing workspace ids before any resource access", () => {
    assert.throws(() => assertWorkspaceId(""), WorkspaceAuthorizationError);
  });

  it("accepts resources from the authorized workspace", () => {
    assert.doesNotThrow(() => assertResourceInWorkspace({ workspace_id: "workspace-a" }, "workspace-a"));
  });

  it("blocks cross-workspace resources without leaking resource data", () => {
    assert.throws(
      () => assertResourceInWorkspace({ workspace_id: "workspace-a" }, "workspace-b", "Kontakt"),
      /Kontakt wurde im autorisierten Workspace nicht gefunden/,
    );
  });
});
