import { readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

async function flattenFolder(rootFolder: string): Promise<number> {
  let movedFiles = 0;
  const takenNames = new Set<string>();

  async function walk(currentFolder: string): Promise<void> {
    const entries = await readdir(currentFolder, { withFileTypes: true });

    for (const entry of entries) {
      const from = path.join(currentFolder, entry.name);

      if (entry.isDirectory()) {
        await walk(from);
        await rm(from, { recursive: true, force: true });
        continue;
      }

      const parsed = path.parse(entry.name);
      let candidateName = parsed.base;
      let attempt = 0;

      while (takenNames.has(candidateName)) {
        attempt += 1;
        candidateName = `${parsed.name}_${attempt}${parsed.ext}`;
      }

      takenNames.add(candidateName);
      const to = path.join(rootFolder, candidateName);
      if (from !== to) {
        await rename(from, to);
        movedFiles += 1;
      }
    }
  }

  await walk(rootFolder);
  return movedFiles;
}