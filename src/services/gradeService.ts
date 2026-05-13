import { AIOutputSchema, GradeRequest } from "../schemas/gradeSchema";

const githubToken = process.env.GITHUB_TOKEN;
const model = process.env.GITHUB_MODEL ?? "openai/gpt-4.1";

type GitHubModelsResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

class GradeService {
  async gradeContent(request: GradeRequest): Promise<string> {
    if (!githubToken) {
      throw new Error("Missing GITHUB_TOKEN in environment");
    }

    const res = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `${request.systemPrompt}\n\nReturn only valid JSON matching this schema: {\"correct\": boolean, \"grade\": \"F\" | \"E\" | \"D\" | \"C\" | \"B\" | \"A\" }`,
          },
          {
            role: "user",
            content: request.userContent,
          },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub Models API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as GitHubModelsResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("GitHub model returned an empty response");
    }

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("Model returned non-JSON or malformed JSON");
    }

    const parsed = AIOutputSchema.parse(JSON.parse(content.slice(start, end + 1)));

    return JSON.stringify(parsed);
  }
}

export default new GradeService();
