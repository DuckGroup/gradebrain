import { z } from "zod";

export const GradeSchema = z.enum(["E", "D", "C", "B", "A"]);

export const StudentAnswerSchema = z.object({
  questionId: z.string().min(1),
  question: z.string().min(1),
  studentAnswer: z.string().min(1),
});

export const GradeRequestSchema = z.object({
  answers: z.array(StudentAnswerSchema).min(1),
});

export const GradingResultSchema = z.object({
  questionId: z.string().min(1),
  correct: z.boolean(),
  grade: GradeSchema,
});

export type StudentAnswer = z.infer<typeof StudentAnswerSchema>;
export type GradeRequestBody = z.infer<typeof GradeRequestSchema>;
export type GradingResult = z.infer<typeof GradingResultSchema>;
