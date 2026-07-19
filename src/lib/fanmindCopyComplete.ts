import {
  createFanMindTranslator as createBaseFanMindTranslator,
  fanmindCopy,
  fanmindLanguages,
  getFanMindLanguage,
  landingPath,
  localizedPath,
  localizeFanMindValue,
  type FanMindLanguage,
} from "./fanmindCopy";
import { landingEnglishCopy } from "./landingEnglishCopy";

export {
  fanmindCopy,
  fanmindLanguages,
  getFanMindLanguage,
  landingPath,
  localizedPath,
  localizeFanMindValue,
};
export type { FanMindLanguage };

export function createFanMindTranslator(language: FanMindLanguage) {
  const baseTranslate = createBaseFanMindTranslator(language);

  return (text: string) => {
    if (language !== "en") return text;
    return landingEnglishCopy[text] ?? baseTranslate(text);
  };
}
