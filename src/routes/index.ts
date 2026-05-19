import { FastifyInstance } from "fastify";
import healthController from "../controllers/healthController";
import gradeController from "../controllers/gradeController";
import pdfController from "../controllers/pdfController";

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check route
  fastify.get("/health", (request, reply) =>
    healthController.check(request, reply),
  );

  // Grade content route
  fastify.post("/grade", (request, reply) =>
    gradeController.grade(request, reply),
  );

  // Parse PDF route
  fastify.post("/parse-pdf", (request, reply) =>
    pdfController.parsePdf(request, reply),
  );
}
