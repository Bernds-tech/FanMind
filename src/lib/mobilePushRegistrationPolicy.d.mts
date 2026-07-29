export const MOBILE_PUSH_ACTIONS: Readonly<{
  status: "status";
  register: "register";
  unregister: "unregister";
}>;
export const MOBILE_PUSH_REGISTRATION_DAYS: 30;
export const MOBILE_PUSH_CLIENT_HEADER: "mobile";
export const MOBILE_PUSH_MAX_REQUEST_BYTES: 4096;

export class MobilePushRegistrationPolicyError extends Error {
  readonly code: string;
  constructor(code: string);
}

export type MobilePushAction =
  | { action: "status" }
  | { action: "unregister" }
  | {
      action: "register";
      token: string;
      projectId: string;
      platform: "android" | "ios";
    };

export function validateMobilePushAction(value: unknown): MobilePushAction;
export function publicMobilePushStatus(
  row:
    | {
        status?: unknown;
        platform?: unknown;
        expires_at?: unknown;
      }
    | null
    | undefined,
  now?: Date,
): {
  enabled: boolean;
  platform: "android" | "ios" | null;
  expiresAt: string | null;
  deliveryEnabled: false;
};
