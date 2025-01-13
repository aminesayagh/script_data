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
