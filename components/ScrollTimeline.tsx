"use client";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";

const OPACITY = 0.45; // overall visibility: raise for more, lower for less
const DURATION_SEC = 90; // fake "sequence length" shown by the timecode
const FPS = 24;

type Clip = { l: number; w: number; a?: boolean };
const TRACKS: Clip[][] = [
  [{ l: 2, w: 16 }, { l: 21, w: 24 }, { l: 49, w: 20 }, { l: 73, w: 24 }],
  [{ l: 0, w: 28 }, { l: 32, w: 14, a: true }, { l: 50, w: 22 }, { l: 76, w: 20 }],
  [{ l: 6, w: 20 }, { l: 30, w: 30 }, { l: 64, w: 14 }, { l: 82, w: 16 }],
  [{ l: 0, w: 14 }, { l: 18, w: 26 }, { l: 48, w: 18 }, { l: 70, w: 28 }],
];

const pad = (n: number) => String(n).padStart(2, "0");
function timecode(p: number) {
  const f = Math.round(p * DURATION_SEC * FPS);
  const ff = f % FPS;
  const s = Math.floor(f / FPS);
  return `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(ff)}`;
}

export function ScrollTimeline() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const x = useTransform(smooth, [0, 1], ["0vw", "99.6vw"]);
  const tc = useTransform(smooth, timecode);
  const ticks = Array.from({ length: 41 });

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: OPACITY }}>
        {/* ruler */}
        <div className="absolute inset-x-0 top-[34%] flex h-4 items-end justify-between px-[1%]">
          {ticks.map((_, i) => (
            <span key={i} className={`w-px bg-bone ${i % 5 === 0 ? "h-4" : "h-2"}`} />
          ))}
        </div>
        {/* played region */}
        <motion.div className="absolute inset-x-0 top-[34%] h-0.5 origin-left bg-red" style={{ scaleX: reduce ? 0.3 : smooth }} />
        {/* tracks */}
        <div className="absolute inset-x-0 top-[37%] flex h-[26vh] min-h-[170px] flex-col justify-between">
          {TRACKS.map((track, i) => (
            <div key={i} className="relative h-[20%]">
              {track.map((c, j) => (
                <span
                  key={j}
                  className={`absolute inset-y-0 rounded-sm ${c.a ? "bg-red" : "bg-[#8a8a8a]"}`}
                  style={{ left: `${c.l}%`, width: `${c.w}%` }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* playhead */}
        <motion.div className="absolute inset-y-0 left-0 w-[3px] bg-bone" style={{ x: reduce ? "30vw" : x }} />
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed bottom-5 left-5 z-0 font-mono text-xs tracking-widest text-bone/70">
        <motion.span>{reduce ? "00:00:27:00" : tc}</motion.span>
      </div>
    </>
  );
}

export default ScrollTimeline;
