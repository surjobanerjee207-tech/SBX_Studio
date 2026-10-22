import Link from "next/link";
import { getProjects } from "@/lib/projects.server";
import { HeroTimeline } from "@/components/HeroTimeline";
import { Reveal } from "@/components/Reveal";
import { ProjectList } from "@/components/ProjectList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <section className="min-h-screen flex items-end pb-20 pt-32">
        <div className="wrap w-full grid items-end gap-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Reveal>
              <h1 className="font-display t-hero">
                <span className="block whitespace-nowrap">Every Frame</span>
                <span className="block whitespace-nowrap">Tells a Story.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-mute">
                Video Editing · Visual Storytelling · Creative Post-Production
              </p>
              <p className="mt-3 max-w-xl">
                I&apos;m a video editor passionate about transforming raw footage into engaging visual experiences for creators, brands, and businesses.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex gap-4">
                <a href="#work" className="bg-red px-6 py-3 hover:bg-cherry transition-colors font-medium">
                  Explore My Work
                </a>
                <Link href="/contact" className="border border-white/20 px-6 py-3 hover:border-bone transition-colors">
                  Let&apos;s Collaborate
                </Link>
              </div>
            </Reveal>
          </div>
          <div className="order-first md:order-none w-full max-w-[560px] mb-10 md:mb-0 md:justify-self-end md:self-start md:mt-24 opacity-70 md:opacity-100">
            <Reveal y={0} x={60}>
              <HeroTimeline />
            </Reveal>
          </div>
        </div>
      </section>

      <section id="work" className="py-24">
        <div className="wrap">
          <ProjectList projects={projects} />
        </div>
      </section>
    </>
  );
}
