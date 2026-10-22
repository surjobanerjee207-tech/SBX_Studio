export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  deleteClient,
  getClients,
  saveClient,
} from "@/lib/invoice-storage";
import { ClientSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const clients = await getClients(query);
    return NextResponse.json({ ok: true, clients });
  } catch (err: any) {
    console.error("GET /api/admin/clients error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch clients." },
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
    const parsed = ClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid client data" },
        { status: 400 }
      );
    }

    const client = await saveClient(parsed.data);
    return NextResponse.json({ ok: true, client });
  } catch (err: any) {
    console.error("POST /api/admin/clients error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to save client." },
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
      return NextResponse.json({ ok: false, error: "Client id is required" }, { status: 400 });
    }

    await deleteClient(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/clients error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to delete client." },
      { status: 500 }
    );
  }
}
