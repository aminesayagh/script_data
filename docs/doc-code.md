# Code Documentation
Generated on: 2025-01-11T16:33:28.843Z
Total files: 7

## Project Structure

```
└── script_data
    └── src
        ├── constants.ts
        ├── files.ts
        ├── index.ts
        ├── languageDetector.ts
        ├── main.ts
        ├── textProcessing.ts
        └── types.ts
```

## File: constants.ts
- Path: `/root/git/script_data/src/constants.ts`
- Size: 589.00 B
- Extension: .ts
- Lines of code: 14

```ts
import { Lang } from "./types";
export const CONSTANTS = {
NUMBER_OF_ROWS_TO_PROCESS: 100000000000000000000000,
HIGH_CONFIDENCE_THRESHOLD: 0.8,
MINIMUM_CONFIDENCE_THRESHOLD: 0.4,
SUPPORTED_LANGUAGES: ["ar", "fr", "en"] as const,
ROMANCE_LANG_MAP: {
es: [{ targetLang: "fr" as Lang, confidence: 0.85 }],
it: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
pt: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
de: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
nl: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
}
} as const;
```

---------------------------------------------------------------------------

## File: files.ts
- Path: `/root/git/script_data/src/files.ts`
- Size: 1.72 KB
- Extension: .ts
- Lines of code: 57

```ts
import * as fs from "fs/promises";
import Papa from "papaparse";
import { Post } from "./types";
import { PostSchema } from "./types";
import { createReadStream } from "fs";
import { parse } from "papaparse";
import { PipelineSource } from "stream";
class Files {
static processFile(
filePath: string,
columnName: keyof Post = "caption"
) {
return new Promise<{ id: string; caption: string }[]>((resolve, reject) => {
const results: Post[] = [];
let isFirstChunk = true;
const readStream = createReadStream(filePath, {
encoding: "utf-8",
highWaterMark: 64 * 1024, // 64KB chunks
});
return parse(readStream, {
header: true,
skipEmptyLines: true,
chunk: (chunk: Papa.ParseResult<Post>) => {
try {
const valid = chunk.data
.map((row) => {
try {
return PostSchema.parse(row);
} catch (error) {
console.error("Row parsing error:", row, error);
return null;
}
})
.filter((row: Post | null): row is Post => row !== null);
results.push(...valid);
isFirstChunk = false;
if (results.length > 10000) {
readStream.pause();
process.nextTick(() => readStream.resume());
}
} catch (error) {
console.error("Parsing error:", error);
reject(error);
}
},
complete: () => {
resolve(results);
},
error: (error: Error) => {
reject(error);
},
});
});
}
}
export default Files;
```

---------------------------------------------------------------------------

## File: index.ts
- Path: `/root/git/script_data/src/index.ts`
- Size: 96.00 B
- Extension: .ts
- Lines of code: 4

```ts
import { main as detectLanguage } from "./main";
(async () => {
await detectLanguage();
})();
```

---------------------------------------------------------------------------

## File: languageDetector.ts
- Path: `/root/git/script_data/src/languageDetector.ts`
- Size: 5.11 KB
- Extension: .ts
- Lines of code: 132

