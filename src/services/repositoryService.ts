import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const MAX_FILE_CHARS = 5000;
const MAX_TOTAL_CHARS = 60000;
const SKIP_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);
const TEXT_FILE_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".yml",
  ".yaml",
  ".html",
  ".css",
  ".scss",
  ".sql",
  ".prisma",
  ".sh",
  ".py",
  ".go",
  ".java",
  ".rb",
  ".php",
  ".rs",
]);
const SPECIAL_TEXT_FILES = new Set([
  "dockerfile",
  "makefile",
  "license",
  "readme",
  "readme.md",
  "readme.mdx",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "tsconfig.json",
  "jest.config.ts",
  "vite.config.ts",
]);

type RepositorySource = {
  repoUrl?: string;
  repoZip?: Buffer;
};

type GitHubRepoInfo = {
  owner: string;
  repo: string;
  ref?: string;
};

function parseGitHubRepoUrl(repoUrl: string): GitHubRepoInfo {
  const normalizedUrl =
    repoUrl.startsWith("http://") || repoUrl.startsWith("https://")
      ? repoUrl
      : `https://${repoUrl}`;
  const parsedUrl = new URL(normalizedUrl);

  if (
    parsedUrl.hostname !== "github.com" &&
    parsedUrl.hostname !== "www.github.com"
  ) {
    throw new Error("Only public github.com repository URLs are supported");
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error("Invalid GitHub repository URL");
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");
  const ref = segments[2] === "tree" && segments[3] ? segments[3] : undefined;

  return { owner, repo, ref };
}

function isLikelyTextFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  const extension = path.extname(fileName);

  return (
    TEXT_FILE_EXTENSIONS.has(extension) ||
    SPECIAL_TEXT_FILES.has(fileName) ||
    fileName.startsWith("readme")
  );
}

async function extractZipArchive(zipBuffer: Buffer): Promise<string> {
  const workingDir = await mkdtemp(path.join(os.tmpdir(), "gradebrain-repo-"));
  const zipPath = path.join(workingDir, "repository.zip");
  const extractDir = path.join(workingDir, "extract");

  try {
    await writeFile(zipPath, zipBuffer);
    await execFileAsync("unzip", ["-oq", zipPath, "-d", extractDir]);

    return await collectRepositoryText(extractDir);
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

async function collectRepositoryText(rootDir: string): Promise<string> {
  const collected: string[] = [];
  let totalChars = 0;

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!isLikelyTextFile(fullPath)) {
        continue;
      }

      const fileBuffer = await readFile(fullPath);

      if (fileBuffer.includes(0)) {
        continue;
      }

      const relativePath = path.relative(rootDir, fullPath);
      const fileText = fileBuffer
        .toString("utf8")
        .slice(0, MAX_FILE_CHARS)
        .trim();

      if (!fileText) {
        continue;
      }

      const chunk = [`File: ${relativePath}`, fileText, ""].join("\n");

      if (totalChars + chunk.length > MAX_TOTAL_CHARS) {
        const remaining = MAX_TOTAL_CHARS - totalChars;

        if (remaining > 0) {
          collected.push(chunk.slice(0, remaining));
          totalChars += remaining;
        }

        collected.push("[Repository content truncated]");
        return;
      }

      collected.push(chunk);
      totalChars += chunk.length;
    }
  }

  await walk(rootDir);

  if (collected.length === 0) {
    throw new Error("No readable text files were found in the repository");
  }

  return collected.join("\n");
}

class RepositoryService {
  async readRepository(source: RepositorySource): Promise<string> {
    if (source.repoZip) {
      return extractZipArchive(source.repoZip);
    }

    if (source.repoUrl) {
      return this.readGitHubRepository(source.repoUrl);
    }

    throw new Error("Missing repository source");
  }

  private async readGitHubRepository(repoUrl: string): Promise<string> {
    const { owner, repo, ref } = parseGitHubRepoUrl(repoUrl);
    const repositoryRef = ref ?? (await this.fetchDefaultBranch(owner, repo));
    const archiveUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(repositoryRef)}`;
    const response = await fetch(archiveUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "gradebrain",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to download repository archive (${response.status}): ${errorText}`,
      );
    }

    return extractZipArchive(Buffer.from(await response.arrayBuffer()));
  }

  private async fetchDefaultBranch(
    owner: string,
    repo: string,
  ): Promise<string> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "gradebrain",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to resolve repository default branch (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as { default_branch?: string };

    if (!data.default_branch) {
      throw new Error("Repository default branch could not be determined");
    }

    return data.default_branch;
  }
}

export default new RepositoryService();
