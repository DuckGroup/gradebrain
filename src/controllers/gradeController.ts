import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { GradeRequestSchema, GradeRequest } from "../schemas/gradeSchema";
import gradeService from "../services/gradeService";

class GradeController {
  async grade(
    request: FastifyRequest<{ Body: GradeRequest }>,
    reply: FastifyReply,
  ): Promise<object> {
    try {
      const body = GradeRequestSchema.parse(request.body);
      const result = await gradeService.gradeContent(body);

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
          details: error.errors,
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