```ts
import { detect } from "langdetect";
import Papa from "papaparse";
import * as fs from "fs/promises";
import { Post, LanguageResult, Lang } from "./types";
import { CONSTANTS } from "./constants";
import { TextPreprocessor } from "./textProcessing";
export class LanguageDetector {
/**
* the most likely language and the confidence level of that detection.
*
* @param text - The input text to be analyzed for character frequency.
* @returns An object containing the detected language ("ar", "fr", "en", or "unknown")
*          and a confidence score indicating the likelihood of the detected language.
*
* The function calculates the ratio of Arabic, Latin, and French characters in the text.
* - If the ratio of Arabic characters exceeds 0.5, the language is determined to be Arabic.
* - If the ratio of Latin characters exceeds 0.5, further checks are made:
*   - If the ratio of French characters to Latin characters is greater than 0.1, the language is
*     determined to be French.
*   - Otherwise, the language is determined to be English.
* - If none of these conditions are met, the language is returned as "unknown".
*/
private static analyzeFrequency(text: string) {
const arabicCount = (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || [])
.length;
const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
const frenchCount = (text.match(/[àâçéèêëîïôûùüÿñæœ]/g) || []).length;
const total = text.length;
if (!total) return { lang: "unknown", confidence: 0 };
const arabicRatio = arabicCount / total;
const latinRatio = latinCount / total;
const frenchRatio = frenchCount / latinCount || 0;
if (arabicRatio > 0.5) return { lang: "ar", confidence: arabicRatio };
if (latinRatio > 0.5) {
return frenchRatio > 0.1
? { lang: "fr", confidence: latinRatio * (0.5 + frenchRatio) }
: { lang: "en", confidence: latinRatio };
}
return { lang: "unknown", confidence: 0 };
}
static detectLanguage(text: string): Omit<LanguageResult, "id"> {
if (!text?.trim()) {
return { text, cleaned: "", detectedLanguage: "empty", confidence: 1 };
}
const cleaned = TextPreprocessor.preprocess(text);
if (!cleaned || !TextPreprocessor.hasValidContent(cleaned)) {
return { text, cleaned, detectedLanguage: "unknown", confidence: 0 };
}
try {
const detection = detect(cleaned);
if (!detection?.length) {
return { text, cleaned, detectedLanguage: "error", confidence: 0 };
}
if (
detection.length === 1 &&
detection[0].prob > CONSTANTS.HIGH_CONFIDENCE_THRESHOLD
) {
const lang = detection[0].lang;
if (CONSTANTS.SUPPORTED_LANGUAGES.includes(lang as Lang)) {
return {
text,
cleaned,
detectedLanguage: lang as Lang,
confidence: detection[0].prob,
};
}
}
const langScores = new Map<string, number>();
let totalLength = 0;
const segments = TextPreprocessor.segmentText(cleaned);
for (const segment of segments) {
if (!segment.trim()) continue;
const segmentLength = segment.length;
totalLength += segmentLength;
const segmentDetection = detect(segment);
if (!segmentDetection?.length) {
const freqAnalysis = this.analyzeFrequency(segment);
if (freqAnalysis.lang !== "unknown") {
langScores.set(
freqAnalysis.lang,
(langScores.get(freqAnalysis.lang) || 0) +
freqAnalysis.confidence * segmentLength
);
}
continue;
}
for (const { lang, prob } of segmentDetection) {
const score = (prob * Math.log(segmentLength + 1)) / Math.log(10);
if (CONSTANTS.SUPPORTED_LANGUAGES.includes(lang as Lang)) {
langScores.set(lang, (langScores.get(lang) || 0) + score);
} else {
const mappings =
CONSTANTS.ROMANCE_LANG_MAP[
lang as keyof typeof CONSTANTS.ROMANCE_LANG_MAP
];
if (mappings) {
const mapping = mappings[0];
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
let bestLang = "unknown";
let bestScore = 0;
for (const [lang, score] of langScores.entries()) {
const normalizedScore = score / totalLength;
if (normalizedScore > bestScore) {
bestLang = lang;
bestScore = normalizedScore;
}
}
return {
text,
cleaned,
detectedLanguage:
bestScore < CONSTANTS.MINIMUM_CONFIDENCE_THRESHOLD ? "unknown" : (bestLang as Lang),
confidence: bestScore,
};
} catch (error) {
console.error("Language detection error:", error);
return { text, cleaned, detectedLanguage: "error", confidence: 0 };
}
}
}
```

---------------------------------------------------------------------------

## File: main.ts
- Path: `/root/git/script_data/src/main.ts`
- Size: 4.20 KB
- Extension: .ts
- Lines of code: 125

```ts
import { LanguageDetector } from "./languageDetector";
import { Post } from "./types";
import * as fs from "fs/promises";
import { createWriteStream } from "fs";
import Papa from "papaparse";
import Files from "./files";
import { CONSTANTS } from "./constants";
import { PipelineSource, Transform } from "stream";
import { pipeline } from "stream/promises";
export async function main() {
const filePath = process.argv[2];
const columnName = process.argv[3] || "caption";
if (!filePath) {
console.error("Please provide a file path as an argument");
process.exit(1);
}
try {
const stats = new Map<string, number>();
let processedCount = 0;
const languageDetectorStream = new Transform({
objectMode: true,
transform: (row, encoding, callback) => {
const text = row[columnName as keyof Post] || "";
const result = LanguageDetector.detectLanguage(text);
console.log(result);
stats.set(
result.detectedLanguage,
(stats.get(result.detectedLanguage) || 0) + 1
);
processedCount++;
if (processedCount % 1000 === 0) {
console.log(`Processed ${processedCount} rows`);
}
const outputRow = {
id: row.id || "",
lang:
result.detectedLanguage === "empty"
? "0"
: result.detectedLanguage === "unknown" ||
result.detectedLanguage === "error"
? ""
: result.detectedLanguage,
};
callback(null, outputRow);
},
});
const outputPath = filePath.replace(".csv", "_output.csv");
const outputStream = createWriteStream(outputPath, { encoding: "utf-8" });
outputStream.write("id,lang\n");
const stringifier = new Transform({
objectMode: true,
transform(row, encoding, callback) {
const csvLine = `${row.id},${row.lang}\n`;
callback(null, csvLine);
},
});
await pipeline(
Files.processFile(filePath, columnName as keyof Post) as unknown as PipelineSource<any>,
languageDetectorStream,
stringifier,
outputStream
);
stats.forEach((count, lang) => {
console.log(
`${lang}: ${count} posts (${((count / processedCount) * 100).toFixed(2)}%)`
);
});
console.log(`Output written to ${outputPath}`);
} catch (error) {
console.error("Processing error:", error);
process.exit(1);
}
}
```

