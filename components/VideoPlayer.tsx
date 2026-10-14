"use client";
import { useState } from "react";
import type { Project } from "@/lib/projects";
import { parseVideoUrl } from "@/lib/projects";

export function VideoPlayer({
  p,
}: {
  p: Pick<Project, "videoUrl" | "provider" | "thumbnail" | "title">;
}) {
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(false);

  if (!p.videoUrl) {
    return (
      <div
        className="aspect-video grid place-items-center bg-panel text-mute text-sm border border-white/10"
        role="status"
      >
        <div className="text-center p-6">
          <p className="font-semibold text-bone">Video Coming Soon</p>
          <p className="text-xs text-mute mt-1">
            Add or edit this video directly from the Admin Studio
          </p>
        </div>
      </div>
    );
  }

  const { provider, videoUrl: parsedUrl, autoThumbnail } = parseVideoUrl(
    p.videoUrl,
    p.provider
  );
  const poster = p.thumbnail || autoThumbnail;

  if (provider === "mp4") {
    return err ? (
      <div
        className="aspect-video grid place-items-center bg-panel text-mute border border-white/10"
        role="alert"
      >
        This video failed to load. Check the MP4 URL.
      </div>
    ) : (
      <video
        className="aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        onError={() => setErr(true)}
        aria-label={p.title}
      >
        <source src={parsedUrl} />
      </video>
    );
  }

  const src =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${parsedUrl}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${parsedUrl}?autoplay=1`;

  return (
    <div className="aspect-video relative bg-black overflow-hidden border border-white/10">
      {on ? (
        <iframe
          className="absolute inset-0 size-full"
          src={src}
          title={p.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={() => setOn(true)}
          className="absolute inset-0 grid place-items-center bg-cover bg-center group"
          style={{ backgroundImage: `url("${poster}")` }}
          aria-label={`Play ${p.title}`}
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
          <div className="relative z-10 flex items-center gap-3 bg-red hover:bg-cherry text-bone px-6 py-3 transition-transform duration-300 group-hover:scale-105 shadow-xl">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-sm font-semibold tracking-wide">Play Film</span>
          </div>
        </button>
      )}
    </div>
  );
}
