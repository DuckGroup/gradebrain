import "dotenv/config";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const apiKey = process.env.OPENAI_API_KEY;

const AI_output = z.object({
  correct: z.boolean(),
  grade: z.enum(["F", "E", "D", "C", "B", "A"]),
});

async function main(): Promise<void> {
  const client = new OpenAI({
    apiKey: apiKey,
  });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content: "The earth is flat because the moon is tiny",
      },
    ],
    text: {
      format: zodTextFormat(AI_output, "AI_output"),
    },
  });

  console.log(response.output_text);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    return;
  }
  console.error("Unknown error");
});
