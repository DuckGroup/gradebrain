import { z } from "zod";

export const AIOutputSchema = z.object({
  correct: z.boolean(),
  grade: z.enum(["F", "E", "D", "C", "B", "A"]),
  comment: z.string().min(1, "Comment cannot be empty"),
});

export const GradeInputSchema = z.object({
  syllabus: z.string().min(1, "Syllabus content cannot be empty"),
  submission: z.string().min(1, "Submission content cannot be empty"),
  prompt: z.string().trim().min(1).optional(),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type GradeInput = z.infer<typeof GradeInputSchema>;
