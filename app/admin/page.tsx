"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Project, parseVideoUrl } from "@/lib/projects";
import { ThumbnailUploader } from "@/components/ThumbnailUploader";

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Event Highlights / Cinematic Editing");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [rawVideoUrl, setRawVideoUrl] = useState("");
  const [customThumbnail, setCustomThumbnail] = useState("");
  const [role, setRole] = useState("Lead Video Editor & Colorist");
  const [toolsStr, setToolsStr] = useState("Premiere Pro, DaVinci Resolve");
  const [saving, setSaving] = useState(false);

  // Live video parse calculation
  const parsed = parseVideoUrl(rawVideoUrl);
  const effectiveThumbnail = customThumbnail.trim() || parsed.autoThumbnail || "";

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err: any) {
      setError("Failed to load projects: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const openNewForm = () => {
    setEditSlug(null);
    setTitle("");
    setCategory("Cinematic Film");
    setDescription("");
    setYear(new Date().getFullYear());
    setRawVideoUrl("");
    setCustomThumbnail("");
    setRole("Lead Video Editor");
    setToolsStr("Premiere Pro, DaVinci Resolve");
    setIsEditing(true);
  };

  const openEditForm = (p: Project) => {
    setEditSlug(p.slug);
    setTitle(p.title);
    setCategory(p.category);
    setDescription(p.description);
    setYear(p.year);
    // Reconstruct full URL if it's youtube or vimeo id
    if (p.provider === "youtube" && !p.videoUrl.includes("http")) {
      setRawVideoUrl(`https://www.youtube.com/watch?v=${p.videoUrl}`);
    } else if (p.provider === "vimeo" && !p.videoUrl.includes("http")) {
      setRawVideoUrl(`https://vimeo.com/${p.videoUrl}`);
    } else if (p.provider === "googledrive" && !p.videoUrl.includes("http")) {
      setRawVideoUrl(`https://drive.google.com/file/d/${p.videoUrl}/view`);
    } else {
      setRawVideoUrl(p.videoUrl);
    }
    setCustomThumbnail(
      p.thumbnail.startsWith("data:image/svg") ||
        p.thumbnail.includes("drive.google.com")
        ? ""
        : p.thumbnail
    );
    setRole(p.role);
    setToolsStr(p.tools.join(", "));
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for the video project.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        year: Number(year),
        videoUrl: rawVideoUrl.trim(),
        thumbnail: customThumbnail.trim(),
        role: role.trim(),
        tools: toolsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      let res;
      if (editSlug) {
        res = await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: editSlug, ...payload }),
        });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setProjects(data.projects);
      setIsEditing(false);
      showNotify(
        editSlug
          ? "Project updated successfully!"
          : "New project published to website!"
      );
    } catch (err: any) {
      alert("Error saving project: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, projectTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}"?`)) return;

    try {
      const res = await fetch(`/api/projects?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProjects(data.projects);
      showNotify(`"${projectTitle}" was deleted.`);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const moveProject = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    const reordered = [...projects];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    setProjects(reordered);

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          slugs: reordered.map((p) => p.slug),
        }),
      });
      showNotify("Project order updated!");
    } catch (err: any) {
      alert("Failed to save reordering: " + err.message);
    }
  };

  const copyGitCommands = () => {
    const cmd = `git add data/projects.json && git commit -m "Update portfolio videos" && git push`;
    navigator.clipboard.writeText(cmd);
    showNotify("Git push command copied to clipboard!");
  };

  const copyJsonBackup = () => {
    navigator.clipboard.writeText(JSON.stringify(projects, null, 2));
    showNotify("Projects JSON copied to clipboard!");
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 max-w-6xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl md:text-5xl text-bone">
              Portfolio Studio
            </h1>
            <span className="bg-red/20 text-red text-xs px-2.5 py-1 border border-red/40 font-mono uppercase tracking-wider">
              Live CMS
            </span>
          </div>
          <p className="text-mute text-sm mt-2 max-w-xl">
            Directly add, edit, or publish videos on your portfolio. Paste any YouTube, Vimeo, or MP4 link—thumbnails and embeds are generated automatically!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewForm}
            className="bg-red hover:bg-cherry text-bone px-5 py-2.5 transition-colors font-medium flex items-center gap-2 shadow-lg"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add New Video</span>
          </button>
          <Link
            href="/"
            className="border border-white/20 hover:border-bone px-4 py-2.5 text-sm transition-colors"
          >
            View Live Site ↗
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mt-6 bg-red/15 border border-red text-bone px-4 py-3 text-sm flex items-center justify-between animate-fade-in">
          <span>✓ {notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-mute hover:text-bone text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Direct Push Helper Banner */}
      <div className="mt-8 bg-panel border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-bone flex items-center gap-2">
            <span>Direct Push to Production</span>
          </h2>
          <p className="text-xs text-mute mt-1">
            All your updates are automatically saved to <code className="bg-ink px-1.5 py-0.5 border border-white/10 text-bone">data/projects.json</code>. Run this command in your terminal whenever you want to push to GitHub / Vercel:
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyGitCommands}
            className="bg-ink hover:bg-white/5 border border-white/20 text-xs px-3.5 py-2 text-bone transition-colors font-mono whitespace-nowrap"
          >
            📋 Copy Git Push Command
          </button>
          <button
            onClick={copyJsonBackup}
            className="bg-ink hover:bg-white/5 border border-white/20 text-xs px-3.5 py-2 text-mute hover:text-bone transition-colors whitespace-nowrap"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Project Count Stats */}
      <div className="mt-8 flex items-center justify-between text-xs text-mute">
        <p>
          Showing <span className="text-bone font-medium">{projects.length}</span> published projects
        </p>
        <p>Tip: Use ↑ and ↓ to arrange how videos appear on the homepage</p>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="py-20 text-center text-mute text-sm">
          Loading portfolio projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-6 p-12 text-center bg-panel border border-white/10">
          <p className="text-bone text-lg font-display">No videos yet</p>
          <p className="text-mute text-sm mt-1">
            Click &quot;Add New Video&quot; above to publish your first video project!
          </p>
          <button
            onClick={openNewForm}
            className="mt-6 bg-red px-6 py-2.5 text-bone text-sm hover:bg-cherry"
          >
            + Add First Project
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {projects.map((p, idx) => (
            <div
              key={p.slug}
              className="bg-panel border border-white/10 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-white/20 transition-colors"
            >
              {/* Thumbnail + info */}
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                <div className="w-36 aspect-video bg-black flex-shrink-0 relative overflow-hidden border border-white/10">
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1 py-0.5 uppercase tracking-wider font-mono text-white/80">
                    {p.provider === "googledrive" ? "DRIVE" : p.provider.toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wider text-mute">
                      {p.category} · {p.year}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-bone truncate mt-0.5">
                    {p.title}
                  </h3>
                  <p className="text-xs text-mute truncate mt-1 max-w-lg">
                    {p.description || "No description provided."}
                  </p>
                  <p className="text-[11px] text-mute/80 mt-1 font-mono truncate">
                    Video: {p.videoUrl ? (p.provider === "youtube" ? `YouTube (${p.videoUrl})` : p.provider === "googledrive" ? `Google Drive (${p.videoUrl})` : p.videoUrl) : "None (placeholder)"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                {/* Reorder Buttons */}
                <div className="flex items-center border border-white/10 mr-2">
                  <button
                    onClick={() => moveProject(idx, "up")}
                    disabled={idx === 0}
                    title="Move higher on homepage"
                    className="px-2 py-1.5 text-xs text-mute hover:text-bone disabled:opacity-30 disabled:hover:text-mute hover:bg-white/5"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveProject(idx, "down")}
                    disabled={idx === projects.length - 1}
                    title="Move lower on homepage"
                    className="px-2 py-1.5 text-xs text-mute hover:text-bone disabled:opacity-30 disabled:hover:text-mute hover:bg-white/5 border-l border-white/10"
                  >
                    ↓
                  </button>
                </div>

                <Link
                  href={`/work/${p.slug}`}
                  target="_blank"
                  className="border border-white/20 hover:border-bone text-xs px-3 py-2 text-mute hover:text-bone transition-colors"
                >
                  Preview
                </Link>

                <button
                  onClick={() => openEditForm(p)}
                  className="bg-white/10 hover:bg-white/20 text-bone text-xs px-3 py-2 transition-colors font-medium"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(p.slug, p.title)}
                  className="border border-red/40 hover:bg-red/20 text-red text-xs px-3 py-2 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-panel border border-white/20 w-full max-w-2xl p-6 md:p-8 my-8 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="font-display text-2xl text-bone">
                {editSlug ? "Edit Video Project" : "Publish New Video Project"}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-mute hover:text-bone text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Video URL Input with Auto Detection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-bone">
                    1. Video Link / URL <span className="text-red">*</span>
                  </label>
                  {rawVideoUrl && (
                    <span className="text-[11px] bg-red/20 text-red px-2.5 py-0.5 uppercase tracking-wider font-mono border border-red/30">
                      Detected: {parsed.provider === "googledrive" ? "Google Drive" : parsed.provider.toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={rawVideoUrl}
                  onChange={(e) => setRawVideoUrl(e.target.value)}
                  placeholder="Paste YouTube, Vimeo, Google Drive, or MP4 URL"
                  className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone placeholder-mute/50 focus:border-red focus:outline-none"
                />
                <p className="text-xs text-mute mt-1.5">
                  Paste YouTube, Vimeo, Google Drive (view or share link), or direct .mp4 URLs. We extract the ID and embed automatically!
                </p>

                {/* Live Preview if valid */}
                {parsed.videoUrl && (
                  <div className="mt-4 p-3 bg-ink border border-white/10 flex items-center gap-4">
                    {effectiveThumbnail ? (
                      <img
                        src={effectiveThumbnail}
                        alt="Preview"
                        className="w-24 aspect-video object-cover bg-black border border-white/10"
                      />
                    ) : (
                      <div className="w-24 aspect-video bg-black grid place-items-center text-[10px] text-mute border border-white/10">
                        No Thumb
                      </div>
                    )}
                    <div className="text-xs">
                      <p className="text-bone font-medium">Video Ready</p>
                      <p className="text-mute font-mono text-[11px]">
                        Provider: {parsed.provider} | Embed: {parsed.videoUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                    2. Project Title <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Neon Horizon Reel"
                    className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone placeholder-mute/50 focus:border-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                    3. Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Commercial / Color Grading"
                    className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone placeholder-mute/50 focus:border-red focus:outline-none"
                  />
                </div>
              </div>

              {/* Drag and Drop Thumbnail Uploader */}
              <ThumbnailUploader
                thumbnailUrl={customThumbnail}
                autoThumbnail={parsed.autoThumbnail}
                onThumbnailChange={setCustomThumbnail}
              />

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                  5. Project Description / Story
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the story behind the edit, pacing, sound design, and color palette..."
                  className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone placeholder-mute/50 focus:border-red focus:outline-none"
                />
              </div>

              {/* Year, Role, Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone focus:border-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Editor & Colorist"
                    className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone focus:border-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bone mb-2">
                    Software & Tools
                  </label>
                  <input
                    type="text"
                    value={toolsStr}
                    onChange={(e) => setToolsStr(e.target.value)}
                    placeholder="e.g. Premiere, DaVinci"
                    className="w-full bg-ink border border-white/20 px-4 py-3 text-sm text-bone focus:border-red focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-sm text-mute hover:text-bone border border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red hover:bg-cherry text-bone px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Publishing..."
                    : editSlug
                    ? "Update Project"
                    : "Publish to Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
