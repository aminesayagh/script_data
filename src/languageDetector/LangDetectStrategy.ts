import { ILanguageAnalyzer, ILanguageDetectionStrategy, LanguageAnalysis } from "./interface";
import { CONSTANTS } from "../constants";
import { detect } from "langdetect";
import { Lang } from "./type";

export class LangDetectStrategy implements ILanguageDetectionStrategy {
    constructor(
      private readonly config: typeof CONSTANTS,
      private readonly frequencyAnalyzer: ILanguageAnalyzer
    ) {}
  
    public detect(text: string): LanguageAnalysis {
      try {
        const detection = detect(text);

        console.log("detection", text, detection);
        
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
  
    private handleDirectDetection(detection: Array<{ lang: string; prob: number }>): LanguageAnalysis | null {
      const primaryDetection = detection[0];
      
      if (primaryDetection.prob > this.config.HIGH_CONFIDENCE_THRESHOLD) {
        if (this.config.SUPPORTED_LANGUAGES.includes(primaryDetection.lang as Lang)) {
          return {
            lang: primaryDetection.lang as Lang,
            confidence: primaryDetection.prob
          };
        }
        // Check Romance language mapping
        const mapping = this.config.ROMANCE_LANG_MAP[primaryDetection.lang as keyof typeof this.config.ROMANCE_LANG_MAP]?.[0];
        if (mapping) {
          return {
            lang: mapping.targetLang,
            confidence: mapping.confidence
          };
        }
      }
  
      return null;
    }
  
    private handleSegmentedAnalysis(text: string): LanguageAnalysis {
      return this.frequencyAnalyzer.analyzeText(text);
    }
  }