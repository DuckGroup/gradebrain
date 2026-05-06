import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

async function main(): Promise<void> {
  const client = new OpenAI({
    apiKey: apiKey,
  });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Write a one-sentence bedtime story about a unicorn.",
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
