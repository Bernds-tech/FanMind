import { NextRequest, NextResponse } from "next/server";
import { demoCreators, demoFans, demoFollowups, demoMemories, demoMessages } from "@/data/demoAgency";

type ReplyOption = {
  label: string;
  text: string;
};

type CopilotReply = {
  reply_options: ReplyOption[];
  suggested_memory: string;
  suggested_followup: {
    needed: boolean;
    due_in_days: number;
    reason: string;
  };
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const MAX_MESSAGE_LENGTH = 2000;
const OPENAI_TIMEOUT_MS = 30000;

const copilotInstructions = [
  "Du bist ein sicherer, hilfreicher Copilot fuer FanMind.",
  "FanMind ist ein Human-in-the-loop-Assistent: Du erstellst nur Vorschlaege; die finale Nachricht wird immer von einem Menschen geprueft und manuell gesendet.",
  "Gib ausschliesslich strukturiertes JSON gemaess Schema zurueck.",
  "Keine automatische Sendefunktion, keine aggressiven Verkaufsformulierungen, keine falschen Versprechen und keine medizinischen Versprechen."
].join(" ");

const copilotReplySchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply_options", "suggested_memory", "suggested_followup"],
  properties: {
    reply_options: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "text"],
        properties: {
          label: { type: "string" },
          text: { type: "string" }
        }
      }
    },
    suggested_memory: { type: "string" },
    suggested_followup: {
      type: "object",
      additionalProperties: false,
      required: ["needed", "due_in_days", "reason"],
      properties: {
        needed: { type: "boolean" },
        due_in_days: { type: "integer", minimum: 0, maximum: 30 },
        reason: { type: "string" }
      }
    }
  }
};

function buildCopilotPrompt(fanId: string, message: string) {
  const fan = demoFans.find((item) => item.id === fanId);

  if (!fan) {
    return null;
  }

  const creator = demoCreators.find((item) => item.id === fan.creatorId);
  const memories = demoMemories.filter((item) => item.fanId === fan.id);
  const messages = demoMessages.filter((item) => item.fanId === fan.id);
  const followups = demoFollowups.filter((item) => item.fanId === fan.id);

  return {
    fan,
    creator,
    prompt: [
      "Du bist CreatorChat/FanMemory Copilot fuer ein Chatter-Team.",
      "Antworte in der Sprache des Fans und passend zur betreuten Creator-Persona.",
      "Erstelle 2 bis 3 kurze, passende Antwortvarianten. Sei nicht aggressiv, mache keine falschen Versprechen, keine medizinischen Versprechen und keinen Druck.",
      "Gib ausserdem genau einen Memory-Kandidaten und eine Follow-up-Empfehlung zurueck.",
      "Wenn der Kontext nicht ausreicht, formuliere vorsichtig und frage freundlich nach, statt Details zu erfinden.",
      "",
      "Betreutes Profil:",
      JSON.stringify(
        {
          id: creator?.id,
          name: creator?.displayName,
          language: creator?.language ?? fan.language,
          tone: creator?.tone,
          persona: creator?.personaNotes,
          boundaries: creator?.boundaries
        },
        null,
        2
      ),
      "",
      "Fan-Kontext:",
      JSON.stringify(
        {
          id: fan.id,
          handle: fan.handle,
          displayName: fan.displayName,
          status: fan.status,
          language: fan.language,
          summary: fan.summary,
          tags: fan.tags,
          valueLevel: fan.valueLevel
        },
        null,
        2
      ),
      "",
      "Bestehende Memories:",
      memories.length > 0 ? memories.map((memory) => `- ${memory.memoryType} (${memory.importance}): ${memory.content}`).join("\n") : "- Keine bestehenden Memories.",
      "",
      "Relevante Nachrichten:",
      messages.length > 0 ? messages.map((item) => `- ${item.direction}: ${item.content}`).join("\n") : "- Keine bisherigen Nachrichten.",
      "",
      "Offene Follow-ups:",
      followups.length > 0 ? followups.map((item) => `- ${item.dueLabel}, ${item.priority}: ${item.reason}`).join("\n") : "- Keine offenen Follow-ups.",
      "",
      "Aktuelle Fan-Nachricht:",
      message
    ].join("\n")
  };
}

function extractResponseText(data: OpenAIResponse) {
  if (data.output_text) {
    return data.output_text;
  }

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

function isCopilotReply(value: unknown): value is CopilotReply {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CopilotReply;

  return Array.isArray(candidate.reply_options) &&
    candidate.reply_options.length >= 2 &&
    candidate.reply_options.length <= 3 &&
    candidate.reply_options.every((option) => typeof option.label === "string" && typeof option.text === "string") &&
    typeof candidate.suggested_memory === "string" &&
    typeof candidate.suggested_followup?.needed === "boolean" &&
    Number.isInteger(candidate.suggested_followup.due_in_days) &&
    candidate.suggested_followup.due_in_days >= 0 &&
    candidate.suggested_followup.due_in_days <= 30 &&
    typeof candidate.suggested_followup.reason === "string";
}

async function readOpenAIJson(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return { error: { message: "OpenAI API lieferte keine JSON-Antwort." } } satisfies OpenAIResponse;
  }

  return (await response.json()) as OpenAIResponse;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiges JSON im Request." }, { status: 400 });
  }

  const { fanId, message } = body as { fanId?: unknown; message?: unknown };
  const normalizedFanId = typeof fanId === "string" ? fanId.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedFanId || !normalizedMessage) {
    return NextResponse.json({ error: "fanId und message sind erforderlich." }, { status: 400 });
  }

  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `message darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.` },
      { status: 400 }
    );
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY ist serverseitig nicht gesetzt. Bitte .env.local konfigurieren und den Server neu starten." },
      { status: 500 }
    );
  }

  const promptContext = buildCopilotPrompt(normalizedFanId, normalizedMessage);

  if (!promptContext) {
    return NextResponse.json({ error: "Fan/Kontakt wurde in den Demo-Daten nicht gefunden." }, { status: 404 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
        instructions: copilotInstructions,
        input: promptContext.prompt,
        text: {
          format: {
            type: "json_schema",
            name: "fanmind_copilot_reply",
            strict: true,
            schema: copilotReplySchema
          }
        }
      })
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "OpenAI API-Request hat das Zeitlimit ueberschritten."
      : "OpenAI API konnte nicht erreicht werden.";

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const data = await readOpenAIJson(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "OpenAI API-Fehler beim Erzeugen der Antwortvorschlaege." },
      { status: response.status }
    );
  }

  const responseText = extractResponseText(data);

  if (!responseText) {
    return NextResponse.json({ error: "OpenAI lieferte keine auswertbare Antwort." }, { status: 502 });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    return NextResponse.json({ error: "OpenAI-Antwort konnte nicht als JSON gelesen werden." }, { status: 502 });
  }

  if (!isCopilotReply(parsed)) {
    return NextResponse.json({ error: "OpenAI-Antwort entspricht nicht dem erwarteten Copilot-Format." }, { status: 502 });
  }

  return NextResponse.json(parsed);
}
