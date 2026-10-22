import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { exportAllData, importAllData } from "@/lib/invoice-storage";

export async function GET(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await exportAllData();
  const filename = `SBX_Invoicing_Backup_${new Date().toISOString().split("T")[0]}.json`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(JSON.stringify(data, null, 2), { status: 200, headers });
}

export async function POST(req: Request) {
  if (!isAuthenticatedRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await importAllData(body);
    return NextResponse.json({ ok: true, message: "Backup data imported successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to import backup data" },
      { status: 400 }
    );
  }
}
