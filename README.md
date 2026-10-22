# SBX_Studio

Portfolio website and private invoice manager for **SBX Studio**, a creative studio for video editing, motion graphics, 3D animation, sound design and VFX.

**Live site:** https://sbx-studio.vercel.app

## Features

### Public website
- Home, Work (portfolio videos) and Pricing pages
- Contact / inquiry form that emails new inquiries
- Responsive dark design with the SBX red accent

### Private invoice manager (`/admin`)
- Secure admin login
- Create invoices with a live A4 preview
- Client database with autofill
- Services and pricing presets with per-invoice price overrides
- Discounts, optional tax, extra charges, advance payment and balance due
- Currencies: INR, USD, EUR, GBP
- PDF download (A4) and shareable public invoice links
- UPI payment QR code on invoices
- Invoice history with search, filters, duplicate and mark as paid
- Studio settings: logo, contact details, bank/UPI details, payment terms, footer message

## Tech stack
- Next.js and TypeScript
- Tailwind CSS and Framer Motion
- Prisma ORM with PostgreSQL (Neon)
- Resend for email
- Deployed on Vercel

## Getting started (local)

1. Install dependencies:
```bash
   npm install
```
2. Create your environment file and fill it in:
```bash
   cp .env.example .env.local
```
   On Windows PowerShell: `Copy-Item .env.example .env.local`
3. Create the database tables:
```bash
   npx prisma migrate dev
```
4. Start the dev server:
```bash
   npm run dev
```
   Open http://localhost:3000 (admin at http://localhost:3000/admin).

## Environment variables

Copy the full list from `.env.example`. Never commit real values.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Postgres connection string for migrations |
| `RESEND_API_KEY` | Sends inquiry emails |
| `CONTACT_TO_EMAIL` | Where new inquiries are delivered |
| `CONTACT_FROM_EMAIL` | Sender address for emails |

The admin login variables (password and session secret) are also listed in `.env.example`. Use strong, unique values in production.

## Updating content
- **Portfolio videos and thumbnails:** edit `lib/projects.ts` (mp4: full URL; YouTube/Vimeo: the video ID).
- **Invoices, clients, services, prices and studio details:** all editable from the `/admin` dashboard, with no code changes needed.

## Deployment (Vercel)

1. Push the code to GitHub and import the repository in Vercel.
2. Add the environment variables in Project Settings, then Environment Variables.
3. Connect a managed Postgres database (for example Neon through Vercel Storage).
4. Apply the migrations to the production database:
```bash
   npx prisma migrate deploy
```
5. Redeploy.

Notes:
- Vercel's file system is read-only, so uploaded files (logo, custom QR image) must use Vercel Blob or similar storage.
- The contact form works without the database or Resend (it skips them), so you can test locally first.

## Security
- Never commit `.env` files, database links, API keys or passwords.
- Keep `/admin` protected with a strong password.
- Rotate the database password if it was ever exposed.

## License
Private project. All rights reserved by SBX Studio.
