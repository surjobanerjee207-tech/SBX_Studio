interface TimelineClip {
  left: number; // percentage from track start (0 - 100)
  width: number; // percentage width
  accent?: boolean; // true for the single red clip
}

type TimelineTrack = TimelineClip[];

// 4 horizontal tracks, each with 3 clips of varied, realistic cuts
const tracks: TimelineTrack[] = [
  // Track 1: Overlay / B-roll
  [
    { left: 3, width: 22 },
    { left: 30, width: 34 },
    { left: 69, width: 27 },
  ],
  // Track 2: Primary Video / A-roll
  [
    { left: 0, width: 36 },
    { left: 40, width: 28 },
    { left: 72, width: 28 },
  ],
  // Track 3: Audio FX / Dialogue (contains the single accent clip)
  [
    { left: 6, width: 18 },
    { left: 28, width: 26, accent: true }, // Exactly one accent red clip (bg-red)
    { left: 60, width: 32 },
  ],
  // Track 4: Music Bed / Ambience
  [
    { left: 0, width: 44 },
    { left: 48, width: 22 },
    { left: 74, width: 26 },
  ],
];

export function HeroTimeline() {
  return (
    <div
      aria-hidden="true"
      className="timeline-container relative w-full aspect-[16/8] md:aspect-[16/6] py-3 select-none pointer-events-none overflow-hidden"
    >
      <div className="flex h-full flex-col justify-between">
        {tracks.map((track, i) => (
          <div key={i} className="relative h-[16%]">
            {track.map((clip, j) => (
              <div
                key={j}
                className={`absolute inset-y-0 rounded-sm ${clip.accent ? "bg-red" : "bg-[#262626]"}`}
                style={{ left: `${clip.left}%`, width: `${clip.width}%` }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* playhead */}
      <div className="playhead absolute inset-y-0 w-0.5 bg-bone" />
    </div>
  );
}
