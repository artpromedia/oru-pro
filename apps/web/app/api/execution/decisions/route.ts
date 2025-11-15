import { NextResponse } from "next/server";
import { mockDecisionMetrics, mockDecisions } from "@/lib/execution-mock";

export async function GET() {
  return NextResponse.json({
    decisions: mockDecisions,
    metrics: mockDecisionMetrics,
    updatedAt: new Date().toISOString(),
  });
}
