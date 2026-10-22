export const dynamic = "force-dynamic";

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
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getStudioSettings();
    const safe = { ...settings };
    delete safe.adminPasswordHash;
    delete safe.adminPasswordSalt;

    return NextResponse.json({ ok: true, settings: safe });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load studio settings." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" },
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
  } catch (err: any) {
    console.error("PUT /api/admin/settings error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to update studio settings." },
      { status: 500 }
    );
  }
}
