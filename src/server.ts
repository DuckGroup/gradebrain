import "dotenv/config";
import Fastify from "fastify";
import { gradingRoutes } from "./routes/gradingRoutes";

export function buildServer() {
  const server = Fastify({ logger: true });

  server.get("/health", async () => ({ status: "ok" }));
  server.register(gradingRoutes, { prefix: "/api" });

  return server;
}
