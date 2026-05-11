import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { AIOutputSchema, GradeRequest } from "../schemas/gradeSchema";

const apiKey = process.env.OPENAI_API_KEY;

class GradeService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async gradeContent(request: GradeRequest): Promise<string> {
    const response = await this.client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: request.systemPrompt,
        },
        {
          role: "user",
          content: request.userContent,
        },
      ],
      text: {
        format: zodTextFormat(AIOutputSchema, "AI_output"),
      },
    });

    return response.output_text;
  }
}

export default new GradeService();
