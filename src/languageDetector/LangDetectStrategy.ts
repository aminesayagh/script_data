import {
  ILanguageAnalyzer,
  ILanguageDetectionStrategy,
  ITextPreprocessor,
  LanguageAnalysis,
} from "./interface";
import { CONSTANTS } from "../constants";
import { detect } from "langdetect";
import { Lang } from "./type";

export class LangDetectStrategy implements ILanguageDetectionStrategy {
  constructor(
    private readonly config: typeof CONSTANTS,
    private readonly textPreprocessor: ITextPreprocessor,
    private readonly frequencyAnalyzer: ILanguageAnalyzer
  ) {}

  public detect(text: string): LanguageAnalysis {
    try {
      const detection = detect(text);


      if (!detection?.length) {
        console.error("no detection", text);
        return { lang: "error", confidence: 0 };
      }

      // Try direct detection first
      const directDetection = this.handleDirectDetection(detection);
      if (directDetection) return directDetection;

      // Try segmented analysis
      return this.handleSegmentedAnalysis(text);
    } catch (error) {
      console.error("Language detection error:", error);
      return { lang: "error", confidence: 0 };
    }
  }

  private handleDirectDetection(
    detection: Array<{ lang: string; prob: number }>
  ): LanguageAnalysis | null {
    const primaryDetection = detection[0];

    if (primaryDetection.prob > this.config.HIGH_CONFIDENCE_THRESHOLD) {
      if (
        this.config.SUPPORTED_LANGUAGES.includes(primaryDetection.lang as Lang)
      ) {
        return {
          lang: primaryDetection.lang as Lang,
          confidence: primaryDetection.prob,
        };
      }
      // Check Romance language mapping
      return this.remapRomanceLang(primaryDetection.lang);
    }

    return null;
  }

  private remapRomanceLang(
    lang: string
  ): { lang: Lang; confidence: number } | null {
    const mapping =
      this.config.ROMANCE_LANG_MAP[
        lang as keyof typeof this.config.ROMANCE_LANG_MAP
      ]?.[0];
    if (mapping) {
      return {
        lang: mapping.targetLang as Lang,
        confidence: mapping.confidence,
      };
    }
    return null;
  }
  private handleSegmentedAnalysis(text: string): LanguageAnalysis {
    const segments = this.textPreprocessor.segmentText(text);
    const langScores = new Map<string, number>();
    let totalLength = 0;
    for (const segment of segments) {
      if (segment.length === 0) continue;

      const segmentLength = segment.length;
      totalLength += segment.length;

      const segmentDetection = detect(segment);
      if (!segmentDetection || !segmentDetection.length) {
        const charFreqScore = this.frequencyAnalyzer.analyzeText(segment);
        if (charFreqScore.lang !== "unknown") {
          const currentScore = langScores.get(charFreqScore.lang) || 0;
          langScores.set(
            charFreqScore.lang,
            currentScore + charFreqScore.confidence * segmentLength
          );
        }
        continue;
      }


      const lengthWeight = Math.log(segmentLength + 1) / Math.log(10); // logarithmic scaling

      for (const detection of segmentDetection) {
        const lang = detection.lang as Lang;
        const prob = detection.prob;
        if (this.config.SUPPORTED_LANGUAGES.includes(lang)) {
          const score = prob * lengthWeight;
          const currentScore = langScores.get(lang) || 0;
          langScores.set(lang, currentScore + score);
        } else {
          const remapped = this.remapRomanceLang(lang);
          if (remapped) {
            const score = prob * lengthWeight * remapped.confidence;
            const currentScore = langScores.get(remapped.lang) || 0;
            langScores.set(remapped.lang, currentScore + score);
          }
        }
      }
    }

    let maxLang = "unknown";
    let maxScore = 0;

    for (const [lang, score] of langScores.entries()) {
      const normalizedScore = score / totalLength;
      if (normalizedScore > maxScore) {
        maxLang = lang;
        maxScore = score;
      }
    }

    // Return unknown if confidence is too low
    if (maxScore < this.config.MINIMUM_CONFIDENCE_THRESHOLD) {
      return {
        lang: "unknown",
        confidence: maxScore,
      };
    }

    return {
      lang: maxLang as Lang,
      confidence: maxScore,
    };
  }
}
