import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  listRegistros,
  getRegistroDetail,
  changeRegistroStatus,
  getRegistroAuditLog,
} from "./lib/registrosService.js";

const app = express();
app.use(cors());
app.use(express.json());

// ─── Pool de conexiones ───────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  port:             process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit:  10,
});

// Fail closed: no insecure fallback default. A previously-hardcoded
// fallback value ("regency_jwt_secret_change_in_production") was a
// security finding -- anyone who saw the source code could forge valid
// tokens against any deployment that forgot to set JWT_SECRET. The
// server now refuses to start instead of running with a known secret.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
  console.error("FATAL: JWT_SECRET environment variable is required and has no fallback default. Refusing to start.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// ─── Middlewares ──────────────────────────────────────────────

/**
 * Verifica el JWT en el header Authorization: Bearer <token>
 * Inyecta req.user = { id, username, rol }
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ ok: false, error: "Token inválido o expirado" });
  }
};

/**
 * Solo permite acceso a usuarios con rol 'admin'
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({ ok: false, error: "Acceso denegado: se requiere rol admin" });
  }
  next();
};

// ─── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ─── AUTH ─────────────────────────────────────────────────────

/** POST /api/auth/login */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Usuario y contraseña requeridos" });
    }

    const [rows] = await pool.execute(
      "SELECT id, username, password, nombre, rol, activo FROM usuarios WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(401).json({ ok: false, error: "Usuario desactivado" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`✅ Login: ${user.username} (${user.rol})`);
    res.json({ ok: true, token, user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    console.error("❌ Error login:", error);
    res.status(500).json({ ok: false, error: "Error en el servidor" });
  }
});

/** GET /api/auth/me */
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// ─── REGISTROS ────────────────────────────────────────────────

/** GET /api/registros?page=1&limit=10 o ?all=true */
app.get("/api/registros", authenticateToken, async (req, res) => {
  try {
    // Si solicita exportar todo (sin paginación)
    if (req.query.all === "true") {
      let dataQuery, params;
      if (req.user.rol === "admin") {
        dataQuery = `
          SELECT r.*, u.username AS usuario_nombre
          FROM registros r
          LEFT JOIN usuarios u ON r.user_id = u.id
          ORDER BY r.id_registro DESC
        `;
        params = [];
      } else {
        dataQuery = `
          SELECT * FROM registros
          WHERE user_id = ?
          ORDER BY id_registro DESC
        `;
        params = [req.user.id];
      }
      const [rows] = await pool.query(dataQuery, params);
      console.log(`✅ Registros exportación completa: ${rows.length} — usuario: ${req.user.username}`);
      return res.json({ ok: true, data: rows });
    }

    // Filtros + scope (admin: todos; operador: solo los propios) —
    // extraído a lib/registrosService.js (design D1 / spec "Role-Scoped
    // Registro Search, Filter, and Detail").
    const { q, status, proyecto, centro_operacion, page, pageSize, limit } = req.query;
    const result = await listRegistros(pool, req.user, {
      q,
      status,
      proyecto,
      centro_operacion,
      page,
      pageSize: pageSize || limit, // `limit` kept as a back-compat alias
    });

    console.log(
      `✅ Registros obtenidos: ${result.body.data.length} (total ${result.body.pagination.total}, página ${result.body.pagination.page}/${result.body.pagination.totalPages}) — usuario: ${req.user.username}`
    );
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error("❌ Error DB obteniendo registros:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo registros: " + error.message });
  }
});

/** GET /api/registros/:id — detalle de un registro (design API Surface) */
app.get("/api/registros/:id", authenticateToken, async (req, res) => {
  try {
    const result = await getRegistroDetail(pool, req.user, req.params.id);
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error("❌ Error DB obteniendo registro:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo registro" });
  }
});

/**
 * PATCH /api/registros/:id/status — corrección auditada de status
 * (design D4). Body: { fromStatus, toStatus, reason }.
 */
app.patch("/api/registros/:id/status", authenticateToken, async (req, res) => {
  try {
    const { fromStatus, toStatus, reason } = req.body;
    const result = await changeRegistroStatus(pool, {
      actor: req.user,
      id: req.params.id,
      fromStatus,
      toStatus,
      reason,
    });
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error("❌ Error DB actualizando status:", error);
    res.status(500).json({ ok: false, error: "Error actualizando status" });
  }
});

