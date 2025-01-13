import { Lang } from "./types";

export const CONSTANTS = {
    NUMBER_OF_ROWS_TO_PROCESS: 100000000000000000000000,
    HIGH_CONFIDENCE_THRESHOLD: 0.8,
    MINIMUM_CONFIDENCE_THRESHOLD: 0.4,
    NUMBER_INSIDE_A_TEXT_THRESHOLD: 0.7,
    SUPPORTED_LANGUAGES: ["ar", "fr", "en"] as const,
    ROMANCE_LANG_MAP: {
      es: [{ targetLang: "fr" as Lang, confidence: 0.85 }],
      it: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
      pt: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
      de: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
      nl: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
    }
  } as const;