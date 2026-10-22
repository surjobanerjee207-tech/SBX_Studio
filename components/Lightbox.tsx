"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { Project } from "@/lib/projects";

export function Lightbox({
  projects, index, onClose, onChange,
}: {
  projects: Project[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const p = projects[index];
  const n = projects.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  const prev = () => onChange((index - 1 + n) % n);
  const next = () => onChange((index + 1) % n);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
      opener?.focus();
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const btn = "px-4 py-2 text-sm text-bone border border-white/20 hover:border-bone transition-colors";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-mute break-words">{p.category} · {p.year}</p>
            <h2 className="font-display text-2xl sm:text-4xl break-words">{p.title}</h2>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close video" className={btn}>
            Close ✕
          </button>
        </div>

        <VideoPlayer key={p.slug} p={p} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={prev} className={btn} aria-label="Previous project">← Prev</button>
            <button onClick={next} className={btn} aria-label="Next project">Next →</button>
          </div>
          <div className="flex gap-2">
            <Link href={`/work/${p.slug}`} className={btn}>Project details</Link>
            <Link href="/contact" className="bg-red px-4 py-2 text-sm text-bone hover:bg-cherry transition-colors">
              Start a project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
