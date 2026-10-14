import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.tsx","./components/**/*.tsx"],
 theme:{extend:{colors:{ink:"#080808",panel:"#111111",bone:"#F5F5F5",mute:"#929292",red:"#E50914",cherry:"#990F19"},
 fontFamily:{display:["var(--f-display)","serif"],sans:["var(--f-sans)","sans-serif"]}}}} satisfies Config;