/** GET /api/registros/:id/audit — historial de auditoría del registro */
app.get("/api/registros/:id/audit", authenticateToken, async (req, res) => {
  try {
    const result = await getRegistroAuditLog(pool, req.user, req.params.id);
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error("❌ Error DB obteniendo auditoría:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo auditoría" });
  }
});

/** POST /api/registros — status SIEMPRE "NO" (dispara n8n) */
app.post("/api/registros", authenticateToken, async (req, res) => {
  try {
    const { proyecto, centro_operacion, cargo, cedula, nombre, numero } = req.body;

    // ⚠️ status forzado a "NO" en servidor — no se acepta del cliente
    // Este valor dispara el flujo n8n que gestiona el envío de mensajes
    const STATUS_FORZADO = "NO";

    console.log("📝 Guardando registro:", { proyecto, centro_operacion, cargo, cedula, nombre, user_id: req.user.id });

    const [result] = await pool.execute(
      `INSERT INTO registros
       (user_id, proyecto, centro_operacion, cargo, cedula, nombre, numero, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, proyecto, centro_operacion, cargo, cedula, nombre, numero, STATUS_FORZADO]
    );

    console.log(`✅ Registro guardado ID: ${result.insertId}`);
    res.status(201).json({ ok: true, id_registro: result.insertId });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error guardando registro" });
  }
});

/** DELETE /api/registros/:id */
app.delete("/api/registros/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando registro ID: ${id} — solicitado por: ${req.user.username}`);

    // Admin puede eliminar cualquiera; operador solo los suyos
    let query, params;
    if (req.user.rol === "admin") {
      query  = "DELETE FROM registros WHERE id_registro = ?";
      params = [id];
    } else {
      query  = "DELETE FROM registros WHERE id_registro = ? AND user_id = ?";
      params = [id, req.user.id];
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Registro no encontrado o sin permiso" });
    }

    console.log(`✅ Registro ${id} eliminado`);
    res.json({ ok: true, message: "Registro eliminado" });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error eliminando registro" });
  }
});

/** DELETE /api/registros — limpia registros del usuario (admin = todos) */
app.delete("/api/registros", authenticateToken, async (req, res) => {
  try {
    console.log(`🗑️ Limpiando registros — solicitado por: ${req.user.username} (${req.user.rol})`);

    if (req.user.rol === "admin") {
      await pool.execute("DELETE FROM registros");
      console.log("✅ Todos los registros eliminados (admin)");
    } else {
      await pool.execute("DELETE FROM registros WHERE user_id = ?", [req.user.id]);
      console.log(`✅ Registros del usuario ${req.user.username} eliminados`);
    }

    res.json({ ok: true, message: "Registros eliminados" });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error limpiando registros" });
  }
});

// ─── ADMIN — GESTIÓN DE USUARIOS ─────────────────────────────

/** GET /api/admin/usuarios */
app.get("/api/admin/usuarios", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, nombre, rol, activo, created_at FROM usuarios ORDER BY created_at DESC"
    );
    res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo usuarios" });
  }
});

/** POST /api/admin/usuarios — crear usuario */
app.post("/api/admin/usuarios", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, nombre, rol = "operador" } = req.body;

    if (!username || !password || !nombre) {
      return res.status(400).json({ ok: false, error: "username, password y nombre son requeridos" });
    }

    if (!["admin", "operador"].includes(rol)) {
      return res.status(400).json({ ok: false, error: "Rol inválido. Use 'admin' u 'operador'" });
    }

    // Verificar si ya existe
    const [existing] = await pool.execute(
      "SELECT id FROM usuarios WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: "El username ya está en uso" });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)",
      [username, hash, nombre, rol]
    );

    console.log(`✅ Usuario creado: ${username} (${rol})`);
    res.status(201).json({ ok: true, id: result.insertId, username, nombre, rol });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error creando usuario" });
  }
});

/** DELETE /api/admin/usuarios/:id */
app.delete("/api/admin/usuarios/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario admin
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ ok: false, error: "No podés eliminar tu propio usuario" });
    }

    await pool.execute("DELETE FROM usuarios WHERE id = ?", [id]);
    console.log(`✅ Usuario ${id} eliminado`);
    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("❌ Error DB:", error);
    res.status(500).json({ ok: false, error: "Error eliminando usuario" });
  }
});

// ─── Servidor ─────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API escuchando en puerto ${PORT}`);
  console.log(`📊 DB_HOST: ${process.env.DB_HOST}`);
  console.log(`📊 DB_NAME: ${process.env.DB_NAME}`);
});
