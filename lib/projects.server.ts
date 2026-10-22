import fs from "fs/promises";
import path from "path";
import { Project, fallbackProjects } from "./projects";

const DATA_PATH = path.join(process.cwd(), "data", "projects.json");

export async function getProjects(): Promise<Project[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Return fallback if file missing or corrupt
  }
  return fallbackProjects;
}

export async function saveProjects(newProjects: Project[]): Promise<void> {
  try {
    const dir = path.dirname(DATA_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(newProjects, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("Could not write projects to disk (read-only filesystem):", err?.message);
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const list = await getProjects();
  return list.find((p) => p.slug === slug) || null;
}
