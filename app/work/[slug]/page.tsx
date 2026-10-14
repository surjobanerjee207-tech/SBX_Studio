import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjects } from "@/lib/projects.server";
import { VideoPlayer } from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const projects = await getProjects();
  const i = projects.findIndex((p) => p.slug === params.slug);
  if (i < 0) notFound();

  const p = projects[i];
  const n = projects[(i + 1) % projects.length];

  return (
    <article className="px-6 pt-28 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="text-mute text-sm uppercase tracking-wider">
          {p.category} · {p.year}
        </p>
        <Link
          href={`/admin`}
          className="text-xs text-mute hover:text-bone underline underline-offset-4"
        >
          Edit in Studio
        </Link>
      </div>

      <h1 className="font-display text-5xl md:text-7xl my-4">
        {p.title}
      </h1>

      <VideoPlayer p={p} />

      <div className="mt-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mute mb-2">
            Project Overview
          </h2>
          <p className="text-bone/90 leading-relaxed whitespace-pre-line">
            {p.description || "No description provided."}
          </p>
        </div>

        <dl className="space-y-4 text-sm bg-panel p-6 border border-white/10 h-fit">
          <div>
            <dt className="text-mute">Role</dt>
            <dd className="text-bone font-medium mt-1">{p.role}</dd>
          </div>
          <div>
            <dt className="text-mute">Software & Tools</dt>
            <dd className="text-bone font-medium mt-1">
              {p.tools.join(", ")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-8">
        <Link href="/contact" className="bg-red px-6 py-3 hover:bg-cherry transition-colors font-medium">
          Start a project
        </Link>
        {n && (
          <Link
            href={`/work/${n.slug}`}
            className="text-mute hover:text-bone text-sm flex items-center gap-2"
          >
            <span>Next: {n.title}</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
