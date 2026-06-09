import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { serializeOpeningHours } from "../lib/opening-hours";

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      clinicName: "El Shaday",
      clinicPhone: null,
      clinicEmail: "contato@elshaday.com",
      appointmentMinutes: 30,
      openingHours:
        serializeOpeningHours({
          v: 1,
          days: [
            { day: 1, open: "08:00", close: "18:00" },
            { day: 2, open: "08:00", close: "18:00" },
            { day: 3, open: "08:00", close: "18:00" },
            { day: 4, open: "08:00", close: "18:00" },
            { day: 5, open: "08:00", close: "18:00" },
          ],
        }) ?? null,    },
    update: {},
  });

  const password = await bcrypt.hash("123456", 10);

  const users: { email: string; name: string; role: Role }[] = [
    { email: "admin@elshaday.com", name: "Administrador", role: Role.ADMIN },
    { email: "recepcao@elshaday.com", name: "Recepção", role: Role.RECEPCAO },
    { email: "medico@elshaday.com", name: "Médico", role: Role.MEDICO },
    { email: "vendedor@elshaday.com", name: "Vendedor", role: Role.VENDEDOR },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: password, name: u.name, role: u.role, active: true },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: password,
      },
    });
  }

  console.log("Seed concluído: usuários de teste criados/atualizados.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
