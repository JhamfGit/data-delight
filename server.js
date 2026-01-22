import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 5000,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Test de conexión a BD
app.get("/api/test-db", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: "connected", message: "Database connection successful" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Obtener todos los registros
app.get("/api/registros", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM registros ORDER BY id DESC");
    console.log(`✅ Registros obtenidos: ${rows.length}`);
    res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo registros" });
  }
});

// Guardar un registro
app.post("/api/registros", async (req, res) => {
  try {
    const {
      proyecto,
      centro_operacion,
      cargo,
      cedula,
      nombre,
      numero,
      status,
    } = req.body;
    
    console.log("📝 Guardando registro:", { proyecto, centro_operacion, cargo, cedula, nombre });
    
    const [result] = await pool.query(
      `INSERT INTO registros 
      (proyecto, centro_operacion, cargo, cedula, nombre, numero, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [proyecto, centro_operacion, cargo, cedula, nombre, numero, status]
    );
    
    console.log(`✅ Registro guardado con ID: ${result.insertId}`);
    
    res.status(201).json({
      ok: true,
      id_registro: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error guardando registro" });
  }
});

// Eliminar un registro específico
app.delete("/api/registros/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando registro ID: ${id}`);
    await pool.query("DELETE FROM registros WHERE id = ?", [id]);
    console.log(`✅ Registro ${id} eliminado`);
    res.json({ ok: true, message: "Registro eliminado" });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error eliminando registro" });
  }
});

// Eliminar todos los registros
app.delete("/api/registros", async (req, res) => {
  try {
    console.log("🗑️ Limpiando todos los registros");
    await pool.query("DELETE FROM registros");
    console.log("✅ Todos los registros eliminados");
    res.json({ ok: true, message: "Todos los registros eliminados" });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error limpiando registros" });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API escuchando en puerto ${PORT}`);
  console.log(`📊 DB_HOST: ${process.env.DB_HOST}`);
  console.log(`📊 DB_NAME: ${process.env.DB_NAME}`);
});
