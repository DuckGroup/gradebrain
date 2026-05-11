import { PDFParse } from "pdf-parse";

export async function parsePDF(dataBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();
  await parser.destroy();
  return data.text;
}
