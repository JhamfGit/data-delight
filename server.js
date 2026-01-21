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
});

// ENDPOINT: guardar registro
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

    const [result] = await pool.query(
      `
      INSERT INTO registros 
      (proyecto, centro_operacion, cargo, cedula, nombre, numero, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        proyecto,
        centro_operacion,
        cargo,
        cedula,
        nombre,
        numero,
        status,
      ]
    );

    res.status(201).json({
      ok: true,
      id_registro: result.insertId,
    });
  } catch (error) {
    console.error("Error DB:", error);
    res.status(500).json({ ok: false, error: "Error guardando registro" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
