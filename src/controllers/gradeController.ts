import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { GradeInputSchema, GradeInput } from "../schemas/gradeSchema";
import gradeService from "../services/gradeService";

class GradeController {
  async grade(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<object> {
    try {
      const parts = await request.files();
      let syllabusBuffer: Buffer | null = null;
      let examBuffer: Buffer | null = null;

      for await (const part of parts) {
        if (part.type !== "file") {
          continue;
        }
        if (part.fieldname === "syllabus") {
          syllabusBuffer = await part.toBuffer();
          continue;
        }
        if (part.fieldname === "exam") {
          examBuffer = await part.toBuffer();
        }
      }

      if (!syllabusBuffer || !examBuffer) {
        reply.code(400);
        return {
          success: false,
          error: "Missing syllabus or exam file",
        };
      }

      const input: GradeInput = GradeInputSchema.parse({
        syllabus: syllabusBuffer.toString("utf8"),
        exam: examBuffer.toString("utf8"),
      });

      const result = await gradeService.gradeContent(input);

      return {
        success: true,
        result: result,
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
        reply.code(500);
        return { success: false, error: error.message };
      }
      reply.code(500);
      return { success: false, error: "Unknown error" };
    }
  }
}

export default new GradeController();
