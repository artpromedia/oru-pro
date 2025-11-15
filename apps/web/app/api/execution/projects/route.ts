import { NextResponse } from "next/server";
import { mockExecutionBoard, mockProjectStats } from "@/lib/execution-mock";

export async function GET() {
  return NextResponse.json({
    board: mockExecutionBoard,
    stats: mockProjectStats,
    updatedAt: new Date().toISOString(),
  });
}
