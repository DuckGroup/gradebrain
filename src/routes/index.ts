import { FastifyInstance } from "fastify";
import healthController from "../controllers/healthController";
import gradeController from "../controllers/gradeController";
import repoGradeController from "../controllers/repoGradeController";
import pdfController from "../controllers/pdfController";
import studentGradeController from "../controllers/studentGradeController";

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check route
  fastify.get("/health", (request, reply) =>
    healthController.check(request, reply),
  );

  // Grade content route
  fastify.post("/grade", (request, reply) =>
    gradeController.grade(request, reply),
  );

  fastify.post("/grade-repo", (request, reply) =>
    repoGradeController.gradeRepo(request, reply),
  );

  // Grade a student by referencing files in submissions or by raw content
  fastify.post("/grade-student", (request, reply) =>
    studentGradeController.gradeStudent(request, reply),
  );

  // Parse PDF route
  fastify.post("/parse-pdf", (request, reply) =>
    pdfController.parsePdf(request, reply),
  );
}
