export type DeclaredBodyLengthDecision =
  | "unknown"
  | "invalid"
  | "too_large"
  | "accepted";

export type BoundedJsonResult =
  | { ok: true; reason: null; value: unknown }
  | {
      ok: false;
      reason:
        | "invalid_content_length"
        | "payload_too_large"
        | "invalid_body"
        | "invalid_json";
      value: null;
    };

export function isTrustedMutationRequest(
  request: Pick<Request, "url" | "headers">,
  configuredUrls?: Array<string | null | undefined>,
): boolean;

export function inspectDeclaredBodyLength(
  value: string | null | undefined,
  maximumBytes: number,
): DeclaredBodyLengthDecision;

export function readBoundedJsonRequest(
  request: Pick<Request, "headers" | "text">,
  maximumBytes: number,
): Promise<BoundedJsonResult>;
