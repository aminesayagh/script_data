import { z } from "zod";

export const PostSchema = z.object({
  id: z.string(),
  caption: z.string(),
});

export type Post = z.infer<typeof PostSchema>;
export type Lang = "fr" | "en" | "ar";
export type DetectedLanguage = Lang | "empty" | "unknown" | "error";

export interface LanguageResult {
  id: string;
  text: string;
  cleaned?: string;
  detectedLanguage: DetectedLanguage;
  confidence: number;
}