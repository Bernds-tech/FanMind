import { NextResponse } from "next/server";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.2";
const MAX_INCOMING_MESSAGE_LENGTH = 4000;
const MAX_PASTED_CHAT_CONTEXT_LENGTH = 12000;
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

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | ReplySuggestionRequest
    | null;

  if (!payload) {
    return jsonError("Ungültiger JSON-Body.", 400);
  }

  const incomingMessage = normalizeString(payload.incomingMessage);
  const pastedChatContext = normalizeString(payload.pastedChatContext);

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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError(
      "OPENAI_API_KEY ist serverseitig nicht gesetzt. Antwortvorschläge konnten nicht erzeugt werden.",
      503,
    );
  }

  const contactContext = {
    contactId: normalizeString(payload.contactId),
    displayName: normalizeString(payload.displayName) || "Kontakt",
    handle: normalizeOptionalString(payload.handle),
    sourcePlatform: normalizeOptionalString(payload.sourcePlatform),
    language: normalizeString(payload.language) || "de",
    status: normalizeOptionalString(payload.status),
    tags: normalizeStringArray(payload.tags),
    summary: normalizeOptionalString(payload.summary),
    pastedChatContext,
    incomingMessage,
    responseMode: normalizeString(payload.responseMode) || "Freundlich",
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
        model: OPENAI_MODEL,
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
    });

    const responseBody = (await openAiResponse.json().catch(() => null)) as
      | OpenAiResponse
      | null;

    if (!openAiResponse.ok) {
      return jsonError(
        "OpenAI konnte gerade keine Antwortvorschläge erzeugen.",
        openAiResponse.status >= 500 ? 502 : 400,
      );
    }

    const outputText = extractOutputText(responseBody);

    if (!outputText) {
      return jsonError("OpenAI hat kein auswertbares Ergebnis geliefert.", 502);
    }

    const suggestions = JSON.parse(outputText) as ReplySuggestionsResponse;

    return NextResponse.json(normalizeSuggestions(suggestions));
  } catch {
    return jsonError(
      "Antwortvorschläge konnten gerade nicht erzeugt werden.",
      500,
    );
  }
}

function buildSystemPrompt(): string {
  return [
    "Du bist FanMind, ein Antwort- und Memory-Assistent für manuelle Fan- und Kundengespräche.",
    "Nutze ausschließlich den gelieferten Kontaktkontext, den gespeicherten Chatverlauf, den Analyse-Report und die letzte eingegangene Nachricht.",
    "Erzeuge exakt drei unterschiedliche Antwortvorschläge passend zum Feld responseMode, zur Analyse und zum Verlauf.",
    "Behaupte niemals, dass WhatsApp verbunden ist, dass externe Plattformen synchronisiert werden oder dass Nachrichten automatisch gesendet werden.",
    "FanMind hat keine automatische Sendefunktion. Der Mensch prüft und sendet final selbst.",
    "Wähle die Sprache anhand von contact.language. Wenn keine klare Sprache vorhanden ist, antworte auf Deutsch.",
    "Stil: menschlich, freundlich, professionell, hilfreich und nicht aufdringlich.",
    "Verkaufsorientierte Varianten dürfen nur vorsichtig sein und keinen Druck aufbauen.",
    "Keine Antwort automatisch senden oder als gesendet darstellen; die Vorschläge werden nur kopiert und manuell im Originalkanal eingefügt.",
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
