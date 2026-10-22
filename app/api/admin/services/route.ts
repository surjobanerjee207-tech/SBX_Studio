import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  deleteService,
  getServices,
  saveService,
} from "@/lib/invoice-storage";
import { ServicePresetSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await getServices();
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ServicePresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid service data" },
      { status: 400 }
    );
  }

  const service = await saveService(parsed.data);
  return NextResponse.json({ ok: true, service });
}

export async function DELETE(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Service id is required" }, { status: 400 });
  }

  await deleteService(id);
  return NextResponse.json({ ok: true });
}
