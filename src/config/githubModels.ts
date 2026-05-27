import type { GitHubModelsConfig } from "../types/githubModels";

export function getGitHubModelsConfig(): GitHubModelsConfig {
  const token = process.env.GITHUB_MODELS_TOKEN ?? process.env.OPENAI_API_KEY;

  if (!token) {
    throw new Error(
      "Missing GITHUB_MODELS_TOKEN or OPENAI_API_KEY in environment for GitHub Models"
    );
  }

  return {
    token,
    model: process.env.GITHUB_MODEL ?? process.env.OPENAI_MODEL ?? "openai/gpt-4.1",
    endpoint: process.env.GITHUB_MODELS_ENDPOINT ?? "https://models.github.ai/inference/chat/completions",
  };
}
