import { authManager, type Session } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().min(2).optional(),
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
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid credentials payload",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password, tenantId } = parsed.data;

  try {
    const result = await authManager.login(email, password, tenantId);
    const session = authManager.getSession(result.sessionId);

    if (!session) {
      throw new Error("Session not found after login");
    }

    if (!result.requiresMfa && session.mfaVerified) {
      const issued = authManager.issueToken(result.sessionId);
      return NextResponse.json({
        success: true,
        requiresMfa: false,
        token: issued.jwt,
        session: serializeSession(issued.session),
        message: "Login successful",
      });
    }

    return NextResponse.json({
      success: true,
      requiresMfa: true,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt.toISOString(),
      message: "MFA challenge issued",
    });
  } catch (error) {
    const message = (error as Error).message || "Authentication failed";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 },
    );
  }
}
