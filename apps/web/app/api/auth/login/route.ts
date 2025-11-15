import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
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
      { status: 400 }
    );
  }

  const { email, rememberMe } = parsed.data;
  const requiresMfa = !email.endsWith("@oru.ai");

  return NextResponse.json({
    success: true,
    token: "mock-session-token",
    requiresMfa,
    user: {
      name: "Operations Lead",
      email,
      roles: ["operations", "decision-maker"],
    },
    session: {
      expiresInMinutes: rememberMe ? 1440 : 60,
      issuedAt: new Date().toISOString(),
    },
    message: requiresMfa ? "MFA challenge issued" : "Login successful",
  });
}
