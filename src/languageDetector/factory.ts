import { FrequencyAnalyzer } from "./FrequencyAnalyzer";
import { LangDetectStrategy } from "./LangDetectStrategy";

import { CONSTANTS } from "../constants";
import { LanguageDetectionService } from "./LanguageDetectionService";
import { TextPreprocessor } from "../textProcessing";

export class LanguageDetectorFactory {
  public static create(): LanguageDetectionService {
    const frequencyAnalyzer = new FrequencyAnalyzer(); // Strategy of frequency analysis
    const detectionStrategy = new LangDetectStrategy(
      CONSTANTS,
      frequencyAnalyzer
    ); // Strategy of lang detection
    return new LanguageDetectionService(TextPreprocessor, detectionStrategy);
  }
}


export function languageDetector(text: string) {
    return LanguageDetectorFactory.create().detectLanguage(text);
}