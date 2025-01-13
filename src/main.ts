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
        console.log(result);
        return { ...result, id: row.id };
      });

    // Prepare output data
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

    // Generate statistics
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

    // Write output
    const csvContent = Papa.unparse(outputData, {
      header: true,
      skipEmptyLines: true,
      columns: ["id", "lang"],
    });

    const outputPath = filePath.replace(".csv", "_output.csv");
    await fs.writeFile(outputPath, csvContent, "utf-8");

    // Got the unknown posts and save them to a json file
    const unknownPosts = await Promise.all(results.map((result) => result.detectedLanguage === "unknown" ? result : null).filter((post) => post !== null));
    await fs.writeFile("unknown_posts.json", JSON.stringify(unknownPosts, null, 2), "utf-8");
  } catch (error) {
    console.error("Processing error:", error);
    process.exit(1);
  }
}
