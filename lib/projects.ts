export type Project = {
  slug: string;
  title: string;
  category: string;
  description: string;
  year: number;
  thumbnail: string;
  videoUrl: string;
  provider: "mp4" | "youtube" | "vimeo";
  role: string;
  tools: string[];
};

export const placeholderThumb = (title: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='50%' fill='#929292' font-size='40' text-anchor='middle' font-family='sans-serif'>${title} — replace thumbnail</text></svg>`
  )}`;

/**
 * Intelligent video URL parser:
 * Automatically detects YouTube (watch, shorts, embed, youtu.be),
 * Vimeo, and direct MP4/video URLs. Extracts ID and auto-generates thumbnails!
 */
export function parseVideoUrl(
  input: string,
  preferredProvider?: "mp4" | "youtube" | "vimeo"
): {
  provider: "mp4" | "youtube" | "vimeo";
  videoUrl: string;
  autoThumbnail?: string;
} {
  const url = (input || "").trim();
  if (!url) {
    return { provider: preferredProvider || "mp4", videoUrl: "" };
  }

  // 1. YouTube: standard URL, shorts, share link, embed
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      provider: "youtube",
      videoUrl: id,
      autoThumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    };
  }

  // Raw 11-char YouTube ID
  if (/^[\w-]{11}$/.test(url)) {
    return {
      provider: "youtube",
      videoUrl: url,
      autoThumbnail: `https://img.youtube.com/vi/${url}/maxresdefault.jpg`,
    };
  }

  // 2. Vimeo: standard URL or embed
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return {
      provider: "vimeo",
      videoUrl: vimeoMatch[1],
    };
  }

  // Raw numeric Vimeo ID
  if (/^\d{6,12}$/.test(url)) {
    return {
      provider: "vimeo",
      videoUrl: url,
    };
  }

  // 3. Fallback to direct MP4
  return {
    provider: preferredProvider || "mp4",
    videoUrl: url,
  };
}

export const fallbackProjects: Project[] = [
  {
    slug: "college-event-film",
    title: "College Event Film",
    category: "Event Highlights / Cinematic Editing",
    description: "A cinematic event recap capturing the energy, atmosphere, and memorable moments of a college experience.",
    year: 2026,
    thumbnail: placeholderThumb("College Event Film"),
    videoUrl: "",
    provider: "mp4",
    role: "Editor",
    tools: ["Premiere Pro", "DaVinci Resolve"],
  },
  {
    slug: "promotional-commercial",
    title: "Promotional Commercial",
    category: "Promotional Video / Commercial Editing",
    description: "A dynamic promotional edit combining visual rhythm, transitions, music, and creative storytelling.",
    year: 2026,
    thumbnail: placeholderThumb("Promotional Commercial"),
    videoUrl: "",
    provider: "mp4",
    role: "Editor",
    tools: ["After Effects", "Premiere Pro"],
  },
  {
    slug: "travel-film",
    title: "Travel Film",
    category: "Travel / Cinematic Storytelling",
    description: "A visually driven travel experience combining cinematic footage, atmosphere, pacing, and narrative.",
    year: 2026,
    thumbnail: placeholderThumb("Travel Film"),
    videoUrl: "",
    provider: "mp4",
    role: "Colorist & Editor",
    tools: ["DaVinci Resolve"],
  },
];

export const projects = fallbackProjects;
