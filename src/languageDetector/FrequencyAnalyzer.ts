import { CONSTANTS } from "../constants";
import { ILanguageAnalyzer, LanguageAnalysis } from "./interface";

export class FrequencyAnalyzer implements ILanguageAnalyzer {
  private readonly arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/g;
  private readonly latinPattern = /[a-zA-Z]/g;
  private readonly frenchPattern = /[àâçéèêëîïôûùüÿñæœ]/g;
  private readonly numberPattern = /[0-9].*[a-z]|[a-z].*[0-9]/i;

  public analyzeText(text: string): LanguageAnalysis {
    if (this.numberPattern.test(text)) {
      return { lang: "ar", confidence: CONSTANTS.NUMBER_INSIDE_A_TEXT_THRESHOLD };
    }

    const { arabicRatio, latinRatio, frenchRatio } = this.calculateRatios(text);

    if (!text.length) return { lang: "unknown", confidence: 0 };
    if (arabicRatio > 0.5) return { lang: "ar", confidence: arabicRatio };
    if (latinRatio > 0.5) {
      return frenchRatio > 0.1
        ? { lang: "fr", confidence: latinRatio * (0.5 + frenchRatio) }
        : { lang: "en", confidence: latinRatio };
    }

    return { lang: "unknown", confidence: 0 };
  }

  private calculateRatios(text: string): {
    arabicRatio: number;
    latinRatio: number;
    frenchRatio: number;
  } {
    const arabicCount = (text.match(this.arabicPattern) || []).length;
    const latinCount = (text.match(this.latinPattern) || []).length;
    const frenchCount = (text.match(this.frenchPattern) || []).length;
    const total = text.length || 1;

    return {
      arabicRatio: arabicCount / total,
      latinRatio: latinCount / total,
      frenchRatio: frenchCount / (latinCount || 1),
    };
  }
}
