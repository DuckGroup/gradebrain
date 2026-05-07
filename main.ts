import { buildServer } from "./src/server";

async function main(): Promise<void> {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";

  await server.listen({ port, host });
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    return;
  }
  console.error("Unknown error");
});
