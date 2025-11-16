import { authManager, type Session } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  sessionId: z.string().uuid(),
  token: z.string().min(6).max(8),
});

const serializeSession = (session: Session) => ({
  userId: session.userId,
  tenantId: session.tenantId,
  userType: session.userType,
  permissions: session.permissions,
  profile: session.profile,
  expiresAt: session.expiresAt.toISOString(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid MFA payload",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const { sessionId, token } = parsed.data;
    const issued = await authManager.verifyMFA(sessionId, token);
    return NextResponse.json({
      success: true,
      requiresMfa: false,
      token: issued.jwt,
      session: serializeSession(issued.session),
      message: "MFA verified",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "MFA verification failed",
      },
      { status: 401 },
    );
  }
}
