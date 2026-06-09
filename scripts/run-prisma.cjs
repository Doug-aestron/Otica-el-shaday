/**
 * Garante que `.env` na raiz do projeto seja carregado antes do Prisma CLI.
 * Evita P1012 no Windows/CMD quando o Prisma não injeta as variáveis sozinho.
 */
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
process.chdir(root);

require("dotenv").config({ path: path.join(root, ".env") });
require("dotenv").config({ path: path.join(root, ".env.local") });

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error(
    "\n[el-shaday] Coloque DATABASE_URL e DIRECT_URL no arquivo .env na pasta raiz (junto do package.json).\n" +
      `Pasta esperada: ${root}\n`,
  );
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Uso: node scripts/run-prisma.cjs <comando prisma...>\nEx.: node scripts/run-prisma.cjs db push");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  shell: true,
  cwd: root,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
