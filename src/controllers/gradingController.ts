import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { GradeRequestSchema } from "../types/grading";
import { GradingService } from "../services/gradingService";

const gradingService = new GradingService();

export async function gradeAnswersController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { answers } = GradeRequestSchema.parse(request.body);
    const results = await gradingService.gradeAnswers(answers);
    await reply.code(200).send({ results });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      await reply
        .code(400)
        .send({ message: "Invalid request body", issues: error.issues });
      return;
    }

    if (error instanceof Error) {
      await reply.code(500).send({ message: error.message });
      return;
    }

    await reply.code(500).send({ message: "Unknown server error" });
  }
}
