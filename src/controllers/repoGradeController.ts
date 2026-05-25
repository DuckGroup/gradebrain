import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import gradeService from "../services/gradeService";
import repositoryService from "../services/repositoryService";
import { GradeInputSchema, GradeInput } from "../schemas/gradeSchema";

class RepoGradeController {
  async gradeRepo(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<object> {
    try {
      const parts = request.parts();
      let syllabusBuffer: Buffer | null = null;
      let repoUrl: string | undefined;
      let repoZipBuffer: Buffer | null = null;
      let prompt: string | undefined;

      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname === "syllabus") {
            syllabusBuffer = await part.toBuffer();
            continue;
          }

          if (part.fieldname === "repoZip" || part.fieldname === "repo") {
            repoZipBuffer = await part.toBuffer();
          }

          continue;
        }

        if (part.fieldname === "repoUrl") {
          const trimmedRepoUrl = part.value.trim();
          repoUrl = trimmedRepoUrl.length > 0 ? trimmedRepoUrl : undefined;
          continue;
        }

        if (part.fieldname === "prompt") {
          const trimmedPrompt = part.value.trim();
          prompt = trimmedPrompt.length > 0 ? trimmedPrompt : undefined;
        }
      }

      if (!syllabusBuffer) {
        reply.code(400);
        return {
          success: false,
          error: "Missing syllabus file",
        };
      }

      if (!repoUrl && !repoZipBuffer) {
        reply.code(400);
        return {
          success: false,
          error: "Missing repository URL or zip file",
        };
      }

      const repositoryText = await repositoryService.readRepository({
        repoUrl,
        repoZip: repoZipBuffer ?? undefined,
      });

      const input: GradeInput = GradeInputSchema.parse({
        syllabus: syllabusBuffer.toString("utf8"),
        submission: repositoryText,
        prompt,
      });

      const result = await gradeService.gradeContent(input);

      return {
        success: true,
        result,
      };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        };
      }

      if (error instanceof Error) {
        const statusCode =
          /^(Missing|Invalid|Only public|Failed to|Repository default branch|No readable)/i.test(
            error.message,
          )
            ? 400
            : 500;
        reply.code(statusCode);
        return { success: false, error: error.message };
      }

      reply.code(500);
      return { success: false, error: "Unknown error" };
    }
  }
}

export default new RepoGradeController();
