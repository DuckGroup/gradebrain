import { z } from "zod";

export const AIOutputSchema = z.object({
  correct: z.boolean(),
  grade: z.enum(["F", "E", "D", "C", "B", "A"]),
});

export const GradeRequestSchema = z.object({
  systemPrompt: z.string().min(1, "System prompt cannot be empty"),
  userContent: z.string().min(1, "User content cannot be empty"),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type GradeRequest = z.infer<typeof GradeRequestSchema>;
