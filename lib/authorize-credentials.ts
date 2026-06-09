import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { CredentialsSignin } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

class DatabaseConnectionError extends CredentialsSignin {
  code = "database_connection";
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Authentication failed against database server") ||
    message.includes("Can't reach database server")
  );
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authorizeCredentials(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new DatabaseConnectionError();
    }
    throw error;
  }

  if (!user || !user.active) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
