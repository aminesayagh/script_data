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
    // Preserve Arabic diacritics (harakat)
    const arabicDiacritics =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    // Keep basic punctuation that might be useful for sentence splitting
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

  /**
   * Main preprocessing function that applies all cleaning steps
   */
  static preprocess(text: string): string {
    if (!text) return "";

    let cleaned = text;

    // Apply cleaning steps in sequence
    cleaned = this.removeUrls(cleaned);
    cleaned = this.removeHtmlTags(cleaned);
    cleaned = this.removeSocialTags(cleaned);
    cleaned = this.removeEmojis(cleaned);
    cleaned = this.removeParentheses(cleaned);
    cleaned = this.removeNumbers(cleaned);
    cleaned = this.removeSpecialChars(cleaned);
    cleaned = this.normalizeWhitespace(cleaned);

    return cleaned;
  }

  /**
   * Checks if the preprocessed text has enough content for language detection
   */
  static hasValidContent(text: string): boolean {
    const cleaned = this.preprocess(text);
    // Require at least 3 characters after preprocessing
    return cleaned.length >= 3 && /[a-zA-Z\u0600-\u06FF]/.test(cleaned);
  }

  /**
   * Segments text into meaningful chunks for analysis
   */
  static segmentText(text: string): string[] {
    const cleaned = this.preprocess(text);

    // Split on sentence boundaries, including Arabic question marks and commas
    const segments = cleaned
      .split(/[.!?،؟]+/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length >= 3); // Filter out very short segments

    return segments;
  }
}
