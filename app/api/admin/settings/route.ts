import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  getStudioSettings,
  updateStudioSettings,
  setAdminPassword,
} from "@/lib/invoice-storage";
import { StudioSettingsSchema } from "@/lib/types/invoice";

const UpdateSettingsSchema = StudioSettingsSchema.partial().extend({
  newPassword: z.string().min(4, "Password must be at least 4 characters").optional(),
});

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getStudioSettings();
  const safe = { ...settings };
  delete safe.adminPasswordHash;
  delete safe.adminPasswordSalt;

  return NextResponse.json({ settings: safe });
}

export async function PUT(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { newPassword, ...settingsData } = parsed.data;

  // Handle password update if provided
  if (newPassword && newPassword.trim()) {
    await setAdminPassword(newPassword.trim());
  }

  const updated = await updateStudioSettings(settingsData);
  const safe = { ...updated };
  delete safe.adminPasswordHash;
  delete safe.adminPasswordSalt;

  return NextResponse.json({ ok: true, settings: safe });
}
