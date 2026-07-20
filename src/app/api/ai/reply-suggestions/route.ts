import { NextRequest, NextResponse } from "next/server";
import { getFanMindAiModel, recordAiUsageEvent } from "@/lib/aiUsage";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isWorkspaceArchivedAfterSubscriptionEnd } from "@/lib/subscriptionCancellation";
import {
  BearerAccessTokenError,
  getOptionalBearerAccessToken,
} from "@/lib/requestAccessToken";
import {
  requireContactInAuthorizedWorkspace,
  WorkspaceAuthorizationError,
} from "@/lib/workspaceAuthorization";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_INCOMING_MESSAGE_LENGTH = 4000;
const MAX_PASTED_CHAT_CONTEXT_LENGTH = 12000;
const MAX_RESPONSE_INSTRUCTION_LENGTH = 1000;
const AI_RATE_LIMIT_MAX = 20;
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_TIMEOUT_MS = 25_000;
const SAFETY_NOTE =
  "Mensch prüft und sendet final selbst. Keine automatische Sendefunktion.";

type ReplySuggestionRequest = {
  contactId?: unknown;
  displayName?: unknown;
  handle?: unknown;
  sourcePlatform?: unknown;
  language?: unknown;
  status?: unknown;
  tags?: unknown;
  summary?: unknown;
  pastedChatContext?: unknown;
  incomingMessage?: unknown;
  responseMode?: unknown;
  responseInstruction?: unknown;
  analysisReport?: unknown;
};

type ReplyOption = {
  tone: string;
  label: string;
  text: string;
};

