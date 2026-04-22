import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sampleStories } from "@/lib/sample-data";
import { StoryWithChapters } from "@/types/story";

const DATA_DIR = path.join(process.cwd(), "data");
const STORIES_FILE = path.join(DATA_DIR, "stories.json");

function cloneSampleStories() {
  return structuredClone(sampleStories);
}

export async function readStoriesFromStore(): Promise<StoryWithChapters[]> {
  try {
    const raw = await readFile(STORIES_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoryWithChapters[];
    if (!Array.isArray(parsed)) return cloneSampleStories();
    return parsed;
  } catch {
    return cloneSampleStories();
  }
}

export async function writeStoriesToStore(stories: StoryWithChapters[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORIES_FILE, JSON.stringify(stories, null, 2), "utf8");
}
