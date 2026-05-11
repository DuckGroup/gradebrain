import { FastifyRequest, FastifyReply } from "fastify";
import pdfService from "../services/pdfService";

class PdfController {
  async parsePdf(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<object> {
    try {
      const data = await request.file();

      if (!data) {
        reply.code(400);
        return { success: false, error: "No file provided" };
      }

      const buffer = await data.toBuffer();
      const text = await pdfService.parsePDF(buffer);

      return {
        success: true,
        text: text,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.code(500);
        return { success: false, error: error.message };
      }
      reply.code(500);
      return { success: false, error: "Unknown error" };
    }
  }
}

export default new PdfController();
