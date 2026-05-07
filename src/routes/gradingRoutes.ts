import { FastifyPluginAsync } from "fastify";
import { gradeAnswersController } from "../controllers/gradingController";

export const gradingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/grade", gradeAnswersController);
};