---------------------------------------------------------------------------

## File: textProcessing.ts
- Path: `/root/git/script_data/src/textProcessing.ts`
- Size: 4.23 KB
- Extension: .ts
- Lines of code: 125

```ts
export class TextPreprocessor {
/**
* Removes emojis from text
*/
private static removeEmojis(text: string): string {
return text.replace(
/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
""
);
}
/**
* Removes URLs from text
*/
private static removeUrls(text: string): string {
return text.replace(/https?:\/\/\S+/gi, "").replace(/www\.\S+/gi, "");
}
/**
* Removes HTML tags and entities
*/
private static removeHtmlTags(text: string): string {
return text
.replace(/<[^>]*>/g, "") // Remove HTML tags
.replace(/&[a-z]+;/gi, ""); // Remove HTML entities
}
/**
* Removes hashtags and mentions
*/
private static removeSocialTags(text: string): string {
return text.replace(/[@#]\S+/g, "");
}
/**
* Removes special characters but preserves Arabic diacritics and punctuation
*/
private static removeSpecialChars(text: string): string {
const arabicDiacritics =
/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const basicPunctuation = /[.,!?،؟]/;
return text
.split("")
.filter(
(char) =>
char.match(/[a-zA-Z\s]/) || // English letters and spaces
arabicDiacritics.test(char) || // Arabic characters and diacritics
basicPunctuation.test(char) || // Basic punctuation
char.match(/[àâçéèêëîïôûùüÿñæœ]/) // French special characters
)
.join("");
}
/**
* Removes extra whitespace, including newlines and tabs
*/
private static normalizeWhitespace(text: string): string {
return text.replace(/\s+/g, " ").trim();
}
/**
* Removes parentheses and their content
*/
private static removeParentheses(text: string): string {
return text
.replace(/\([^)]*\)/g, "")
.replace(/\{[^}]*\}/g, "")
.replace(/\[[^\]]*\]/g, "");
}
/**
* Removes numeric sequences
*/
private static removeNumbers(text: string): string {
return text.replace(/(?:^\d+\s)|(?:\s\d+\s)|(?:\s\d+$)/g, ' ');
}
private static unCapitalize(text: string): string {
return text.toLowerCase();
}
private static removeExtraSpaces(text: string): string {
return text.replace(/\s+/g, " ").trim();
}
private static removePunctuation(text: string): string {
return text.replace(/[.,!?،؟]/g, "");
}
/**
* Main preprocessing function that applies all cleaning steps
*/
static preprocess(text: string): string {
if (!text) return "";
let cleaned = text;
cleaned = this.removeUrls(cleaned);
cleaned = this.removeHtmlTags(cleaned);
cleaned = this.removeSocialTags(cleaned);
cleaned = this.removeEmojis(cleaned);
cleaned = this.removePunctuation(cleaned);
cleaned = this.removeParentheses(cleaned);
cleaned = this.removeNumbers(cleaned);
cleaned = this.removeSpecialChars(cleaned);
cleaned = this.normalizeWhitespace(cleaned);
cleaned = this.unCapitalize(cleaned);
cleaned = this.removeExtraSpaces(cleaned);
return cleaned;
}
/**
* Checks if the preprocessed text has enough content for language detection
*/
static hasValidContent(text: string): boolean {
const cleaned = this.preprocess(text);
return cleaned.length >= 3 && /[a-zA-Z\u0600-\u06FF]/.test(cleaned);
}
/**
* Segments text into meaningful chunks for analysis
*/
static segmentText(text: string): string[] {
const cleaned = this.preprocess(text);
const segments = cleaned
.split(/[.!?،؟]+/)
.map((segment) => segment.trim())
.filter((segment) => segment.length >= 3); // Filter out very short segments
return segments;
}
}
```

---------------------------------------------------------------------------

## File: types.ts
- Path: `/root/git/script_data/src/types.ts`
- Size: 410.00 B
- Extension: .ts
- Lines of code: 15

```ts
import { z } from "zod";
export const PostSchema = z.object({
id: z.string(),
caption: z.string(),
});
export type Post = z.infer<typeof PostSchema>;
export type Lang = "fr" | "en" | "ar";
export type DetectedLanguage = Lang | "empty" | "unknown" | "error";
export interface LanguageResult {
id: string;
text: string;
cleaned?: string;
detectedLanguage: DetectedLanguage;
confidence: number;
}
```

---------------------------------------------------------------------------