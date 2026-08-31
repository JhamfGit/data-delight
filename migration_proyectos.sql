-- =============================================================
-- MIGRACION: Catálogo de Proyectos (admin-panel change)
-- Ejecutar en registros_regency, sentencia por sentencia
-- =============================================================
--
-- `proyectos.nombre` es el único valor válido para `registros.proyecto`
-- de aquí en adelante -- reemplaza la lista fija de 12 opciones que
-- vivía hardcodeada en src/components/EmployeeForm.tsx. No tiene columna
-- `activo`: a diferencia de `usuarios`, un proyecto se elimina de verdad
-- (bloqueado si ya tiene historial en `registros`, ver
-- lib/proyectosService.js), no se desactiva.


-- PASO 1: Tabla de proyectos
-- =============================================================
CREATE TABLE IF NOT EXISTS proyectos (
  id         INT          NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_proyectos_nombre (nombre)
);


-- PASO 2: Semilla con los 12 proyectos oficiales (valores confirmados
-- contra el select en vivo de /dashboard, sesión 2026-08-31). Idempotente
-- -- INSERT IGNORE hace este archivo seguro de re-ejecutar.
-- =============================================================
INSERT IGNORE INTO proyectos (nombre) VALUES
  ('GICA'),
  ('V40'),
  ('CPC2526'),
  ('RUTA AL SUR'),
  ('ACCENORTE'),
  ('VINUS'),
  ('ADMINISTRACIÓN'),
  ('ESTANQUILLO'),
  ('GICA Contingencia'),
  ('CPC2526 Contingencia'),
  ('RUTA AL SUR Contingencia'),
  ('VINUS Contingencia');


-- VERIFICACION: mostrar estructura final
-- =============================================================
DESC proyectos;
SELECT * FROM proyectos ORDER BY nombre ASC;
