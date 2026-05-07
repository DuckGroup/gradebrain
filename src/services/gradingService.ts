import OpenAI from "openai";
import { z } from "zod";
import {
  GradingResultSchema,
  StudentAnswer,
  type GradingResult,
} from "../types/grading";

function assertUniqueQuestionIds(answers: StudentAnswer[]): void {
  const seenIds = new Set<string>();
  for (const answer of answers) {
    if (seenIds.has(answer.questionId)) {
      throw new Error(`Duplicate questionId in request: ${answer.questionId}`);
    }
    seenIds.add(answer.questionId);
  }
}

function parseModelJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedJson?.[1]) {
      return JSON.parse(fencedJson[1]);
    }
    throw new Error("Model response was not valid JSON.");
  }
}

function assertOneToOneMapping(
  answers: StudentAnswer[],
  results: GradingResult[],
): void {
  if (answers.length !== results.length) { 
    throw new Error(
      `1:1 mapping violation. answers=${answers.length}, results=${results.length}`,
    );
  }

  const answerIds = new Set(answers.map((answer) => answer.questionId));
  const seenResultIds = new Set<string>();

  for (const result of results) {
    if (seenResultIds.has(result.questionId)) {
      throw new Error(`Duplicate questionId in response: ${result.questionId}`);
    }
    if (!answerIds.has(result.questionId)) {
      throw new Error(`Unknown questionId in response: ${result.questionId}`);
    }
    seenResultIds.add(result.questionId);
  }

  for (const answerId of answerIds) {
    if (!seenResultIds.has(answerId)) {
      throw new Error(`Missing response for questionId: ${answerId}`);
    }
  }
}

export class GradingService {
  async gradeAnswers(answers: StudentAnswer[]): Promise<GradingResult[]> {
    assertUniqueQuestionIds(answers);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable.");
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Return only valid JSON. Grade each answer as correct(boolean) and grade(enum E,D,C,B,A). Include questionId from input.",
        },
        {
          role: "user",
          content: JSON.stringify({ answers }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "grading_results",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["questionId", "correct", "grade"],
              properties: {
                questionId: { type: "string" },
                correct: { type: "boolean" },
                grade: { type: "string", enum: ["E", "D", "C", "B", "A"] },
              },
            },
          },
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI response did not include output_text.");
    }

    const parsedJson = parseModelJson(response.output_text);
    const results = z.array(GradingResultSchema).parse(parsedJson);
    assertOneToOneMapping(answers, results);
    return results;
  }
}
