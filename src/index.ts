import { z } from "zod";
import * as fs from "fs/promises";
import { detect } from "langdetect";
import Papa from "papaparse";

import { TextPreprocessor } from "./textProcessing";

const NUMBER_OF_ROWS_TO_PROCESS = 100000000000000000000000;

const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MINIMUM_CONFIDENCE_THRESHOLD = 0.4;

// Define the schema for our CSV rows
const PostSchema = z.object({
  id: z.string(),
  caption: z.string(),
  // Add other fields as needed
});

type Post = z.infer<typeof PostSchema>;

type Lang = "fr" | "en" | "ar";

interface LanguageResult {
  id: string;
  text: string;
  cleaned?: string;
  detectedLanguage: Lang | "empty" | "unknown" | "error";
  confidence: number;
}

class LanguageDetector {
  private static SUPPORTED_LANGUAGES = ["ar", "fr", "en"];

  // Romance language mapping for common words
  private static ROMANCE_LANG_MAP: {
    [key: string]: { targetLang: Lang; confidence: number }[];
  } = {
    es: [
      { targetLang: "fr", confidence: 0.85 }, // High confidence for Spanish->French mappings
    ],
    it: [
      { targetLang: "fr", confidence: 0.82 }, // Slightly lower confidence for Italian->French
    ],
    pt: [
      { targetLang: "fr", confidence: 0.82 }, // Slightly lower confidence for Italian->French
    ],
    de: [
      { targetLang: "fr", confidence: 0.82 }, // Slightly lower confidence for Italian->French
    ],
    nl: [
      { targetLang: "fr", confidence: 0.82 }, // Slightly lower confidence for Italian->French
    ],
  };
  /**
   * Detects the dominant language of a text
   * Handles edge cases like mixed language content and short phrases
   */
  static detectLanguage(text: string): Omit<LanguageResult, "id"> {
    // Check for empty strings first
    if (!text || text.trim() === "") {
      return {
        text,
        cleaned: "",
        detectedLanguage: "empty",
        confidence: 1, // High confidence that it's empty
      };
    }

    const cleaned = TextPreprocessor.preprocess(text);

    // Check for strings that become empty after preprocessing
    if (cleaned.trim() === "") {
      return {
        text,
        cleaned,
        detectedLanguage: "empty",
        confidence: 0.9, // High confidence but not 1, as it needed preprocessing
      };
    }

    if (!TextPreprocessor.hasValidContent(cleaned)) {
      return { text, cleaned, detectedLanguage: "unknown", confidence: 0 };
    }

    try {
      const detection = detect(cleaned);

      if (!detection || detection.length === 0) {
        return { text, cleaned, detectedLanguage: "error", confidence: 0 };
      }

      if (
        detection.length === 1 &&
        detection[0].prob > HIGH_CONFIDENCE_THRESHOLD
      ) {
        const lang = detection[0].lang;
        const prob = detection[0].prob;

        if (this.SUPPORTED_LANGUAGES.includes(lang)) {
          return {
            text,
            cleaned,
            detectedLanguage: lang as Lang,
            confidence: prob,
          };
        }
      }

      // Script-based detection for Arabic (as a strong signal)
      const hasArabicScript = /[\u0600-\u06FF\u0750-\u077F]/.test(cleaned);
      const hasLatinScript = /[a-zA-Z]/.test(cleaned);

      // If text is predominantly in Arabic script, weight Arabic detection higher
      const scriptBasedConfidence =
        hasArabicScript && !hasLatinScript ? 0.3 : 0;

      // Second attempt: Split text and detect language per segment
      const segments = TextPreprocessor.segmentText(cleaned);
      const langScores = new Map<string, number>();
      let totalLength = 0;

      for (const segment of segments) {
        if (segment.trim().length === 0) continue;

        const segmentLength = segment.length;
        totalLength += segmentLength;

        const segmentDetection = detect(segment);
        if (!segmentDetection || segmentDetection.length === 0) {
          // Use character frequency analysis as fallback
          const charFreqScore = this.analyzeCharacterFrequency(segment);
          if (charFreqScore.lang !== "unknown") {
            const currentScore = langScores.get(charFreqScore.lang) || 0;
            langScores.set(
              charFreqScore.lang,
              currentScore + charFreqScore.confidence * segmentLength
            );
          }
          continue;
        }

        // Weight longer segments more heavily
        const lengthWeight = Math.log(segmentLength + 1) / Math.log(10); // logarithmic scaling

        for (const detection of segmentDetection) {
          const lang = detection.lang;
          const prob = detection.prob;

          if (this.SUPPORTED_LANGUAGES.includes(lang)) {
            const score = prob * lengthWeight;
            const currentScore = langScores.get(lang) || 0;
            langScores.set(lang, currentScore + score);

            // Add script-based confidence boost for Arabic
            if (lang === "ar" && hasArabicScript) {
              langScores.set(
                lang,
                langScores.get(lang)! + scriptBasedConfidence
              );
            }
          } else {
            const mappings = this.ROMANCE_LANG_MAP[lang];
            if (mappings) {
              const mapping = mappings[0];
              if (mapping) {
                return {
                  text,
                  cleaned,
                  detectedLanguage: mapping.targetLang,
                  confidence: mapping.confidence,
                };
              }
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
          maxScore = normalizedScore;
        }
      }

      // Return unknown if confidence is too low
      if (maxScore < MINIMUM_CONFIDENCE_THRESHOLD) {
        return {
          text,
          cleaned,
          detectedLanguage: "unknown",
          confidence: maxScore,
        };
      }

      return {
        text,
        cleaned,
        detectedLanguage: maxLang as Lang,
        confidence: maxScore,
      };
    } catch (error: unknown) {
      console.error("Error detecting language", error);
      return { text, cleaned, detectedLanguage: "unknown", confidence: 0 };
    }
  }

  /**
   * Process a CSV file and detect languages for each description
   */
  static async processFile(
    filePath: string,
    columnName: keyof Post
  ): Promise<LanguageResult[]> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const rows = await this.parseCSV(fileContent);

      const rowsToProcess =
        NUMBER_OF_ROWS_TO_PROCESS > rows.length
          ? rows
          : rows.slice(0, NUMBER_OF_ROWS_TO_PROCESS);

      const results: LanguageResult[] = [];

      for (const row of rowsToProcess) {
        try {
          const text = row[columnName] || ""; // Ensure columnName is a key of Post

          const result = this.detectLanguage(text);

          console.log("ID: ", row["id"], "Lang: ", result.detectedLanguage);
          results.push({ ...result, id: row["id"] });
        } catch (error: unknown) {
          console.error(`Error processing row:`, row, error);
          results.push({
            id: row["id"],
            text: row[columnName] || "",
            detectedLanguage: "error",
            confidence: 0,
          });
        }
      }

      return results;
    } catch (error: unknown) {
      console.error("Error processing file:", error);
      throw error;
    }
  }

