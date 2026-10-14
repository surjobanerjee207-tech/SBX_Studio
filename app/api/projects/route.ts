import { NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/lib/projects.server";
import {
  parseVideoUrl,
  placeholderThumb,
  Project,
} from "@/lib/projects";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export async function GET() {
  try {
    const list = await getProjects();
    return NextResponse.json({ projects: list });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check for reorder action
    if (body.action === "reorder" && Array.isArray(body.slugs)) {
      const current = await getProjects();
      const map = new Map(current.map((p) => [p.slug, p]));
      const reordered: Project[] = [];
      for (const s of body.slugs) {
        const item = map.get(s);
        if (item) {
          reordered.push(item);
          map.delete(s);
        }
      }
      // append any left out
      map.forEach((item) => reordered.push(item));
      await saveProjects(reordered);
      return NextResponse.json({ ok: true, projects: reordered });
    }

    const {
      title,
      category,
      description,
      year,
      videoUrl,
      thumbnail,
      role,
      tools,
      provider: requestedProvider,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 }
      );
    }

    const currentList = await getProjects();

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "project";
    let slug = baseSlug;
    let counter = 1;
    while (currentList.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Auto-parse video URL
    const parsed = parseVideoUrl(videoUrl || "", requestedProvider);
    const finalThumb =
      (thumbnail && thumbnail.trim()) ||
      parsed.autoThumbnail ||
      placeholderThumb(title);

    const newProject: Project = {
      slug,
      title: title.trim(),
      category: (category || "Video Editing").trim(),
      description: (description || "").trim(),
      year: Number(year) || new Date().getFullYear(),
      thumbnail: finalThumb,
      videoUrl: parsed.videoUrl,
      provider: parsed.provider,
      role: (role || "Video Editor").trim(),
      tools: Array.isArray(tools)
        ? tools
        : typeof tools === "string"
        ? tools.split(",").map((t: string) => t.trim()).filter(Boolean)
        : ["Premiere Pro"],
    };

    // Prepend new project so it appears first on the website
    const updated = [newProject, ...currentList];
    await saveProjects(updated);

    return NextResponse.json({ ok: true, project: newProject, projects: updated });
  } catch (err: any) {
    console.error("Failed to add project:", err);
    return NextResponse.json(
      { error: "Could not create project" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { slug } = body;
    if (!slug) {
      return NextResponse.json(
        { error: "Project slug is required for updates" },
        { status: 400 }
      );
    }

    const currentList = await getProjects();
    const idx = currentList.findIndex((p) => p.slug === slug);
    if (idx === -1) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const existing = currentList[idx];
    const parsed = parseVideoUrl(
      body.videoUrl !== undefined ? body.videoUrl : existing.videoUrl,
      body.provider || existing.provider
    );

    const updatedProject: Project = {
      ...existing,
      title: body.title !== undefined ? body.title.trim() : existing.title,
      category:
        body.category !== undefined ? body.category.trim() : existing.category,
      description:
        body.description !== undefined
          ? body.description.trim()
          : existing.description,
      year: body.year !== undefined ? Number(body.year) : existing.year,
      videoUrl: parsed.videoUrl,
      provider: parsed.provider,
      thumbnail:
        (body.thumbnail && body.thumbnail.trim()) ||
        parsed.autoThumbnail ||
        existing.thumbnail ||
        placeholderThumb(existing.title),
      role: body.role !== undefined ? body.role.trim() : existing.role,
      tools:
        body.tools !== undefined
          ? Array.isArray(body.tools)
            ? body.tools
            : body.tools.split(",").map((t: string) => t.trim()).filter(Boolean)
          : existing.tools,
    };

    currentList[idx] = updatedProject;
    await saveProjects(currentList);

    return NextResponse.json({
      ok: true,
      project: updatedProject,
      projects: currentList,
    });
  } catch (err: any) {
    console.error("Failed to update project:", err);
    return NextResponse.json(
      { error: "Could not update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json(
        { error: "Slug query param required" },
        { status: 400 }
      );
    }

    const currentList = await getProjects();
    const filtered = currentList.filter((p) => p.slug !== slug);
    await saveProjects(filtered);

    return NextResponse.json({ ok: true, projects: filtered });
  } catch (err: any) {
    console.error("Failed to delete project:", err);
    return NextResponse.json(
      { error: "Could not delete project" },
      { status: 500 }
    );
  }
}
