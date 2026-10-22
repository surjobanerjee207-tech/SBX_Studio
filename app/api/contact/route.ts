import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  projectType: z.string().trim().max(40),
  budget: z.string().trim().max(40).optional(),
  description: z.string().trim().min(10).max(2000),
  deadline: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Enforce 4-digit year format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
        const [y, m, d] = val.split("-").map(Number);
        const parsed = new Date(y, m - 1, d);
        if (
          isNaN(parsed.getTime()) ||
          parsed.getFullYear() !== y ||
          parsed.getMonth() !== m - 1 ||
          parsed.getDate() !== d
        ) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
        maxDate.setHours(23, 59, 59, 999);

        return parsed >= today && parsed <= maxDate;
      },
      { message: "Please choose a date within the next 2 years" }
    ),
  website: z.string().max(0).optional(),
});

const hits = new Map<string, number[]>(); // in-memory limiter; use Upstash/Redis for multi-instance production
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "x";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600000);
  if (recent.length >= 15) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const deadlineIssue = parsed.error.issues.find((i) => i.path.includes("deadline"));
    return NextResponse.json(
      {
        error: deadlineIssue?.message || "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const d = parsed.data;
  try {
    if (process.env.DATABASE_URL) {
      const { PrismaClient } = await import("@prisma/client");
      const db = new PrismaClient();
      await db.contactInquiry.create({
        data: {
          name: d.name,
          email: d.email,
          projectType: d.projectType,
          budget: d.budget || null,
          description: d.description,
          deadline: d.deadline ? new Date(d.deadline) : null,
        },
      });
      await db.$disconnect();
    }
    if (process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL) {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev",
        to: process.env.CONTACT_TO_EMAIL,
        replyTo: d.email,
        subject: `New inquiry: ${d.projectType}`,
        html: `<p><b>${esc(d.name)}</b> (${esc(d.email)})</p><p>${esc(d.description)}</p>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact failed", e);
    return NextResponse.json({ error: "Could not process inquiry" }, { status: 500 });
  }
}
