export type ChatMessageRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

export type GitHubModelsChoice = {
  message?: {
    content?: string | null;
  };
};

export type GitHubModelsResponse = {
  choices?: GitHubModelsChoice[];
};

export type GitHubModelsConfig = {
  token: string;
  model: string;
  endpoint: string;
};