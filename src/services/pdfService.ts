import { PDFParse } from "pdf-parse";

class PdfService {
  async parsePDF(dataBuffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  }
}

export default new PdfService();