type ReplySuggestionsResponse = {
  reply_options: ReplyOption[];
  suggested_memory: {
    content: string;
    importance: "low" | "normal" | "high";
  };
  suggested_followup: {
    recommended: boolean;
    in_days: number | null;
    reason: string;
  };
  safety_note: string;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const replySuggestionsSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "reply_options",
    "suggested_memory",
    "suggested_followup",
    "safety_note",
  ],
  properties: {
    reply_options: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tone", "label", "text"],
        properties: {
          tone: {
            type: "string",
            minLength: 1,
          },
          label: {
            type: "string",
            minLength: 1,
          },
          text: {
            type: "string",
            minLength: 1,
          },
        },
      },
    },
    suggested_memory: {
      type: "object",
      additionalProperties: false,
      required: ["content", "importance"],
      properties: {
        content: {
          type: "string",
        },
        importance: {
          type: "string",
          enum: ["low", "normal", "high"],
        },
      },
    },
    suggested_followup: {
      type: "object",
      additionalProperties: false,
      required: ["recommended", "in_days", "reason"],
      properties: {
        recommended: {
          type: "boolean",
        },
        in_days: {
          anyOf: [
            {
              type: "integer",
              minimum: 1,
              maximum: 30,
            },
            {
              type: "null",
            },
          ],
        },
        reason: {
          type: "string",
        },
      },
    },
    safety_note: {
      type: "string",
      enum: [SAFETY_NOTE],
    },
  },
} as const;

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as
    | ReplySuggestionRequest
    | null;

  if (!payload) {
    return jsonError("Ungültiger JSON-Body.", 400);
  }

  const contactId = normalizeString(payload.contactId);
  if (!contactId) {
    return jsonError("contactId ist Pflicht.", 400);
  }

  let authorizationContext: Awaited<
    ReturnType<typeof requireContactInAuthorizedWorkspace>
  >;
  let accessToken: string | undefined;

  try {
    accessToken = getOptionalBearerAccessToken(request);
  } catch (error) {
    if (error instanceof BearerAccessTokenError) {
      return jsonError("Bitte melde dich in der FanMind-App erneut an.", 401);
    }
    return jsonError("Mobile Sitzung konnte nicht geprüft werden.", 401);
  }

  try {
    authorizationContext = await requireContactInAuthorizedWorkspace(
      contactId,
      accessToken,
    );
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) {
      if (error.code === "unauthenticated") {
        return jsonError("Bitte melde dich erneut an.", 401);
      }

      if (error.code === "resource_forbidden") {
        return jsonError(
          "Kontakt ist nicht für diesen Workspace freigegeben.",
          403,
        );
      }
    }

    return jsonError("Kontakt konnte nicht autorisiert geladen werden.", 404);
  }

  const rateLimit = checkRateLimit(
    `ai-reply:${authorizationContext.user.id}:${getClientIp(request)}`,
    { maxRequests: AI_RATE_LIMIT_MAX, windowMs: AI_RATE_LIMIT_WINDOW_MS },
  );

  if (!rateLimit.allowed) {
    return jsonError("Zu viele KI-Anfragen. Bitte versuche es später erneut.", 429);
  }

  const incomingMessage = normalizeString(payload.incomingMessage);
  const pastedChatContext = normalizeString(payload.pastedChatContext);
  const responseInstruction = normalizeString(payload.responseInstruction);

  if (!incomingMessage) {
    return jsonError("incomingMessage ist Pflicht.", 400);
  }

  if (incomingMessage.length > MAX_INCOMING_MESSAGE_LENGTH) {
    return jsonError(
      `incomingMessage darf maximal ${MAX_INCOMING_MESSAGE_LENGTH} Zeichen enthalten.`,
      400,
    );
  }

  if (pastedChatContext.length > MAX_PASTED_CHAT_CONTEXT_LENGTH) {
    return jsonError(
      `pastedChatContext darf maximal ${MAX_PASTED_CHAT_CONTEXT_LENGTH} Zeichen enthalten.`,
      400,
    );
  }

  if (responseInstruction.length > MAX_RESPONSE_INSTRUCTION_LENGTH) {
    return jsonError(
      `responseInstruction darf maximal ${MAX_RESPONSE_INSTRUCTION_LENGTH} Zeichen enthalten.`,
      400,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError(
      "Antwortvorschläge konnten gerade nicht erzeugt werden.",
      503,
    );
  }

  const { contact, workspace, user } = authorizationContext;
  if (isWorkspaceArchivedAfterSubscriptionEnd(workspace)) {
    return jsonError("Workspace ist nach Vertragsende im Archiv-/Lesemodus; KI-Vorschläge sind deaktiviert.", 403);
  }
  const model = getFanMindAiModel();
  const startedAt = Date.now();
  const contactContext = {
    contactId: contact.id,
    displayName: contact.display_name || "Kontakt",
    handle: contact.handle,
    sourcePlatform: contact.source_platform,
    language: contact.language || "de",
    status: contact.status,
    tags: contact.tags ?? [],
    summary: contact.summary,
    pastedChatContext,
    incomingMessage,
    responseMode: normalizeString(payload.responseMode) || "Freundlich",
    responseInstruction: responseInstruction || null,
    analysisReport: normalizeOptionalString(payload.analysisReport),
  };

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: JSON.stringify(contactContext),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "fanmind_reply_suggestions",
            strict: true,
            schema: replySuggestionsSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });

    const responseBody = (await openAiResponse.json().catch(() => null)) as
      | OpenAiResponse
      | null;

    if (!openAiResponse.ok) {
      await recordAiUsageEvent({
        workspaceId: workspace.id,
        userId: user.id,
        contactId: contact.id,
        feature: "reply_suggestions",
        model,
        inputChars: estimateJsonChars(contactContext),
        outputChars: 0,
        status: "error",
        errorCode: String(openAiResponse.status),
        latencyMs: Date.now() - startedAt,
        sourceRoute: "/api/ai/reply-suggestions",
      });
      return jsonError(
        "Antwortvorschläge konnten gerade nicht erzeugt werden.",
        openAiResponse.status >= 500 ? 502 : 400,
      );
    }

    const outputText = extractOutputText(responseBody);

    if (!outputText) {
      await recordAiUsageEvent({
        workspaceId: workspace.id,
        userId: user.id,
        contactId: contact.id,
        feature: "reply_suggestions",
        model,
        inputChars: estimateJsonChars(contactContext),
        outputChars: 0,
        status: "error",
        errorCode: "missing_output",
        latencyMs: Date.now() - startedAt,
        sourceRoute: "/api/ai/reply-suggestions",
      });
      return jsonError(
        "Antwortvorschläge konnten gerade nicht erzeugt werden.",
        502,
      );
    }

    const suggestions = JSON.parse(outputText) as ReplySuggestionsResponse;

    await recordAiUsageEvent({
      workspaceId: workspace.id,
      userId: user.id,
      contactId: contact.id,
      feature: "reply_suggestions",
      model,
      inputChars: estimateJsonChars(contactContext),
      outputChars: outputText.length,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      sourceRoute: "/api/ai/reply-suggestions",
    });

    return NextResponse.json(normalizeSuggestions(suggestions));
  } catch (error) {
    await recordAiUsageEvent({
      workspaceId: workspace.id,
      userId: user.id,
      contactId: contact.id,
      feature: "reply_suggestions",
      model,
      inputChars: estimateJsonChars(contactContext),
      outputChars: 0,
      status: "error",
      errorCode:
        error instanceof SyntaxError
          ? "invalid_json"
          : error instanceof Error &&
              (error.name === "AbortError" || error.name === "TimeoutError")
            ? "timeout"
            : "exception",
      latencyMs: Date.now() - startedAt,
      sourceRoute: "/api/ai/reply-suggestions",
    });
    return jsonError(
      "Antwortvorschläge konnten gerade nicht erzeugt werden.",
      500,
    );
  }
}

