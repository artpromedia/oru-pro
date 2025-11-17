import { randomUUID } from "node:crypto";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const mfaInput = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

const session = {
  token: randomUUID(),
  user: {
    id: "demo-user",
    email: "ops@oru.ai",
    roles: ["admin"],
    tenantId: "oru-demo"
  }
};

export const authRouter = router({
  login: publicProcedure.input(loginInput).mutation(async ({ input }) => {
    const mfaRequired = input.email.endsWith("@oru.ai");
    return {
      mfaRequired,
      session: mfaRequired ? null : session
    };
  }),

  verifyMfa: publicProcedure.input(mfaInput).mutation(async () => ({
    session
  })),

  currentSession: publicProcedure.query(() => session)
});

export type AuthRouter = typeof authRouter;
