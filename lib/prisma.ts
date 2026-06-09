import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Garante que o client gerado inclui os models atuais do schema. */
function prismaDelegatesReady(client: PrismaClient): boolean {
  const c = client as PrismaClient & {
    systemSettings?: { upsert?: unknown };
    financialCost?: { aggregate?: unknown };
  };
  return (
    typeof c.systemSettings?.upsert === "function" &&
    typeof c.financialCost?.aggregate === "function"
  );
}

function disposeCachedClient() {
  const old = globalForPrisma.prisma;
  globalForPrisma.prisma = undefined;
  if (old) {
    void old.$disconnect().catch(() => {});
  }
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && prismaDelegatesReady(cached)) {
    return cached;
  }

  disposeCachedClient();

  const client = createPrismaClient();
  if (!prismaDelegatesReady(client)) {
    throw new Error(
      "Prisma Client desatualizado (falta systemSettings). Pare o npm run dev, execute npx prisma generate e inicie o servidor novamente.",
    );
  }

  globalForPrisma.prisma = client;
  return client;
}

/**
 * Proxy para que, após hot-reload ou generate parcial, o próximo acesso
 * recrie o singleton se os delegates estiverem incompletos.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
