import Link from "next/link";
import { getProjects } from "@/lib/projects.server";
import { HeroTimeline } from "@/components/HeroTimeline";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <section className="min-h-screen relative flex flex-col justify-end px-6 pb-20 pt-32 overflow-hidden">
        {/* Desktop: timeline sits in right half of the hero, ~46% wide, vertically centred in upper-middle */}
        <div className="hidden md:block absolute top-[36%] -translate-y-1/2 right-6 lg:right-12 xl:right-16 w-[46%] max-w-2xl pointer-events-none">
          <HeroTimeline />
        </div>

        <h1 className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[1.05]">
          Every Frame<br />Tells a Story.
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

        {/* Mobile: smaller, lower-opacity strip below the buttons */}
        <div className="mt-10 md:hidden opacity-50 w-full max-w-xs sm:max-w-sm pointer-events-none">
          <HeroTimeline />
        </div>
      </section>

      <section id="work" className="px-6 py-24 space-y-32">
        {projects.map((p, i) => (
          <article
            key={p.slug}
            className={`grid gap-8 md:grid-cols-2 items-center ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Link href={`/work/${p.slug}`} className="block overflow-hidden group bg-panel border border-white/10">
              <img
                src={p.thumbnail}
                alt={p.title}
                width={1600}
                height={900}
                loading="lazy"
                className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </Link>
            <div>
              <p className="text-mute text-sm uppercase tracking-wider">
                {p.category} · {p.year}
              </p>
              <h2 className="font-display text-4xl md:text-6xl my-3">
                {p.title}
              </h2>
              <p className="text-mute max-w-md">
                {p.description}
              </p>
              <Link
                href={`/work/${p.slug}`}
                className="inline-block mt-6 bg-red px-6 py-3 hover:bg-cherry transition-colors font-medium"
              >
                Watch Project
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