  // Helper method for character frequency analysis
  private static analyzeCharacterFrequency(text: string): {
    lang: string;
    confidence: number;
  } {
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || [])
      .length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const frenchChars = (text.match(/[àâçéèêëîïôûùüÿñæœ]/g) || []).length;

    const total = text.length;
    if (total === 0) return { lang: "unknown", confidence: 0 };

    const arabicRatio = arabicChars / total;
    const latinRatio = latinChars / total;
    const frenchRatio = frenchChars / latinChars || 0; // French chars as ratio of Latin chars

    if (arabicRatio > 0.5) return { lang: "ar", confidence: arabicRatio };
    if (latinRatio > 0.5) {
      return frenchRatio > 0.1
        ? { lang: "fr", confidence: latinRatio * (0.5 + frenchRatio) }
        : { lang: "en", confidence: latinRatio };
    }

    return { lang: "unknown", confidence: 0 };
  }

  /**
   * Parse CSV content using Papa Parse
   */
  private static async parseCSV(content: string): Promise<Post[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const validatedRows = results.data.map((row) => {
              try {
                return PostSchema.parse(row);
              } catch (error: unknown) {
                console.error("Error parsing row", row, error);
                return null;
              }
            });
            resolve(validatedRows.filter((row) => row !== null));
          } catch (error: unknown) {
            reject(error);
          }
        },
        error: (error: unknown) => {
          reject(error);
        },
      });
    });
  }
}

async function main() {
  const filePath = process.argv[2];
  const columnName = process.argv[3] || "caption";
  if (!filePath) {
    console.error("Please provide a file path as an argument");
    process.exit(1);
  }

  try {
    const results = await LanguageDetector.processFile(
      filePath,
      columnName as keyof Post
    );

    // Format data for CSV export
    const csvData = results.map((result) => {
      let langValue: Lang | "0" | "" | "unknown" | "error" | "empty" =
        result.detectedLanguage;

      // Convert language values according to requirements
      if (langValue === "empty") {
        langValue = "0";
      } else if (langValue === "unknown" || langValue === "error") {
        langValue = ""; // Will be null in CSV
      }

      return {
        id: (result as any).id || "", // Fallback in case id is not present
        lang: langValue,
      };
    });

    const langCounts = new Map<string, number>();
    for (const result of results) {
      const current = langCounts.get(result.detectedLanguage) || 0;
      langCounts.set(result.detectedLanguage, current + 1);
    }

    for (const [lang, count] of langCounts.entries()) {
      console.log(
        `${lang}: ${count} posts (${((count / results.length) * 100).toFixed(2)}%)`
      );
    }

    const csvContent = Papa.unparse(csvData, {
      header: true,
      skipEmptyLines: true,
      columns: ["id", "lang"],
    });

    const outputFilePath = filePath.replace(".csv", "_output.csv");
    await fs.writeFile(outputFilePath, csvContent, "utf-8");

    console.log(`Output written to ${outputFilePath}`);
  } catch (error: unknown) {
    console.error("Error processing file", error);
    process.exit(1);
  }
}

main();
