import Link from "next/link";
import { getProjects } from "@/lib/projects.server";
import { HeroTimeline } from "@/components/HeroTimeline";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <section className="min-h-screen flex items-end pb-20 pt-32">
        <div className="wrap w-full grid items-end gap-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="font-display t-hero">
              <span className="block whitespace-nowrap">Every Frame</span>
              <span className="block whitespace-nowrap">Tells a Story.</span>
            </h1>
            <p className="mt-6 text-mute">
              Video Editing · Visual Storytelling · Creative Post-Production
            </p>
            <p className="mt-3 max-w-xl">
              I&apos;m a video editor passionate about transforming raw footage into engaging visual experiences for creators, brands, and businesses.
            </p>
            <div className="mt-8 flex gap-4">
              <a href="#work" className="bg-red px-6 py-3 hover:bg-cherry transition-colors font-medium">
                Explore My Work
              </a>
              <Link href="/contact" className="border border-white/20 px-6 py-3 hover:border-bone transition-colors">
                Let&apos;s Collaborate
              </Link>
            </div>
          </div>
          <div className="order-first md:order-none w-full max-w-[560px] mb-10 md:mb-0 md:justify-self-end md:self-start md:mt-24 opacity-70 md:opacity-100">
            <HeroTimeline />
          </div>
        </div>
      </section>

      <section id="work" className="py-24">
        <div className="wrap space-y-32">
          {projects.map((p, i) => (
            <article
              key={p.slug}
              className={`grid gap-8 md:grid-cols-2 items-center ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Reveal
                x={i % 2 === 0 ? -60 : 60}
                className="min-w-0 overflow-hidden"
              >
                <Link
                  href={`/work/${p.slug}`}
                  className="block overflow-hidden group bg-panel border border-white/10"
                >
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    width={1600}
                    height={900}
                    loading="lazy"
                    className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              </Reveal>
              <Reveal
                x={i % 2 === 0 ? 60 : -60}
                delay={0.15}
                className="min-w-0"
              >
                <p className="text-mute text-sm uppercase tracking-wider">
                  {p.category} · {p.year}
                </p>
                <h2 className="font-display t-title my-3">
                  {p.title}
                </h2>
                <p className="t-body text-mute">
                  {p.description}
                </p>
                <Link
                  href={`/work/${p.slug}`}
                  className="inline-block mt-6 bg-red px-6 py-3 hover:bg-cherry transition-colors font-medium"
                >
                  Watch Project
                </Link>
              </Reveal>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
