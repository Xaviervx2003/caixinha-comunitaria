#!/usr/bin/env node
// scripts/generate-secrets.mjs
// Execute com: node scripts/generate-secrets.mjs
// Depois copie os valores para o seu .env

import crypto from "crypto";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

rl.question("Digite a senha de admin que deseja usar: ", async (password) => {
  rl.close();

  if (!password || password.length < 8) {
    console.error("❌ Senha muito curta. Use no mínimo 8 caracteres.");
    process.exit(1);
  }

  const jwtSecret     = crypto.randomBytes(64).toString("hex");
  const passwordHash  = await bcrypt.hash(password, 12);

  console.log("\n✅ Copie os valores abaixo para o seu .env:\n");
  console.log(`JWT_SECRET="${jwtSecret}"`);
  console.log(`ADMIN_PASSWORD_HASH="${passwordHash}"`);
  console.log("\n⚠️  Guarde a senha em local seguro. Ela não pode ser recuperada.");
});
