"use client";
import { useRef, useState } from "react";
import type { Project } from "@/lib/projects";

const PREVIEW_START = 5;  // seconds into the video where the preview begins
const PREVIEW_END = 20;   // seconds where it loops back to the start

// Accepts a plain video ID or a full YouTube link
function ytId(v: string) {
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : v;
}

export function HoverThumb({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const [show, setShow] = useState(false);   // preview is mounted
  const [ready, setReady] = useState(false); // preview has loaded, so fade it in
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const enter = () => {
    // only on devices that really hover (mouse), never on touch screens
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) return;
    timer.current = setTimeout(() => setShow(true), 300); // short delay avoids loading on a quick mouse pass
  };
  const leave = () => {
    clearTimeout(timer.current);
    setShow(false);
    setReady(false);
  };

  const id = p.provider === "youtube" ? ytId(p.videoUrl) : p.videoUrl;
  const previewSrc =
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1` +
    `&playlist=${id}&playsinline=1&modestbranding=1&rel=0&disablekb=1` +
    `&start=${PREVIEW_START}&end=${PREVIEW_END}`;

  return (
    <button
      onClick={onOpen}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label={`Play ${p.title}`}
      className="group relative block w-full overflow-hidden ring-1 ring-white/20"
    >
      <img
        src={p.thumbnail}
        alt={p.title}
        width={1600}
        height={900}
        loading="lazy"
        className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {show && p.provider === "youtube" && (
        <iframe
          aria-hidden
          tabIndex={-1}
          title=""
          src={previewSrc}
          onLoad={() => setReady(true)}
          allow="autoplay"
          className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {show && p.provider === "mp4" && (
        <video
          src={p.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setReady(true)}
          className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* play badge: always visible on touch, appears on hover on desktop, hidden while the preview plays */}
      <span
        className={`absolute inset-0 grid place-items-center bg-black/20 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 ${ready ? "[@media(hover:hover)]:group-hover:opacity-0" : ""}`}
      >
        <span className="bg-red px-5 py-2 text-sm text-bone">▶ Play</span>
      </span>
    </button>
  );
}
