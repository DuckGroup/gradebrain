// src/file-processing/unzip.ts
import { readdir, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type UnzipResult = "ok" | "warning" | "failed";

function getErrorInfo(error: unknown): { code?: number; stderr: string } {
  if (typeof error !== "object" || error === null) {
    return { stderr: String(error) };
  }

  const errorObject = error as { code?: number; stderr?: string };
  return {
    code: errorObject.code,
    stderr: errorObject.stderr ?? "",
  };
}

export async function unzipAllSubmissionArchives(targetDir: string): Promise<void> {
  const entries = await readdir(targetDir, { withFileTypes: true });
  const zipFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".zip"),
  );

  let okCount = 0;
  let warningCount = 0;
  let failedCount = 0;

  for (const zipEntry of zipFiles) {
    const baseName = path.basename(zipEntry.name, ".zip");
    const subfolderPath = path.join(targetDir, baseName);
    const originalZipPath = path.join(targetDir, zipEntry.name);
    const movedZipPath = path.join(subfolderPath, zipEntry.name);
    let result: UnzipResult = "ok";

    try {
      await mkdir(subfolderPath, { recursive: true });
      await rename(originalZipPath, movedZipPath);
      await execFileAsync("unzip", ["-o", movedZipPath, "-d", subfolderPath]);
    } catch (error: unknown) {
      const { code, stderr } = getErrorInfo(error);

      if (code === 1 && /appears to use backslashes as path separators/i.test(stderr)) {
        result = "warning";
      } else {
        result = "failed";
        console.error(`Failed: "${originalZipPath}"`);
        console.error(stderr || String(error));
      }
    }

    if (result === "ok") {
      okCount += 1;
      console.log(`Unzipped: "${movedZipPath}"`);
    } else if (result === "warning") {
      warningCount += 1;
      console.warn(`Unzipped with warning: "${movedZipPath}"`);
    } else {
      failedCount += 1;
    }
  }

  console.log(
    `Done. zip files: ${zipFiles.length}, success: ${okCount}, warnings: ${warningCount}, failed: ${failedCount}`,
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}