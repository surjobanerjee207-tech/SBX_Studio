import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/lib/invoice-storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | SBX_Studio",
  description:
    "Explore transparent pricing for video editing, motion graphics, color grading, and creative post-production.",
};

const FALLBACK_SERVICES = [
  {
    id: "srv_1",
    name: "Video Editing",
    description: "Multi-cam editing, pacing, dynamic cuts, and cinematic assembly.",
    defaultPrice: 2000,
    defaultUnit: "video",
    currency: "INR",
  },
  {
    id: "srv_9",
    name: "YouTube Editing",
    description: "Full YouTube longform video editing with B-roll, zoom cuts, sound effects, and pacing.",
    defaultPrice: 3000,
    defaultUnit: "video",
    currency: "INR",
  },
  {
    id: "srv_8",
    name: "Social Reel Editing",
    description: "Fast-paced vertical reel / TikTok / Shorts edit with animated captions and sound hooks.",
    defaultPrice: 1500,
    defaultUnit: "reel",
    currency: "INR",
  },
  {
    id: "srv_3",
    name: "Motion Graphics",
    description: "Animated titles, kinetic typography, sleek lower thirds, and customized callouts.",
    defaultPrice: 3500,
    defaultUnit: "project",
    currency: "INR",
  },
  {
    id: "srv_5",
    name: "Color Grading",
    description: "DaVinci Resolve cinematic look development, balancing, and shot-to-shot matching.",
    defaultPrice: 2500,
    defaultUnit: "video",
    currency: "INR",
  },
  {
    id: "srv_2",
    name: "Sound Design",
    description: "SFX layering, dialogue cleanup, ambient foley, and balanced audio mixing.",
    defaultPrice: 2000,
    defaultUnit: "video",
    currency: "INR",
  },
  {
    id: "srv_6",
    name: "VFX & Compositing",
    description: "Chroma keying, screen replacement, rotoscoping, clean plates, and object removal.",
    defaultPrice: 4000,
    defaultUnit: "shot",
    currency: "INR",
  },
  {
    id: "srv_4",
    name: "3D Animation",
    description: "3D scene composition, camera tracking, textured assets, and stylized render passes.",
    defaultPrice: 5000,
    defaultUnit: "project",
    currency: "INR",
  },
  {
    id: "srv_7",
    name: "Thumbnail Design",
    description: "High-CTR custom YouTube and social media thumbnail artwork crafted for maximum clicks.",
    defaultPrice: 800,
    defaultUnit: "thumbnail",
    currency: "INR",
  },
];

interface ServiceItem {
  id?: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultUnit?: string;
  currency?: string;
}

export default async function PricingPage() {
  let services: ServiceItem[] = FALLBACK_SERVICES;
  try {
    const loaded = await getServices();
    if (loaded && loaded.length > 0) {
      services = loaded;
    }
  } catch (err) {
    // fallback gracefully
  }

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase font-mono tracking-widest text-red mb-3">
            Services & Investment
          </p>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-tight">
            Transparent Pricing, Cinematic Quality.
          </h1>
          <p className="mt-6 text-mute text-base sm:text-lg leading-relaxed">
            Every project has a unique voice. Below are baseline rates for individual services. 
            For bundled retainers, recurring episodic work, or complex films, let&apos;s build a custom plan.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id || service.name}
              className="bg-card/70 border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-red/50 hover:bg-card transition-all group backdrop-blur-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-xl sm:text-2xl text-white group-hover:text-red transition-colors font-semibold">
                    {service.name}
                  </h3>
                  <span className="text-[10px] uppercase font-mono text-mute px-2 py-1 rounded bg-white/5 border border-white/10 shrink-0">
                    {service.defaultUnit || "project"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-secondary leading-relaxed">
                  {service.description || "High-end post-production delivered frame by frame."}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-white/10">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-mono text-mute tracking-wider uppercase shrink-0">
                    Starting from
                  </span>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-price font-bold text-2xl sm:text-3xl text-white [letter-spacing:-0.02em] leading-none tabular-nums">
                      ₹{Number(service.defaultPrice || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="font-price font-medium text-xs text-mute ml-1 align-baseline">
                      / {service.defaultUnit || "project"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/contact?service=${encodeURIComponent(service.name)}`}
                  className="mt-5 block w-full text-center py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-red text-white transition-all border border-white/10 hover:border-red shadow-sm"
                >
                  Book This Service →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-card via-[#16161c] to-card p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h3 className="font-display text-2xl sm:text-3xl text-white">
              Need a full production retainer or custom package?
            </h3>
            <p className="mt-2 text-secondary text-sm leading-relaxed">
              We offer dedicated monthly editing bandwidth for YouTube creators, marketing agencies, and brands.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 bg-red hover:bg-cherry text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-red/20 text-sm whitespace-nowrap"
          >
            Request Custom Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
