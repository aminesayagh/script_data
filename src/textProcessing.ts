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
    // Preserve Arabic diacritics (harakat)
    const arabicDiacritics =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    // Keep basic punctuation that might be useful for sentence splitting
    const basicPunctuation = /[.,!?،؟]/;

    return text
      .split("")
      .filter(
        (char) =>
          // English letters, digits, and spaces
          !!char.match(/[a-zA-Z0-9\s]/) ||
          // Arabic characters and diacritics
          arabicDiacritics.test(char) ||
          // Basic punctuation
          basicPunctuation.test(char) ||
          // French special characters
          !!char.match(/[àâçéèêëîïôûùüÿñæœ]/)
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
    // Remove opening brackets/parentheses
    return text
      .replace(/[\(\{\[]/g, '') // Remove opening brackets/parentheses
      .replace(/[\)\}\]]/g, ''); // Remove closing brackets/parentheses
  }

  /**
   * Removes numeric sequences
   */
  public static removeNumbers(text: string): string {
    // Split text into words and filter out any that contain numbers
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

    // Apply cleaning steps in sequence
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
  public static hasValidContent(text: string): boolean {
    const cleaned = this.preprocess(text);
    // Require at least 3 characters after preprocessing
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
