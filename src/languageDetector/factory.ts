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
      TextPreprocessor,
      frequencyAnalyzer
    ); // Strategy of lang detection
    return new LanguageDetectionService(TextPreprocessor, detectionStrategy);
  }
}


/**
 * Returns a LanguageDetectionService singleton that can be used to detect the language of text.
 *
 * @param {string} text - The text to be analyzed for language detection.
 * @returns {Promise<Omit<LanguageResult, "id">>} - The detected language and confidence level.
 */
export function languageDetector(text: string) {
    return LanguageDetectorFactory.create().detectLanguage(text);
}