import { z } from "zod";
import * as fs from "fs/promises";
import { detect } from "langdetect";
import Papa from "papaparse";

import { TextPreprocessor } from "./textProcessing";

// Define the schema for our CSV rows
const PostSchema = z.object({
  description: z.string(),
  // Add other fields as needed
});

type Post = z.infer<typeof PostSchema>;

interface LanguageResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
}

class LanguageDetector {
  private static SUPPORTED_LANGUAGES = ["ar", "fr", "en"];

  /**
   * Detects the dominant language of a text
   * Handles edge cases like mixed language content and short phrases
   */
  static detectLanguage(text: string): LanguageResult {
    const cleaned = TextPreprocessor.preprocess(text);

    if (!TextPreprocessor.hasValidContent(cleaned)) {
      return { text, detectedLanguage: "unknown", confidence: 0 };
    }

    try {
      const detection = detect(cleaned);
      
      if (!detection || detection.length === 0) {
        return { text, detectedLanguage: "unknown", confidence: 0 };
      } else if (detection.length > 1) {
        console.warn("Multiple languages detected in text", text);
        return { text, detectedLanguage: "unknown", confidence: 0 };
      }

      const lang = detection[0].lang;
      const prob = detection[0].prob;

      if (this.SUPPORTED_LANGUAGES.includes(lang)) {
        return {
          text,
          detectedLanguage: lang,
          confidence: prob
        };
      }

      
      // Second attempt: Split text and detect language per segment
      const segments = TextPreprocessor.segmentText(cleaned);
      const langScores = new Map<string, number>();

      for (const segment of segments) {
        if (segment.trim().length === 0) continue;
        
        const segmentDetection = detect(segment);
        if (!segmentDetection || segmentDetection.length === 0) {
            console.warn("No language detected in segment", segment);
            continue;
        }

        const lang = segmentDetection[0].lang;
        const prob = segmentDetection[0].prob;

        if (this.SUPPORTED_LANGUAGES.includes(lang)) {
          const currentScore = langScores.get(lang) || 0;
          langScores.set(lang, currentScore + prob);
        }
      }

      let maxLang = "unknown";
      let maxScore = 0;

      for (const [lang, score] of langScores.entries()) {
        if (score > maxScore) {
          maxLang = lang;
          maxScore = score;
        }
      }

      return { text, detectedLanguage: maxLang, confidence: maxScore / segments.length };
    } catch (error: unknown) {
      console.error("Error detecting language", error);
      return { text, detectedLanguage: "unknown", confidence: 0 };
    }
  }

  
  /**
   * Process a CSV file and detect languages for each description
   */
  static async processFile(filePath: string): Promise<LanguageResult[]> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const rows = await this.parseCSV(fileContent);
      
      const results: LanguageResult[] = [];
      
      for (const row of rows) {
        try {
          const result = this.detectLanguage(row.description);
          results.push(result);
        } catch (error: unknown) {
          console.error(`Error processing row:`, row, error);
          results.push({
            text: row.description,
            detectedLanguage: 'error',
            confidence: 0
          });
        }
      }

      return results;
    } catch (error: unknown) {
      console.error('Error processing file:', error);
      throw error;
    }
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
            const validatedRows = results.data.map(row => PostSchema.parse(row));
            resolve(validatedRows);
          } catch (error: unknown) {
            reject(error);
          }
        },
        error: (error: unknown) => {
          reject(error);
        }
      });
    });
  }
}

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Please provide a file path as an argument");
        process.exit(1);
    }

    try{
        const results = await LanguageDetector.processFile(filePath);

        const langCounts = new Map<string, number>();
        for (const result of results) {
            const current = langCounts.get(result.detectedLanguage) || 0;
            langCounts.set(result.detectedLanguage, current + 1);
        }

        for (const [lang, count] of langCounts.entries()) {
            console.log(`${lang}: ${count} posts (${((count / results.length) * 100).toFixed(2)}%)`);
        }

        const outputFilePath = filePath.replace('.csv', '_output.csv');
        await fs.writeFile(outputFilePath, Papa.unparse(results), 'utf-8');
        console.log(`Output written to ${outputFilePath}`);
    }catch(error: unknown) {
        console.error("Error processing file", error);
        process.exit(1);
    }
}

main();