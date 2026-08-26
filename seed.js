/**
 * seed.js — Crea el usuario admin inicial
 * Uso: node seed.js
 * Ejecutar UNA sola vez después de correr migration.sql
 */
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import "dotenv/config";
import { validateSeedCredentials, SeedPolicyError } from "./lib/seedPolicy.js";

// The credential-required check lives in lib/seedPolicy.js (pure,
// unit-tested) so this is only the wiring into process.exit(1) — same
// observable behavior as before the extraction.
let ADMIN_USERNAME, ADMIN_PASSWORD;
try {
  ({ adminUsername: ADMIN_USERNAME, adminPassword: ADMIN_PASSWORD } = validateSeedCredentials(process.env));
} catch (err) {
  if (err instanceof SeedPolicyError) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }
  throw err;
}

const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || "Administrador Regency";

async function seed() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     process.env.DB_PORT || 3306,
  });

  try {
    // Verificar si ya existe
    const [rows] = await connection.execute(
      "SELECT id FROM usuarios WHERE username = ?",
      [ADMIN_USERNAME]
    );

    if (rows.length > 0) {
      console.log("⚠️  El usuario admin ya existe. Abortando seed.");
      return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await connection.execute(
      "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, 'admin')",
      [ADMIN_USERNAME, hash, ADMIN_NOMBRE]
    );

    console.log("✅ Usuario admin creado exitosamente");
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Rol:      admin`);
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
