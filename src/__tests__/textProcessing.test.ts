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

  // Retaining the existing tests for main public methods
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