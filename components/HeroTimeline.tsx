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
    { left: 28, width: 26, accent: true }, // Exactly one accent red clip (#E50914)
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
      className="relative w-full select-none pointer-events-none py-2.5 overflow-hidden"
    >
      {/* 4 Tracks with clips */}
      <div className="space-y-2 sm:space-y-2.5">
        {tracks.map((track, trackIdx) => (
          <div key={trackIdx} className="relative h-5 sm:h-6 w-full">
            {track.map((clip, clipIdx) => (
              <div
                key={clipIdx}
                style={{
                  left: `${clip.left}%`,
                  width: `${clip.width}%`,
                }}
                className={`absolute top-0 bottom-0 rounded-[2px] ${
                  clip.accent ? "bg-[#E50914]" : "bg-[#262626]"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 2px playhead line moving left to right via translateX in a 6s loop */}
      <div className="absolute top-0 bottom-0 right-full w-full pointer-events-none playhead-runner">
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-[#F5F5F5]" />
      </div>
    </div>
  );
}
