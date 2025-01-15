import { languageDetector } from "../factory";

describe("LanguageDetector", () => {
  describe("English detection", () => {
    it("should detect basic English phrases", () => {
      expect(languageDetector("Hello, world!").detectedLanguage).toBe("en");
      expect(languageDetector("Hello 23🎂❤️").detectedLanguage).toBe("en"); 
      expect(languageDetector("love @dermocare").detectedLanguage).toBe("en");
      expect(languageDetector("hello paris").detectedLanguage).toBe("fr");
      expect(languageDetector("me my self i").detectedLanguage).toBe("en");
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
      // expect(languageDetector("mashalah").detectedLanguage).toBe("unknown");
      expect(languageDetector("bonjour man meknes").detectedLanguage).toBe("unknown");
    });
  });

  describe("Empty input handling", () => {
    it("should handle empty or invalid input", () => {
      expect(languageDetector("").detectedLanguage).toBe("empty");
      expect(languageDetector("%").detectedLanguage).toBe("empty");
    });
  });
});
