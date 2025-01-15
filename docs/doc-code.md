# Code Documentation
Generated on: 2025-01-15T09:10:40.571Z
Total files: 15

## Project Structure

```
└── script_data
    └── src
        ├── __tests__
        │   └── textProcessing.test.ts
        ├── constants.ts
        ├── index.ts
        ├── languageDetector
        │   ├── FrequencyAnalyzer.ts
        │   ├── LangDetectStrategy.ts
        │   ├── LanguageDetectionService.ts
        │   ├── __tests__
        │   │   └── LanguageDetectorCases.test.ts
        │   ├── factory.ts
        │   ├── index.ts
        │   ├── interface.ts
        │   └── type.ts
        ├── main.ts
        ├── textProcessing.ts
        ├── types.ts
        └── utils
            └── Files.ts
```

## File: constants.ts
- Path: `/root/git/script_data/src/constants.ts`
- Size: 750.00 B
- Extension: .ts
- Lines of code: 17

```ts
import { Lang } from "./types";
export const CONSTANTS = {
NUMBER_OF_ROWS_TO_PROCESS: 100000000000000000000000,
HIGH_CONFIDENCE_THRESHOLD: 0.8,
MINIMUM_CONFIDENCE_THRESHOLD: 0.4,
NUMBER_INSIDE_A_TEXT_THRESHOLD: 0.7,
SUPPORTED_LANGUAGES: ["ar", "fr", "en"] as const,
ROMANCE_LANG_MAP: {
es: [{ targetLang: "fr" as Lang, confidence: 0.85 }],
it: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
pt: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
de: [{ targetLang: "fr" as Lang, confidence: 0.82 }],
fi: [{ targetLang: "en" as Lang, confidence: 0.82 }],
nl: [{ targetLang: "en" as Lang, confidence: 0.82 }],
sl: [{ targetLang: "en" as Lang, confidence: 0.82 }],
}
} as const;
```

---------------------------------------------------------------------------

## File: index.ts
- Path: `/root/git/script_data/src/index.ts`
- Size: 159.00 B
- Extension: .ts
- Lines of code: 6

```ts
import { main as detectLanguage } from "./main";
detectLanguage().then((result) => {
console.log(result);
}).catch((error) => {
console.error(error);
});
```

---------------------------------------------------------------------------

## File: main.ts
- Path: `/root/git/script_data/src/main.ts`
- Size: 2.37 KB
- Extension: .ts
- Lines of code: 65

```ts
import { languageDetector } from "./languageDetector";
import { Post } from "./types";
import * as fs from "fs/promises";
import Papa from "papaparse";
import Files from "./utils/Files";
import { CONSTANTS } from "./constants";
export async function main() {
const filePath = process.argv[2];
const columnName = process.argv[3] || "caption";
if (!filePath) {
console.error("Please provide a file path as an argument");
process.exit(1);
}
try {
const data = await Files.processFile(filePath, columnName as keyof Post);
const results = data
.slice(0, CONSTANTS.NUMBER_OF_ROWS_TO_PROCESS)
.map((row) => {
const text = row[columnName as keyof Post] || "";
const result = languageDetector(text);
return { ...result, id: row.id };
});
const outputData = results.map((result) => ({
id: result.id || "",
lang:
result.detectedLanguage === "empty"
? "0"
: result.detectedLanguage === "unknown" ||
result.detectedLanguage === "error"
? ""
: result.detectedLanguage,
}));
const stats = new Map<string, number>();
for (const result of results) {
stats.set(
result.detectedLanguage,
(stats.get(result.detectedLanguage) || 0) + 1
);
}
stats.forEach((count, lang) => {
console.log(
`${lang}: ${count} posts (${((count / results.length) * 100).toFixed(2)}%)`
);
});
const csvContent = Papa.unparse(outputData, {
header: true,
skipEmptyLines: true,
columns: ["id", "lang"],
});
const outputPath = filePath.replace(".csv", "_output.csv");
await fs.writeFile(outputPath, csvContent, "utf-8");
const first2000Posts = results.slice(0, 2000);
await fs.writeFile("first_2000_posts.json", JSON.stringify(first2000Posts, null, 2), "utf-8");
const unknownPosts = await Promise.all(results.map((result) => result.detectedLanguage === "unknown" ? result : null).filter((post) => post !== null));
await fs.writeFile("unknown_posts.json", JSON.stringify(unknownPosts, null, 2), "utf-8");
} catch (error) {
console.error("Processing error:", error);
process.exit(1);
}
}
```

