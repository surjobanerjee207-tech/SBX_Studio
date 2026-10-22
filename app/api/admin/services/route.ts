export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  deleteService,
  getServices,
  saveService,
} from "@/lib/invoice-storage";
import { ServicePresetSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const services = await getServices();
    return NextResponse.json({ ok: true, services });
  } catch (err: any) {
    console.error("GET /api/admin/services error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch services." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ServicePresetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid service data" },
        { status: 400 }
      );
    }

    const service = await saveService(parsed.data);
    return NextResponse.json({ ok: true, service });
  } catch (err: any) {
    console.error("POST /api/admin/services error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to save service." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Service id is required" }, { status: 400 });
    }

    await deleteService(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/services error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to delete service." },
      { status: 500 }
    );
  }
}
