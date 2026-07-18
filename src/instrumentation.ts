import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.FANMIND_SERVER_ERROR_TRACKING_ENABLED !== "true") return;

  const { captureServerRequestError } = await import("./lib/serverErrorTelemetry");
  await captureServerRequestError(error, request, context);
};
