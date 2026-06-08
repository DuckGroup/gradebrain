import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import OpenAI from "openai";

const execFileAsync = promisify(execFile);
const OCR_MODEL = process.env.PDF_OCR_MODEL ?? "gpt-4.1-mini";

class PdfService {
  async parsePDF(dataBuffer: Buffer): Promise<string> {
    return this.extractWithVisionOcr(dataBuffer);
  }

  private async extractWithVisionOcr(dataBuffer: Buffer): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Scanned or image-based PDF detected. Set OPENAI_API_KEY to enable OCR fallback.",
      );
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gradebrain-pdf-"));
    const pdfPath = path.join(tempDir, "input.pdf");

    try {
      await fs.writeFile(pdfPath, dataBuffer);
      await execFileAsync("pdftoppm", [
        "-png",
        "-r",
        "180",
        pdfPath,
        path.join(tempDir, "page"),
      ]);

      const pageFiles = (await fs.readdir(tempDir))
        .filter((file) => /^page-\d+\.png$/.test(file))
        .sort(
          (left, right) =>
            Number(left.match(/(\d+)\.png$/)?.[1] ?? "0") -
            Number(right.match(/(\d+)\.png$/)?.[1] ?? "0"),
        );

      if (pageFiles.length === 0) {
        throw new Error("No rendered PDF pages were produced");
      }

      const client = new OpenAI({ apiKey });
      const pages: string[] = [];

      for (const [index, file] of pageFiles.entries()) {
        const imagePath = path.join(tempDir, file);
        const imageBase64 = await fs.readFile(imagePath, { encoding: "base64" });

        const response = await client.responses.create({
          model: OCR_MODEL,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Transcribe all visible text from page ${index + 1} of this PDF. Preserve question numbers, headings, answers, annotations, checkboxes, marks, and line breaks as faithfully as possible. Do not summarize.`,
                },
                {
                  type: "input_image",
                  image_url: `data:image/png;base64,${imageBase64}`,
                  detail: "high",
                },
              ],
            },
          ],
        });

        const pageText = response.output_text.trim();
        if (pageText) {
          pages.push(`[PAGE ${index + 1}]\n${pageText}`);
        }
      }

      return pages.join("\n\n");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to render or OCR PDF: ${error.message}`);
      }
      throw new Error("Failed to render or OCR PDF");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

export default new PdfService();
