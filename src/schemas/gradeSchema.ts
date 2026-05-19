import { z } from "zod";

export const AIOutputSchema = z.object({
  correct: z.boolean(),
  grade: z.enum(["F", "E", "D", "C", "B", "A"]),
});

export const GradeInputSchema = z.object({
  syllabus: z.string().min(1, "Syllabus content cannot be empty"),
  exam: z.string().min(1, "Exam content cannot be empty"),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type GradeInput = z.infer<typeof GradeInputSchema>;
