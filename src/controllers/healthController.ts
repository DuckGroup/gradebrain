import { FastifyRequest, FastifyReply } from "fastify";

class HealthController {
  async check(request: FastifyRequest, reply: FastifyReply): Promise<object> {
    return { status: "ok" };
  }
}

export default new HealthController();
