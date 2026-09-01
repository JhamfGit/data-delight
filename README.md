# Registros Regency

Aplicación de control de acceso/registro de personal por proyecto y centro de operación, con panel administrativo, roles, auditoría de cambios y carga masiva desde Excel.

## ¿Qué hace?

- **Registro de personal** (`/dashboard`): cualquier usuario autenticado registra personas (proyecto, centro de operación, cargo, cédula, nombre, número). Todo registro nuevo entra con `status = "NO"`, que dispara un flujo externo (n8n) para su procesamiento.
- **Carga masiva por Excel**: sube un archivo `.xlsx` con varias personas y las mapea automáticamente a los campos del registro (`ExcelUploader`).
- **Panel de administración** (solo `admin`):
  - `/admin/usuarios`: crear usuarios, editar nombre/rol, activar/desactivar cuentas — cada cambio pide un motivo y queda auditado.
  - `/admin/proyectos`: crear, renombrar y eliminar proyectos (con protección para no borrar proyectos en uso).
- **Registros con alcance por rol** (`/admin/registros`, accesible a cualquier usuario autenticado, no solo admin): búsqueda y filtro de registros por texto, status, proyecto, centro de operación y usuario, con paginación. El backend (`lib/accessScope.js`) es quien decide qué puede ver/hacer cada rol.
- **Detalle y corrección de registro** (`/admin/registros/:id`): ver un registro, corregir su `status` (con motivo, auditado) y consultar su historial de auditoría.

## Arquitectura

Proyecto full-stack en un solo repo:

```
src/          Frontend — React + TypeScript + Vite + shadcn-ui
server.js     Backend — API REST en Express
lib/          Lógica de servidor (registros, proyectos, accessScope, config, seedPolicy)
migration*.sql  Esquema y migraciones de MySQL
```

> Nota: existe una carpeta `data-delight/` en la raíz con una copia antigua/incompleta del frontend (sin roles, sin admin, login con `localStorage`). No es la app activa — `index.html` carga `src/main.tsx`, así que el código vigente es el de `src/`.

### Frontend (`src/`)

- React 18 + TypeScript + Vite, UI con shadcn-ui (Radix) + Tailwind
- React Router con guards por rol (`AuthenticatedRoute`, `AdminRoute` en `src/components/routeGuards.tsx`)
- TanStack Query para estado de servidor
- Exportación/lectura de Excel (`xlsx`)
- Tests con Vitest + Testing Library (`*.test.tsx`)

### Backend (`server.js` + `lib/`)

- Express + MySQL (`mysql2`)
- Autenticación JWT (`jsonwebtoken`) + contraseñas con `bcrypt`
- El servidor **no arranca** sin `JWT_SECRET` (sin valor por defecto inseguro — ver `lib/config.js`)
- Auditoría: cambios de status de registros y cambios sobre usuarios (nombre, rol, estado) quedan registrados con motivo
- `accessScope.js` centraliza qué datos puede ver/modificar cada rol (`admin` vs `operador`)

## Requisitos previos

- Node.js
- MySQL
- (Opcional) un flujo n8n escuchando los registros nuevos

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (build-time, frontend) |
| `JWT_SECRET` | Secreto para firmar JWT — **requerido**, sin valor por defecto |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Conexión a MySQL |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | Usuario admin inicial (solo para `seed.js`, una sola vez) |

## Puesta en marcha

```bash
npm install

# 1. Crear el esquema
mysql < migration.sql
mysql < migration_admin_audit_log.sql
mysql < migration_proyectos.sql

# 2. Crear el usuario admin inicial (una sola vez)
node seed.js

# 3. Levantar backend y frontend
node server.js       # API en :3001
npm run dev           # Vite en :5173 (o el puerto configurado)
```

## Tests

```bash
npm run test        # una corrida
npm run test:watch  # modo watch
```

## Docker

El repo incluye `Dockerfile`, `Dockerfile.backend` y `nginx.conf` para desplegar frontend y backend en contenedores.
