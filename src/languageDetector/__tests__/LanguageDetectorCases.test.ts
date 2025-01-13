import { languageDetector } from "../factory";

const cases = [
  {
    text: "Hello, world!",
    expected: "en",
  },
  {
    text: "",
    expected: "empty",
  },
  {
    // test arabic
    text: "مرحبا بالعالم",
    expected: "ar",
  },
  {
    // test french
    text: "Bonjour le monde",
    expected: "fr",
  },
  {
    // test spanish
    text: "Hola mundo",
    expected: "es",
  },
  {
    // test german
    text: "Hallo Welt",
    expected: "de",
  },
  {
    // test italian
    text: "Ciao mondo",
    expected: "it",
  },
];
describe("LanguageDetector", () => {
  cases.forEach(({ text, expected }) => {
    it(`should detect language ${text}`, () => {
      const result = languageDetector(text);
      expect(result.detectedLanguage).toEqual(expected);
    });
  });
});
