import fs from "node:fs";
import { PDFParse } from "pdf-parse";

async function pdfReader() {
  const dataBuffer = fs.readFileSync("pdf.pdf");
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();
  console.log("Text:");
  console.log(data.text);
  await parser.destroy();
}

pdfReader();