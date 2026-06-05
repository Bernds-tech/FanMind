import { demoReplySuggestions } from "@/data/demoAgency";

export function getMockReplySuggestion(fanId: string) {
  return demoReplySuggestions.find((item) => item.fanId === fanId) ?? null;
}

export function getDefaultReplySuggestion() {
  return {
    fanId: "default",
    options: [
      {
        label: "Warm",
        text: "Danke für deine Nachricht. Ich schaue mir das kurz an und gebe dir eine passende Antwort ohne Druck."
      },
      {
        label: "Kurz",
        text: "Danke dir. Ich melde mich gleich mit einer klaren Antwort."
      },
      {
        label: "Follow-up",
        text: "Ich nehme das als offenen Punkt mit und fasse später nochmal passend nach."
      }
    ],
    suggestedMemory: "Kontakt hat ein neues Interesse oder eine offene Frage geäußert.",
    suggestedFollowup: "In 2 Tagen nachfassen, falls keine Reaktion kommt."
  };
}
