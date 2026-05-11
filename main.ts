import "dotenv/config";
import Fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { registerRoutes } from "./src/routes";

const fastify = Fastify({ logger: true });

// Register multipart form data support
fastify.register(fastifyMultipart);

// Register all routes
fastify.register(registerRoutes);

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server started on http://0.0.0.0:3000");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown error");
    }
    process.exit(1);
  }
};

start();
