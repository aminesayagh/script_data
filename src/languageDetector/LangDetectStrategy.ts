import {
  ILanguageAnalyzer,
  ILanguageDetectionStrategy,
  ITextPreprocessor,
  LanguageAnalysis,
} from "./interface";
import { CONSTANTS } from "../constants";
import { detect } from "langdetect";
import { Lang } from "./type";

interface SegmentScore {
  length: number;
  detection: Array<{ lang: string; prob: number }> | null;
  frequencyScore?: { lang: string; confidence: number };
}

type WeightedScore = {
  score: number;
  weight: number;
};

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

      console.log("detection", detection);

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

    if (
      primaryDetection.prob > this.config.HIGH_CONFIDENCE_THRESHOLD &&
      this.config.SUPPORTED_LANGUAGES.includes(primaryDetection.lang as Lang)
    ) {
      return {
        lang: primaryDetection.lang as Lang,
        confidence: primaryDetection.prob,
      };
    } else {
      return null;
    }
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
    // Step 1: Preprocess and segment analysis
    const segments = this.textPreprocessor.segmentText(text);
    const langScores = new Map<string, WeightedScore>();
    let totalWeight = 0;

    // Step 2: Calculate position weights
    // Words at the beginning often carry more language information
    const getPositionWeight = (index: number, total: number): number => {
      return 1 + ((total - index) / total) * 0.5; // Front words get up to 50% more weight
    };

    console.log("segments", segments);

    segments.forEach((segment, index) => {
      if (!segment || segment.length === 0) return;

      // Calculate weights
      const segmentLength = segment.length;
      const positionWeight = getPositionWeight(index, segments.length);
      const lengthWeight = Math.log(segmentLength + 1) / Math.log(10);
      const combinedWeight = positionWeight * lengthWeight;

      totalWeight += segment.length;

      const segmentDetection = detect(segment);

      console.log("segmentDetection", segment, segmentDetection);

      if (!segmentDetection.length) {
        const charFreqScore = this.frequencyAnalyzer.analyzeText(segment);
        if (charFreqScore.lang !== "unknown") {
          this.updateScores(
            langScores,
            charFreqScore.lang,
            charFreqScore.confidence * combinedWeight,
            combinedWeight
          );
        }
        return;
      }

      // Process detections with confidence boosting for consistent results
      for (const detection of segmentDetection) {
        if (this.config.SUPPORTED_LANGUAGES.includes(detection.lang as Lang)) {
          // Direct language match
          this.updateScores(
            langScores,
            detection.lang,
            detection.prob * combinedWeight,
            combinedWeight
          );
        } else {
          const remapped = this.remapRomanceLang(detection.lang);
          console.log("remapped", segment, remapped, detection.lang);
          if (remapped) {
            const adjustedConfidence = this.calculateAdjustedConfidence(
              detection.prob,
              remapped.confidence,
              segment
            );

            this.updateScores(
              langScores,
              remapped.lang,
              adjustedConfidence * combinedWeight,
              combinedWeight
            );
          } else {
            this.updateScores(
              langScores,
              "unknown",
              combinedWeight,
              combinedWeight
            );
          }
        }
      }
    });

    // Step 4: Normalize and find the best match
    const { maxLang, maxConfidence } = this.findBestMatch(
      langScores,
      totalWeight
    );

    // Step 5: Apply confidence thresholds and return result
    if (maxConfidence < this.config.MINIMUM_CONFIDENCE_THRESHOLD) {
      return { lang: "unknown", confidence: maxConfidence };
    }

    return { lang: maxLang as Lang, confidence: maxConfidence };
  }

  // Helper methods for better organization and reusability
  private updateScores(
    scores: Map<string, { score: number; weight: number }>,
    lang: string,
    score: number,
    weight: number
  ): void {
    const current = scores.get(lang) || { score: 0, weight: 0 };
    scores.set(lang, {
      score: current.score + score,
      weight: current.weight + weight,
    });
  }

  private calculateAdjustedConfidence(
    detectionProb: number,
    remapConfidence: number,
    segment: string
  ): number {
    // Apply penalties for mixed scripts or numbers
    const hasMixedScripts =
      /[a-zA-Z].*[\u0600-\u06FF]|[\u0600-\u06FF].*[a-zA-Z]/u.test(segment);
    const confidence = detectionProb * remapConfidence;

    return hasMixedScripts ? confidence * 0.8 : confidence;
  }

  private findBestMatch(
    scores: Map<string, { score: number; weight: number }>,
    totalWeight: number
  ): { maxLang: string; maxConfidence: number } {
    let maxLang = "unknown";
    let maxConfidence = 0;

    for (const [lang, { score, weight }] of scores.entries()) {
      const normalizedConfidence = weight > 0 ? score / weight : 0;
      if (normalizedConfidence > maxConfidence) {
        maxLang = lang;
        maxConfidence = normalizedConfidence;
      }
    }

    return { maxLang, maxConfidence };
  }
}
