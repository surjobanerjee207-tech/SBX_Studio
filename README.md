# SBX_Studio
1. `cp .env.example .env.local` and fill it in. 2. `npm i && npx prisma migrate dev --name init` (needs DATABASE_URL). 3. `npm run dev`.
Replace videos/thumbnails in `lib/projects.ts` (mp4: full URL; youtube/vimeo: the video ID). Deploy: push to GitHub, import in Vercel, add the env vars, run `npx prisma migrate deploy` against your managed Postgres.
Contact form works without DB/Resend (it just skips them), so you can test locally first.

