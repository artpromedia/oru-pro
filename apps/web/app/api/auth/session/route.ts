import { authManager, type Session } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const serializeSession = (session: Session) => ({
  userId: session.userId,
  tenantId: session.tenantId,
  userType: session.userType,
  permissions: session.permissions,
  profile: session.profile,
  expiresAt: session.expiresAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await authManager.validateRequest(request);
    return NextResponse.json({ success: true, session: serializeSession(session) });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "Session invalid",
      },
      { status: 401 },
    );
  }
}
