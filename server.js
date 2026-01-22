import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   LOG DE VARIABLES (CLAVE)
========================= */
console.log("📊 DB_HOST:", process.env.DB_HOST);
console.log("📊 DB_USER:", process.env.DB_USER);
console.log("📊 DB_NAME:", process.env.DB_NAME);
console.log("📊 DB_PORT:", process.env.DB_PORT || 3306);

/* =========================
   MYSQL POOL (CON TIMEOUT)
========================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 5000,     // 🔥 EVITA CUELGUES
  acquireTimeout: 5000,
});

/* =========================
   HEALTH CHECK (SIN DB)
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
  });
});

/* =========================
   TEST DB
========================= */
app.get("/api/test-db", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.json({
      ok: true,
      message: "✅ Conectado a MySQL",
    });
  } catch (error) {
    console.error("❌ Error DB:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/* =========================
   OBTENER REGISTROS
========================= */
app.get("/api/registros", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM registros ORDER BY id DESC"
    );

    console.log(`✅ Registros obtenidos: ${rows.length}`);

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error obteniendo registros:", error.message);
    res.status(500).json({
      ok: false,
      error: "Error obteniendo registros",
    });
  }
});

/* =========================
   GUARDAR REGISTRO
========================= */
app.post("/api/registros", async (req, res) => {
  try {
    const {
      proyecto,
      centroOperacion,
      cargo,
      cedula,
      nombre,
      numero,
      status,
    } = req.body;

    if (!proyecto || !cedula || !nombre) {
      return res.status(400).json({
        ok: false,
        error: "Campos obligatorios faltantes",
      });
    }

    console.log("📝 Guardando registro:", {
      proyecto,
      cedula,
      nombre,
    });

    const [result] = await pool.query(
      `
      INSERT INTO registros
      (proyecto, centro_operacion, cargo, cedula, nombre, numero, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        proyecto,
        centroOperacion || null,
        cargo || null,
        cedula,
        nombre,
        numero || null,
        status || "SI",
      ]
    );

    res.status(201).json({
      ok: true,
      id: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error guardando registro:", error.message);
    res.status(500).json({
      ok: false,
      error: "Error guardando registro",
    });
  }
});

/* =========================
   ELIMINAR REGISTRO
========================= */
app.delete("/api/registros/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM registros WHERE id = ?", [id]);

    res.json({
      ok: true,
      message: "Registro eliminado",
    });
  } catch (error) {
    console.error("❌ Error eliminando registro:", error.message);
    res.status(500).json({
      ok: false,
      error: "Error eliminando registro",
    });
  }
});

/* =========================
   LIMPIAR REGISTROS
========================= */
app.delete("/api/registros", async (req, res) => {
  try {
    await pool.query("DELETE FROM registros");

    res.json({
      ok: true,
      message: "Todos los registros eliminados",
    });
  } catch (error) {
    console.error("❌ Error limpiando registros:", error.message);
    res.status(500).json({
      ok: false,
      error: "Error limpiando registros",
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API escuchando en http://0.0.0.0:${PORT}`);
});
