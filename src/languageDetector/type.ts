export type DetectedLanguage = Lang | "empty" | "unknown" | "error";
export type Lang = "fr" | "en" | "ar";

export interface LanguageResult {
  text: string;
  cleaned?: string;
  detectedLanguage: DetectedLanguage;
  confidence: number;
}