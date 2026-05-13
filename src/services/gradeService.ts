import { AIOutputSchema, GradeRequest } from "../schemas/gradeSchema";
import githubModelsClient from "./githubModelsClient";

const jsonInstruction =
  'Return only valid JSON matching this schema: {"correct": boolean, "grade": "F" | "E" | "D" | "C" | "B" | "A" }';

function extractJson(content: string): string {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model returned non-JSON or malformed JSON");
  }

  return content.slice(start, end + 1);
}

class GradeService {
  async gradeContent(request: GradeRequest): Promise<string> {
    const content = await githubModelsClient.chatCompletion(
      [
        {
          role: "system",
          content: `${request.systemPrompt}\n\n${jsonInstruction}`,
        },
        {
          role: "user",
          content: request.userContent,
        },
      ],
      0,
    );

    const parsed = AIOutputSchema.parse(JSON.parse(extractJson(content)));

    return JSON.stringify(parsed);
  }
}

export default new GradeService();
