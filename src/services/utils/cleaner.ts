import { readdir, rm, unlink } from "node:fs/promises";
import path from "node:path";


const dir = path.resolve(__dirname, "..", "..", "submissions");
const removableDirectoryNames = new Set(["node_modules"]);

type CleanStats = {
	removedDirectories: number;
	removedZipFiles: number;
};

const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("-n");

async function cleanRecursively(
	currentPath: string,
	stats: CleanStats,
	dryRun: boolean,
): Promise<void> {
	const entries = await readdir(currentPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(currentPath, entry.name);

		if (entry.isDirectory()) {
			if (removableDirectoryNames.has(entry.name)) {
				if (!dryRun) {
					await rm(fullPath, { recursive: true, force: true });
				}

				stats.removedDirectories ++;
				console.log(
					`${dryRun ? "[dry-run] Would remove directory" : "Removed directory"}: "${fullPath}"`,
				);
				continue;
			}

			await cleanRecursively(fullPath, stats, dryRun);
			continue;
		}

		if (entry.isFile() && entry.name.toLowerCase().endsWith(".zip")) {
			if (!dryRun) {
				await unlink(fullPath);
			}

			stats.removedZipFiles += 1;
			console.log(`${dryRun ? "[dry-run] Would remove zip" : "Removed zip"}: "${fullPath}"`);
		}
	}
}

export async function cleanSubmissions(dryRun: boolean, targetDir = dir): Promise<CleanStats> {
	const stats: CleanStats = {
		removedDirectories: 0,
		removedZipFiles: 0,
	};

	await cleanRecursively(targetDir, stats, dryRun);
	return stats;
}

cleanSubmissions(isDryRun)
	.then((stats) => {
		if (isDryRun) {
			console.log("Dry run complete. No files or directories were deleted.");
		}

		console.log(
			`Done. removed directories: ${stats.removedDirectories}, removed zip files: ${stats.removedZipFiles}`,
		);
	})
	.catch((error: unknown) => {
		console.error("Failed to clean submissions:", error);
		process.exitCode = 1;
	});
