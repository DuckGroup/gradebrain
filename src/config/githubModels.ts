import type { GitHubModelsConfig } from "../types/githubModels";

export function getGitHubModelsConfig(): GitHubModelsConfig {
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    throw new Error("Missing OPENAI_API_KEY in environment");
  }

  return {
    token,
    model: process.env.OPENAI_MODEL ?? "openai/gpt-4.1",
    endpoint: "https://models.github.ai/inference/chat/completions",
  };
}