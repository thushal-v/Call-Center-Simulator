import { NextRequest, NextResponse } from "next/server";
import { getHistory, deleteHistoryEntry } from "@/lib/history";

export async function GET() {
  try {
    const history = await getHistory();
    return NextResponse.json(history);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Validate ID format to prevent injection
    if (!/^[\w-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await deleteHistoryEntry(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
