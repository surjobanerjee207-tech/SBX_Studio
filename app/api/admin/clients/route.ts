import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  deleteClient,
  getClients,
  saveClient,
} from "@/lib/invoice-storage";
import { ClientSchema } from "@/lib/types/invoice";

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await getClients();
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid client data" },
      { status: 400 }
    );
  }

  const client = await saveClient(parsed.data);
  return NextResponse.json({ ok: true, client });
}

export async function DELETE(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Client id is required" }, { status: 400 });
  }

  await deleteClient(id);
  return NextResponse.json({ ok: true });
}
