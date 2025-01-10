# Code Documentation
Generated on: 2025-01-10T12:12:19.688Z
Total files: 2

## Project Structure

```
└── script_data
    └── src
        ├── index.ts
        └── textProcessing.ts
```

## File: index.ts
- Path: `/root/git/script_data/src/index.ts`
- Size: 5.63 KB
- Extension: .ts
- Lines of code: 172

```ts
import { z } from "zod";
import * as fs from "fs/promises";
import { detect } from "langdetect";
import Papa from "papaparse";
import { TextPreprocessor } from "./textProcessing";
const NUMBER_OF_ROWS_TO_PROCESS = 1000;
const PostSchema = z.object({
caption: z.string(),
});
type Post = z.infer<typeof PostSchema>;
interface LanguageResult {
text: string;
cleaned?: string;
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
return { text, cleaned, detectedLanguage: "unknown", confidence: 0 };
}
try {
const detection = detect(cleaned);
if (!detection || detection.length === 0) {
return { text, detectedLanguage: "unknown", confidence: 0 };
} else if (detection.length == 1) {
const lang = detection[0].lang;
const prob = detection[0].prob;
if (this.SUPPORTED_LANGUAGES.includes(lang)) {
return {
text,
cleaned,
detectedLanguage: lang,
confidence: prob,
};
}
}
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
return {
text,
cleaned,
detectedLanguage: maxLang,
confidence: maxScore / segments.length,
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
const rowsToProcess = rows.slice(0, NUMBER_OF_ROWS_TO_PROCESS);
const results: LanguageResult[] = [];
for (const row of rowsToProcess) {
try {
const text = row[columnName] || ""; // Ensure columnName is a key of Post
const result = this.detectLanguage(text);
results.push(result);
} catch (error: unknown) {
console.error(`Error processing row:`, row, error);
results.push({
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
const results = await LanguageDetector.processFile(filePath, columnName as keyof Post);
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
const outputFilePath = filePath.replace(".csv", "_output.json");
await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2), "utf-8");
console.log(`Output written to ${outputFilePath}`);
} catch (error: unknown) {
console.error("Error processing file", error);
process.exit(1);
}
}
main();
```

---------------------------------------------------------------------------

## File: textProcessing.ts
- Path: `/root/git/script_data/src/textProcessing.ts`
- Size: 4.03 KB
- Extension: .ts
- Lines of code: 121

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
return text.replace(/\d+/g, "");
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