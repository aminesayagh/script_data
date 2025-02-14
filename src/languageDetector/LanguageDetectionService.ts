import { ILanguageDetectionStrategy, ITextPreprocessor } from "./interface";
import { LanguageResult } from "./type";

export class LanguageDetectionService {
  constructor(
    private readonly textPreprocessor: ITextPreprocessor,
    private readonly detectionStrategy: ILanguageDetectionStrategy
  ) {}

  /**
   * Detects the language of the given text.
   *
   * @param {string} text - The text to detect the language of.
   * @returns {Omit<LanguageResult, "id">} The detected language and confidence level.
   */
  public detectLanguage(text: string): Omit<LanguageResult, "id"> {
    if (!text?.trim()) {
      return { text, cleaned: "", detectedLanguage: "empty", confidence: 1 };
    }

    const cleaned = this.textPreprocessor.preprocess(text);
    if (!cleaned || !this.textPreprocessor.hasValidContent(cleaned)) {
      return { text, cleaned, detectedLanguage: "empty", confidence: 0 };
    }

    const result = this.detectionStrategy.detect(cleaned);

    return {
      text,
      cleaned,
      detectedLanguage: result.lang,
      confidence: result.confidence,
    };
  }
}
