import { getGitHubModelsConfig } from "../config/githubModels";
import type { ChatMessage } from "../types/githubModels";
import type { GitHubModelsResponse } from "../types/githubModels";

const gradeSystemPrompt = [
  "You are a strict grader.",
  "Use the provided syllabus to evaluate the exam response.",
  "Return only valid JSON matching this schema: {\"correct\": boolean, \"grade\": \"F\" | \"E\" | \"D\" | \"C\" | \"B\" | \"A\" }",
].join("\n");

class GitHubModelsClient {
  async chatCompletion(messages: ChatMessage[], temperature = 0): Promise<string> {
    const config = getGitHubModelsConfig();

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Models API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GitHubModelsResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("GitHub model returned an empty response");
    }

    return content;
  }

  async gradeCompletion(userContent: string, temperature = 0): Promise<string> {
    return this.chatCompletion(
      [
        {
          role: "system",
          content: gradeSystemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature,
    );
  }
}

export default new GitHubModelsClient();