import OpenAI from "openai";

async function main(): Promise<void> {
  const client = new OpenAI();

  const response = await client.responses.create({
    model: "gpt-5.5",
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
