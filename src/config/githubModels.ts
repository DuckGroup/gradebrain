import type { GitHubModelsConfig } from "../types/githubModels";

export function getGitHubModelsConfig(): GitHubModelsConfig {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN in environment");
  }

  return {
    token,
    model: process.env.GITHUB_MODEL ?? "openai/gpt-4.1",
    endpoint: "https://models.github.ai/inference/chat/completions",
  };
}