function buildSystemPrompt(): string {
  return [
    "Du bist FanMind, ein Antwort- und Kontaktwissen-Assistent für manuelle Fan- und Kundengespräche.",
    "Nutze ausschließlich den gelieferten Kontaktkontext, gespeicherten Verlauf, Analyse-Report und die letzte eingegangene Nachricht.",
    "Befolge responseMode und eine optionale responseInstruction, solange sie nicht den Sicherheits- und Wahrheitsregeln widersprechen.",
    "Erzeuge exakt drei in Funktion und Form deutlich unterschiedliche Antwortvorschläge:",
    "1. Kurz & direkt: ein bis zwei Sätze, klare Antwort auf die Hauptfrage.",
    "2. Warm & persönlich: zwei bis vier Sätze, greift einen belegten Kontextpunkt auf.",
    "3. Nächster Schritt: hilfreich und handlungsorientiert, aber ohne Druck; bei fehlender Information lieber eine konkrete Rückfrage.",
    "Die drei Varianten dürfen nicht mit demselben Satz beginnen und sollen keine bloßen Umformulierungen sein.",
    "Erfinde niemals Termine, Preise, Rabatte, Verfügbarkeiten, Zusagen, Beziehungen oder Ereignisse. Nutze solche Angaben nur, wenn sie ausdrücklich im gelieferten Kontext stehen.",
    "Wenn die gewünschte Antwort ohne fehlende Information nicht sicher möglich ist, formuliere transparent oder stelle eine kurze Rückfrage.",
    "Behaupte niemals, dass WhatsApp verbunden ist, externe Plattformen vollständig synchronisiert werden oder Nachrichten automatisch gesendet werden.",
    "FanMind hat keine automatische Sendefunktion. Der Mensch prüft und sendet final selbst.",
    "Wähle die Sprache anhand von contact.language. Wenn keine klare Sprache vorhanden ist, antworte auf Deutsch.",
    "Stil: menschlich, professionell, hilfreich, nicht aufdringlich und ohne psychologische Manipulation.",
    "Verkaufsorientierte Varianten dürfen nur vorsichtig sein und keinen künstlichen Zeitdruck erzeugen.",
    "suggested_memory enthält nur eine langfristig nützliche, im Kontext belegte Information; andernfalls bleibt content leer.",
    "suggested_followup wird nur empfohlen, wenn aus dem Verlauf ein nachvollziehbarer nächster Schritt entsteht.",
    "Gib ausschließlich JSON im vorgegebenen Schema zurück.",
  ].join("\n");
}

function normalizeSuggestions(
  suggestions: ReplySuggestionsResponse,
): ReplySuggestionsResponse {
  return {
    reply_options: suggestions.reply_options.slice(0, 3),
    suggested_memory: {
      content: suggestions.suggested_memory.content,
      importance: suggestions.suggested_memory.importance,
    },
    suggested_followup: {
      recommended: suggestions.suggested_followup.recommended,
      in_days: suggestions.suggested_followup.in_days,
      reason: suggestions.suggested_followup.reason,
    },
    safety_note: SAFETY_NOTE,
  };
}

function extractOutputText(response: OpenAiResponse | null): string {
  if (response?.output_text) {
    return response.output_text;
  }

  return (
    response?.output
      ?.flatMap((outputItem) => outputItem.content ?? [])
      .map((contentItem) => contentItem.text)
      .find((text): text is string => Boolean(text)) ?? ""
  );
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized || null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function estimateJsonChars(value: unknown): number {
  return JSON.stringify(value).length;
}
