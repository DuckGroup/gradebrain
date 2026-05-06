import fs from "fs";
import pdf from "pdf-parse";

async function pdfReader(){
    const dataBuffer = fs.readFileSync("pdf.pdf")

    const data = await pdf(dataBuffer);

    console.log("Text:");
    console.log(data.text);
    
}

pdfReader();