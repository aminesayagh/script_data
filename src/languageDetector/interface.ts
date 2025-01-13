import { DetectedLanguage } from "./type";

export interface ILanguageAnalyzer {
  analyzeText(text: string): LanguageAnalysis;
}

export interface ITextPreprocessor {
  preprocess(text: string): string;
  hasValidContent(text: string): boolean;
  segmentText(text: string): string[];
}

export interface LanguageAnalysis {
  lang: DetectedLanguage;
  confidence: number;
}

export interface ILanguageDetectionStrategy {
  detect(text: string): LanguageAnalysis;
}
