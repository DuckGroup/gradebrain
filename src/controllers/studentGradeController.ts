import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import gradeService from "../services/gradeService";
import { GradeInputSchema, GradeInput } from "../schemas/gradeSchema";
import { truncateTexts } from "../utils/textTruncation";

const SUBMISSIONS_ROOT = path.join(process.cwd(), "submissions/IT KIDS");

const BodySchema = z.object({
  studentFile: z.string().optional(),
  syllabusFile: z.string().optional(),
  studentContent: z.string().optional(),
  syllabusContent: z.string().optional(),
  prompt: z.string().optional(),
});

class StudentGradeController {
  async gradeStudent(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<object> {
    try {
      const body = BodySchema.parse(request.body ?? {});

      let syllabusText: string | undefined = body.syllabusContent;
      let submissionText: string | undefined = body.studentContent;

      if (body.syllabusFile && !syllabusText) {
        const syllabusPath = path.join(SUBMISSIONS_ROOT, body.syllabusFile);
        const buf = await readFile(syllabusPath);
        syllabusText = buf.toString("utf8");
      }

      if (body.studentFile && !submissionText) {
        const studentPath = path.join(SUBMISSIONS_ROOT, body.studentFile);
        const buf = await readFile(studentPath);
        submissionText = buf.toString("utf8");
      }

      if (!syllabusText || !submissionText) {
        reply.code(400);
        return { success: false, error: "Missing syllabus or student submission" };
      }

      // Apply intelligent truncation to avoid token limits
      const truncated = truncateTexts(submissionText, syllabusText);
      syllabusText = truncated.syllabus;
      submissionText = truncated.submission;

      // Build prompt: include user's prompt and automatic instructions
      const userPrompt = body.prompt?.trim() ?? "";
      const deviationInstruction = `Important: Do NOT use any scores, marks or annotations already written on the paper when computing the grade. Grade independently based only on the provided syllabus and the student's answers.

CRITICAL: Identify and analyze EACH question/task in the submission:
1. For each question/task, briefly note what it's asking (e.g., "Question 1: What is a relational database?")
2. Grade that answer based on the syllabus criteria
3. If the paper has a mark for that question (e.g., "✓" or "✗" or points), compare your assessment to that mark
4. If you disagree, clearly explain WHY in a "Deviations" subsection

Your final 'comment' should contain:
- Overall reasoning for your grade
- A "Per-Task Analysis" section listing key questions and whether marks align with course requirements
- A "Deviations" subsection explaining where you differ from paper marks and why

Return ONLY valid JSON matching the expected schema: {"correct": boolean, "grade": "IG" | "G" | "VG", "comment": string}`;

      const combinedPrompt = [userPrompt, deviationInstruction].filter(Boolean).join("\n\n");

      const input: GradeInput = GradeInputSchema.parse({
        syllabus: syllabusText,
        submission: submissionText,
        prompt: combinedPrompt,
      });

      const result = await gradeService.gradeContent(input);

      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { success: false, error: "Invalid request body", details: error.issues };
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

export default new StudentGradeController();
