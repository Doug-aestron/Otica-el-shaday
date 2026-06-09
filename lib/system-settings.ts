import { prisma } from "@/lib/prisma";

export const SETTINGS_ID = "default";

export async function getSystemSettings() {
  return prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      clinicName: "El Shaday",
      appointmentMinutes: 30,
    },
    update: {},
  });
}
