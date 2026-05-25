import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { GradeInputSchema, GradeInput } from "../schemas/gradeSchema";
import gradeService from "../services/gradeService";

class GradeController {
  async grade(request: FastifyRequest, reply: FastifyReply): Promise<object> {
    try {
      const parts = request.parts();
      let syllabusBuffer: Buffer | null = null;
      let submissionBuffer: Buffer | null = null;
      let prompt: string | undefined;

      for await (const part of parts) {
        if (part.type !== "file") {
          if (part.fieldname === "prompt") {
            const trimmedPrompt = part.value.trim();
            prompt = trimmedPrompt.length > 0 ? trimmedPrompt : undefined;
          }
          continue;
        }
        if (part.fieldname === "syllabus") {
          syllabusBuffer = await part.toBuffer();
          continue;
        }
        if (part.fieldname === "exam") {
          submissionBuffer = await part.toBuffer();
        }
      }

      if (!syllabusBuffer || !submissionBuffer) {
        reply.code(400);
        return {
          success: false,
          error: "Missing syllabus or exam file",
        };
      }

      const input: GradeInput = GradeInputSchema.parse({
        syllabus: syllabusBuffer.toString("utf8"),
        submission: submissionBuffer.toString("utf8"),
        prompt,
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
