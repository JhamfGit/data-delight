-- =============================================================
-- MIGRACION: Admin Audit Log (admin-panel change, design D3)
-- Ejecutar en registros_regency, sentencia por sentencia
-- =============================================================
--
-- NOTA: usuarios.activo TINYINT(1) NOT NULL DEFAULT 1 ya existe en esta
-- base de datos (ver migration.sql PASO 1) -- no requiere migracion.
-- Confirmado en vivo, ver openspec/changes/admin-panel/tasks.md Fase 0.


-- PASO 1: Tabla de auditoria (append-only: sin UPDATE/DELETE en la app)
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id     INT           NOT NULL,       -- usuarios.id, tomado del JWT, nunca del cliente
  actor_rol    VARCHAR(32)   NOT NULL,       -- rol del actor al momento de la accion
  entity       VARCHAR(32)   NOT NULL,       -- 'registro' | 'usuario'
  entity_id    VARCHAR(64)   NOT NULL,       -- VARCHAR para tolerar el tipo exacto de la PK referenciada
  action       VARCHAR(48)   NOT NULL,       -- 'status_change' | 'user_deactivate' | 'user_reactivate' | 'user_update'
  field        VARCHAR(64)   NULL,           -- 'status' | 'activo' | ...
  old_value    VARCHAR(255)  NULL,
  new_value    VARCHAR(255)  NULL,
  reason       VARCHAR(500)  NOT NULL,       -- obligatorio, recortado, no vacio
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- PASO 2: Indice por entidad (listar auditoria de un registro/usuario)
-- =============================================================
ALTER TABLE admin_audit_log
  ADD INDEX idx_entity (entity, entity_id, created_at);


-- PASO 3: Indice por actor (listar acciones de un usuario administrador)
-- =============================================================
ALTER TABLE admin_audit_log
  ADD INDEX idx_actor (actor_id, created_at);


-- VERIFICACION: mostrar estructura final
-- =============================================================
DESC admin_audit_log;
