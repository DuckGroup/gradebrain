import Fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { registerRoutes } from "./routes";

type AppOptions = {
  logger?: boolean;
};

export default function buildApp(options: AppOptions = {}) {
  const fastify = Fastify({ logger: options.logger ?? false });

  // Register multipart form data support
  fastify.register(fastifyMultipart);

  // Register all routes
  fastify.register(registerRoutes);

  return fastify;
}
