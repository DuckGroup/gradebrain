import { AIOutputSchema, GradeInput } from "../schemas/gradeSchema";
import githubModelsClient from "./githubModelsClient";

function extractJson(content: string): string {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model returned non-JSON or malformed JSON");
  }

  return content.slice(start, end + 1);
}

class GradeService {
  async gradeContent(request: GradeInput): Promise<string> {
    const userContent = [
      "Syllabus:",
      request.syllabus,
      "",
      "Exam:",
      request.exam,
    ].join("\n");

    const content = await githubModelsClient.gradeCompletion(userContent, 0);

    const parsed = AIOutputSchema.parse(JSON.parse(extractJson(content)));

    return JSON.stringify(parsed);
  }
}

export default new GradeService();
