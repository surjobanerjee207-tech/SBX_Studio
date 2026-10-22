"use client";
import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Lightbox } from "@/components/Lightbox";
import { HoverThumb } from "@/components/HoverThumb";
import type { Project } from "@/lib/projects";

export function ProjectList({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-24">
        {projects.map((p, i) => (
          <article
            key={p.slug}
            className="grid items-center gap-8 rounded-sm bg-white/[0.04] p-4 ring-1 ring-white/10 md:grid-cols-2 md:p-8"
          >
            <Reveal x={i % 2 === 0 ? -60 : 60} className={i % 2 === 1 ? "md:order-2" : ""}>
              <HoverThumb p={p} onOpen={() => setActive(i)} />
            </Reveal>
            <Reveal x={i % 2 === 0 ? 60 : -60} delay={0.15} className="min-w-0">
              <p className="text-sm text-mute break-words">{p.category} · {p.year}</p>
              <h2 className="font-display my-3 text-4xl md:text-6xl break-words">{p.title}</h2>
              <p className="max-w-md text-mute break-words">{p.description}</p>
              <button onClick={() => setActive(i)}
                className="mt-6 bg-red px-6 py-3 text-bone transition-colors hover:bg-cherry">
                Watch Project
              </button>
            </Reveal>
          </article>
        ))}
      </div>

      {active !== null && (
        <Lightbox projects={projects} index={active} onClose={() => setActive(null)} onChange={setActive} />
      )}
    </>
  );
}