---------------------------------------------------------------------------

## File: textProcessing.ts
- Path: `/root/git/script_data/src/textProcessing.ts`
- Size: 4.16 KB
- Extension: .ts
- Lines of code: 126

```ts
export class TextPreprocessor {
/**
* Removes emojis from text
*/
public static removeEmojis(text: string): string {
return text.replace(
/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
""
);
}
/**
* Removes URLs from text
*/
public static removeUrls(text: string): string {
return text.replace(/https?:\/\/\S+/gi, "").replace(/www\.\S+/gi, "");
}
/**
* Removes HTML tags and entities
*/
public static removeHtmlTags(text: string): string {
return text
.replace(/<[^>]*>/g, "") // Remove HTML tags
.replace(/&[a-z]+;/gi, ""); // Remove HTML entities
}
/**
* Removes hashtags and mentions
*/
public static removeSocialTags(text: string): string {
return text.replace(/[@#]\S+/g, "");
}
/**
* Removes special characters but preserves Arabic diacritics and punctuation
*/
public static removeSpecialChars(text: string): string {
const arabicDiacritics =
/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const frenchSpecialChars = /[àâçéèêëîïôûùüÿñæœ]/;
return text
.split("")
.filter(
(char) =>
!!char.match(/[a-zA-Z0-9\s]/) ||
arabicDiacritics.test(char) ||
frenchSpecialChars.test(char)
)
.join("");
}
/**
* Removes extra whitespace, including newlines and tabs
*/
public static normalizeWhitespace(text: string): string {
return text.replace(/\s+/g, " ").trim();
}
/**
* Removes parentheses and their content
*/
public static removeParentheses(text: string): string {
return text
.replace(/[\(\{\[]/g, '') // Remove opening brackets/parentheses
.replace(/[\)\}\]]/g, ''); // Remove closing brackets/parentheses
}
/**
* Removes numeric sequences
*/
public static removeNumbers(text: string): string {
return text
.split(' ')
.filter(word => !/^\d+$/.test(word)) // Remove standalone numbers
.join(' ');
}
public static unCapitalize(text: string): string {
return text.toLowerCase();
}
public static removeExtraSpaces(text: string): string {
return text.replace(/\s+/g, " ").trim();
}
public static removePunctuation(text: string): string {
return text.replace(/[.,!?،؟]/g, "");
}
/**
* Main preprocessing function that applies all cleaning steps
*/
public static preprocess(text: string): string {
if (!text) return "";
let cleaned = text;
cleaned = this.removeUrls(cleaned);
cleaned = this.removeHtmlTags(cleaned);
cleaned = this.removeSocialTags(cleaned);
cleaned = this.removeEmojis(cleaned);
cleaned = this.removePunctuation(cleaned);
cleaned = this.removeSpecialChars(cleaned);
cleaned = this.removeParentheses(cleaned);
cleaned = this.removeNumbers(cleaned);
cleaned = this.normalizeWhitespace(cleaned);
cleaned = this.unCapitalize(cleaned);
cleaned = this.removeExtraSpaces(cleaned);
return cleaned;
}
/**
* Checks if the preprocessed text has enough content for language detection
*/
public static hasValidContent(text: string): boolean {
const cleaned = this.preprocess(text);
return cleaned.length >= 1 && /[a-zA-Z\u0600-\u06FF]/.test(cleaned);
}
/**
* Segments text into meaningful chunks for analysis
*/
public static segmentText(text: string): string[] {
const cleaned = this.preprocess(text);
return cleaned
.split(" ")
.filter((segment) => segment.length >= 3)
.map((segment) => segment.trim());
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

## File: textProcessing.test.ts
- Path: `/root/git/script_data/src/__tests__/textProcessing.test.ts`
- Size: 8.14 KB
- Extension: .ts
- Lines of code: 192

```ts
import { TextPreprocessor } from '../textProcessing';
describe('TextPreprocessor', () => {
describe('removeEmojis', () => {
it('should remove all emojis from text', () => {
const input = 'Hello 👋 World 🌍 How are you? 😊';
expect(TextPreprocessor.removeEmojis(input)).toBe('Hello  World  How are you? ');
});
it('should handle text without emojis', () => {
const input = 'Hello World!';
expect(TextPreprocessor.removeEmojis(input)).toBe('Hello World!');
});
it('should handle empty string', () => {
expect(TextPreprocessor.removeEmojis('')).toBe('');
});
});
describe('removeUrls', () => {
it('should remove http URLs', () => {
const input = 'Check this http://example.com for more info';
expect(TextPreprocessor.removeUrls(input)).toBe('Check this  for more info');
});
it('should remove https URLs', () => {
const input = 'Visit https://example.com/path?param=value';
expect(TextPreprocessor.removeUrls(input)).toBe('Visit ');
});
it('should remove www URLs', () => {
const input = 'Visit www.example.com for details';
expect(TextPreprocessor.removeUrls(input)).toBe('Visit  for details');
});
it('should handle multiple URLs', () => {
const input = 'Check http://first.com and www.second.com';
expect(TextPreprocessor.removeUrls(input)).toBe('Check  and ');
});
});
describe('removeHtmlTags', () => {
it('should remove HTML tags', () => {
const input = '<p>Hello</p> <br/> <div>World</div>';
expect(TextPreprocessor.removeHtmlTags(input)).toBe('Hello  World');
});
it('should remove HTML entities', () => {
const input = 'Hello &amp; World &quot;test&quot;';
expect(TextPreprocessor.removeHtmlTags(input)).toBe('Hello  World test');
});
it('should handle nested tags', () => {
const input = '<div><p>Hello <span>World</span></p></div>';
expect(TextPreprocessor.removeHtmlTags(input)).toBe('Hello World');
});
});
describe('removeSocialTags', () => {
it('should remove hashtags', () => {
const input = 'Hello #world #test';
expect(TextPreprocessor.removeSocialTags(input)).toBe('Hello  ');
});
it('should remove mentions', () => {
const input = 'Hello @user @another';
expect(TextPreprocessor.removeSocialTags(input)).toBe('Hello  ');
});
it('should handle mixed tags', () => {
const input = 'Hello @user check #hashtag';
expect(TextPreprocessor.removeSocialTags(input)).toBe('Hello  check ');
});
it('should remove french special characters', () => {
const input = 'éèêë àâ ôû ïî çñ';
expect(TextPreprocessor.removeSocialTags(input)).toBe('éèêë àâ ôû ïî çñ');
});
it('should remove arabic special characters', () => {
const input = 'مرحبا العالم';
expect(TextPreprocessor.removeSocialTags(input)).toBe('مرحبا العالم');
});
});
describe('removeSpecialChars', () => {
it('should preserve Arabic text and diacritics', () => {
const input = 'مرحبا العالم';
expect(TextPreprocessor.removeSpecialChars(input)).toBe('مرحبا العالم');
});
it('should preserve French special characters', () => {
const input = 'éèêë àâ ôû ïî çñ';
expect(TextPreprocessor.removeSpecialChars(input)).toBe('éèêë àâ ôû ïî çñ');
});
it('should preserve basic punctuation', () => {
const input = 'Hello World! How to 100% of the time?';
expect(TextPreprocessor.removeSpecialChars(input)).toBe('Hello World How to 100 of the time');
});
});
describe('normalizeWhitespace', () => {
it('should normalize multiple spaces', () => {
const input = 'Hello    World';
expect(TextPreprocessor.normalizeWhitespace(input)).toBe('Hello World');
});
it('should normalize tabs and newlines', () => {
const input = 'Hello\tWorld\nTest';
expect(TextPreprocessor.normalizeWhitespace(input)).toBe('Hello World Test');
});
it('should trim leading and trailing whitespace', () => {
const input = '  Hello World  ';
expect(TextPreprocessor.normalizeWhitespace(input)).toBe('Hello World');
});
});
describe('removeParentheses', () => {
it('should remove round parentheses and content', () => {
const input = 'Hello (hidden) World';
expect(TextPreprocessor.removeParentheses(input)).toBe('Hello hidden World');
});
it('should remove curly braces and content', () => {
const input = 'Hello {hidden} World';
expect(TextPreprocessor.removeParentheses(input)).toBe('Hello hidden World');
});
it('should remove square brackets and content', () => {
const input = 'Hello [hidden] World';
expect(TextPreprocessor.removeParentheses(input)).toBe('Hello hidden World');
});
it('should handle nested parentheses', () => {
const input = 'Hello (outer (inner)) World';
expect(TextPreprocessor.removeParentheses(input)).toBe('Hello outer inner World');
});
});
describe('removeNumbers', () => {
it('should remove numbers at start of string', () => {
const input = '123 Hello World';
expect(TextPreprocessor.removeNumbers(input)).toBe('Hello World');
});
it('should remove numbers in middle of string', () => {
const input = 'Hello 456 World';
expect(TextPreprocessor.removeNumbers(input)).toBe('Hello World');
});
it('should remove numbers at end of string', () => {
const input = 'Hello World 789';
expect(TextPreprocessor.removeNumbers(input)).toBe('Hello World');
});
it('should remove numbers in nested parentheses', () => {
const input = 'Hello (123) World';
expect(TextPreprocessor.removeNumbers(input)).toBe('Hello (123) World');
});
});
describe('unCapitalize', () => {
it('should convert text to lowercase', () => {
const input = 'Hello WORLD Test';
expect(TextPreprocessor.unCapitalize(input)).toBe('hello world test');
});
it('should handle already lowercase text', () => {
const input = 'hello world';
expect(TextPreprocessor.unCapitalize(input)).toBe('hello world');
});
});
describe('removeExtraSpaces', () => {
it('should remove multiple spaces between words', () => {
const input = 'Hello    World     Test';
expect(TextPreprocessor.removeExtraSpaces(input)).toBe('Hello World Test');
});
it('should trim leading and trailing spaces', () => {
const input = '   Hello World   ';
expect(TextPreprocessor.removeExtraSpaces(input)).toBe('Hello World');
});
});
describe('removePunctuation', () => {
it('should remove basic punctuation', () => {
const input = 'Hello, World! How? Test.';
expect(TextPreprocessor.removePunctuation(input)).toBe('Hello World How Test');
});
it('should remove Arabic punctuation', () => {
const input = 'مرحبا، العالم؟';
expect(TextPreprocessor.removePunctuation(input)).toBe('مرحبا العالم');
});
});
describe('preprocess', () => {
it('should handle empty input', () => {
expect(TextPreprocessor.preprocess('')).toBe('');
});
it('should process complex text', () => {
const input = 'Hello World! 👋 https://example.com #hashtag @mention (hidden)';
expect(TextPreprocessor.preprocess(input)).toBe('hello world hidden');
});
});
describe('hasValidContent', () => {
it('should validate text content properly', () => {
expect(TextPreprocessor.hasValidContent('Hello')).toBeTruthy();
expect(TextPreprocessor.hasValidContent('مرحبا')).toBeTruthy();
expect(TextPreprocessor.hasValidContent('123')).toBeFalsy();
});
});
describe('segmentText', () => {
it('should segment text correctly', () => {
const input = 'hello world test';
const expected = ['hello', 'world', 'test'];
expect(TextPreprocessor.segmentText(input)).toEqual(expected);
});
it('should filter short segments', () => {
const input = 'a bb ccc';
expect(TextPreprocessor.segmentText(input)).toEqual(['ccc']);
});
});
});
```

---------------------------------------------------------------------------

## File: FrequencyAnalyzer.ts
- Path: `/root/git/script_data/src/languageDetector/FrequencyAnalyzer.ts`
- Size: 1.57 KB
- Extension: .ts
- Lines of code: 37

```ts
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
```

---------------------------------------------------------------------------

## File: LangDetectStrategy.ts
- Path: `/root/git/script_data/src/languageDetector/LangDetectStrategy.ts`
- Size: 4.19 KB
- Extension: .ts
- Lines of code: 126

```ts
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
console.log("detection", text, detection);
if (!detection?.length) {
console.error("no detection", text);
return { lang: "error", confidence: 0 };
}
const directDetection = this.handleDirectDetection(detection);
if (directDetection) return directDetection;
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
```

---------------------------------------------------------------------------

## File: LanguageDetectionService.ts
- Path: `/root/git/script_data/src/languageDetector/LanguageDetectionService.ts`
- Size: 1.10 KB
- Extension: .ts
- Lines of code: 31

```ts
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
console.log(result);
return {
text,
cleaned,
detectedLanguage: result.lang,
confidence: result.confidence,
};
}
}
```

---------------------------------------------------------------------------

## File: factory.ts
- Path: `/root/git/script_data/src/languageDetector/factory.ts`
- Size: 1.08 KB
- Extension: .ts
- Lines of code: 25

```ts
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
```

---------------------------------------------------------------------------

## File: index.ts
- Path: `/root/git/script_data/src/languageDetector/index.ts`
- Size: 198.00 B
- Extension: .ts
- Lines of code: 6

```ts
export * from "./FrequencyAnalyzer";
export * from "./LangDetectStrategy";
export * from "./LanguageDetectionService";
export * from "./interface";
export * from "./type";
export * from "./factory";
```

---------------------------------------------------------------------------

## File: interface.ts
- Path: `/root/git/script_data/src/languageDetector/interface.ts`
- Size: 465.00 B
- Extension: .ts
- Lines of code: 16

```ts
import { DetectedLanguage } from "./type";
export interface ILanguageAnalyzer {
analyzeText(text: string): LanguageAnalysis;
}
export interface ITextPreprocessor {
preprocess(text: string): string;
hasValidContent(text: string): boolean;
segmentText(text: string): string[];
}
export interface LanguageAnalysis {
lang: DetectedLanguage;
confidence: number;
}
export interface ILanguageDetectionStrategy {
detect(text: string): LanguageAnalysis;
}
```

---------------------------------------------------------------------------

## File: type.ts
- Path: `/root/git/script_data/src/languageDetector/type.ts`
- Size: 240.00 B
- Extension: .ts
- Lines of code: 8

```ts
export type DetectedLanguage = Lang | "empty" | "unknown" | "error";
export type Lang = "fr" | "en" | "ar";
export interface LanguageResult {
text: string;
cleaned?: string;
detectedLanguage: DetectedLanguage;
confidence: number;
}
```

---------------------------------------------------------------------------

## File: Files.ts
- Path: `/root/git/script_data/src/utils/Files.ts`
- Size: 1.16 KB
- Extension: .ts
- Lines of code: 44

```ts
import * as fs from "fs/promises";
import Papa from "papaparse";
import { Post } from "../types";
import { PostSchema } from "../types";
class Files {
static async processFile(
filePath: string,
columnName: keyof Post = "caption"
): Promise<
{
id: string;
caption: string;
}[]
> {
try {
const content = await fs.readFile(filePath, "utf-8");
const results = await new Promise<Post[]>((resolve, reject) => {
Papa.parse(content, {
header: true,
skipEmptyLines: true,
complete: (results) => {
const valid = results.data
.map((row) => {
try {
return PostSchema.parse(row);
} catch (error) {
console.error("Row parsing error:", row, error);
return null;
}
})
.filter((row): row is Post => row !== null);
resolve(valid);
},
error: reject,
});
});
return results;
} catch (error) {
console.error("File processing error:", error);
throw error;
}
}
}
export default Files;
```

---------------------------------------------------------------------------

## File: LanguageDetectorCases.test.ts
- Path: `/root/git/script_data/src/languageDetector/__tests__/LanguageDetectorCases.test.ts`
- Size: 1.56 KB
- Extension: .ts
- Lines of code: 35

```ts
import { languageDetector } from "../factory";
describe("LanguageDetector", () => {
describe("English detection", () => {
it("should detect basic English phrases", () => {
expect(languageDetector("hello paris").detectedLanguage).toBe("en");
});
});
describe("French detection", () => {
it("should detect basic French phrases", () => {
expect(languageDetector("Bonjour le monde").detectedLanguage).toBe("fr");
expect(languageDetector("Ciao mondo").detectedLanguage).toBe("fr");
});
});
describe("Arabic detection", () => {
it("should detect basic Arabic phrases", () => {
expect(languageDetector("مرحبا بالعالم").detectedLanguage).toBe("ar");
});
});
describe("Unknown language handling", () => {
it("should mark mixed/ambiguous phrases as unknown", () => {
expect(languageDetector("bonjour man meknes").detectedLanguage).toBe("unknown");
expect(languageDetector("mashalah").detectedLanguage).toBe("unknown");
});
});
describe("Empty input handling", () => {
it("should handle empty or invalid input", () => {
expect(languageDetector("").detectedLanguage).toBe("empty");
expect(languageDetector("%").detectedLanguage).toBe("empty");
});
});
});
```

---------------------------------------------------------------------------