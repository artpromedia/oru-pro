import { NextResponse } from "next/server";
import { generalLedgerSnapshot } from "@/lib/finance-mock";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyCode = searchParams.get("companyCode") ?? generalLedgerSnapshot.companyCode;

  return NextResponse.json({
    ...generalLedgerSnapshot,
    companyCode,
    lastUpdated: new Date().toISOString(),
  });
}
