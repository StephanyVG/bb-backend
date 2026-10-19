# ☕ Cafetería API - Producción (REST API)

Servidor backend REST API de alto rendimiento y grado de producción para cafetería, construido con **Node.js**, **Express**, **Prisma ORM** y **PostgreSQL** (optimizado para Supabase / Neon / RDS).

---

## 🏗️ Arquitectura y Tecnologías

- **Runtime & Servidor**: Node.js + Express 5
- **ORM & Modelado**: Prisma ORM con precisión financiera (`Decimal(10, 2)`)
- **Base de Datos**: PostgreSQL con índices optimizados en fechas de creación y claves foráneas
- **Seguridad**:
  - `helmet`: Protección de cabeceras HTTP (X-Frame-Options, CSP, HSTS, etc.)
  - `cors`: Validación dinámica de dominios autorizados vía `ALLOWED_ORIGINS` (con soporte para subdominios `.vercel.app`)
  - Middleware `requireAdminAuth`: Doble factor de autorización por header `x-api-key` o `Authorization: Bearer <token>`
- **Transacciones Atómicas**:
  - `prisma.$transaction` en la creación de pedidos: consulta de precios vigentes, validación de stock activo, congelamiento de precio histórico y cálculo automático de comisión para origen `anticuario`.

---

## 📁 Estructura del Proyecto

```
cafeteria-api-prod/
├── prisma/
│   ├── schema.prisma           # Modelos Producto, Pedido, DetallePedido, Comision
│   └── seed.js                 # Semilla de 5 productos iniciales de cafetería
├── src/
│   ├── config/
│   │   └── env.js              # Carga y validación de variables de entorno
│   ├── lib/
│   │   └── prisma.js           # Cliente singleton de Prisma
│   ├── middlewares/
│   │   ├── auth.js             # Middleware requireAdminAuth (x-api-key / Bearer)
│   │   ├── cors.js             # Configuración dinámica de CORS
│   │   └── errorHandler.js     # Manejador centralizado de errores (Prisma / HTTP)
│   ├── controllers/
│   │   ├── productos.controller.js # CRUD catálogo con Soft Delete
│   │   ├── pedidos.controller.js   # Creación con cálculo en servidor y cambio de estado
│   │   ├── dashboard.controller.js # Filtro de pedidos y monitor de cocina
│   │   └── finanzas.controller.js  # Corte de mes y agregaciones financieras
│   ├── routes/
│   │   ├── productos.routes.js
│   │   ├── pedidos.routes.js
│   │   ├── dashboard.routes.js
│   │   └── finanzas.routes.js
│   ├── app.js                  # Configuración de Express y middlewares
│   └── index.js                # Entrada del servidor con Graceful Shutdown
├── .env                        # Variables de entorno locales
├── .env.example                # Plantilla de variables de entorno
├── package.json
└── README.md
```

---

## ⚙️ 1. Configuración de Entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```bash
cp .env.example .env
```

Variables requeridas en `.env`:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP del servidor | `8080` |
| `DATABASE_URL` | URI de conexión a PostgreSQL (Supabase o Neon) | `postgresql://user:pass@host:5432/db?schema=public` |
| `ADMIN_API_KEY` | Clave secreta para proteger rutas de administración | `mi_clave_super_secreta_dashboard` |
| `ALLOWED_ORIGINS` | Dominios frontend permitidos separados por coma | `http://localhost:3000,http://localhost:5173,*.vercel.app` |

---

## 🗄️ 2. Base de Datos y Migraciones

### Modelos de Datos en `schema.prisma`

1. **`Producto`**: Catálogo con soft delete (`estado: 'activo' | 'inactivo'`), precio decimal y fecha de actualización.
2. **`Pedido`**: Orden con total calculado en servidor, origen (`anticuario`), estados (`pendiente`, `preparando`, `completado`, `cancelado`) e índice en `fecha_creacion` para cortes rápidos.
3. **`DetallePedido`**: Relación 1:N con pedido y producto, registrando `precio_unitario_congelado` para proteger los cortes históricos.
4. **`Comision`**: Relación 1:1 con pedido (cuando origen es `anticuario`), calcula automáticamente el 10% del total.

### Comandos de Base de Datos

```bash
# 1. Generar el cliente Prisma
npx prisma generate

# 2. Aplicar migraciones en desarrollo
npx prisma migrate dev --name init

# 3. Desplegar migraciones en producción (Render, Railway, etc.)
npm run build

# 4. Poblar la base con los 5 productos iniciales de cafetería
npm run prisma:seed
```

---

## 🚀 3. Ejecución del Servidor

```bash
# Modo Desarrollo (con recarga automática mediante Nodemon)
npm run dev

# Modo Producción
npm start
```

---

## 🔐 4. Autenticación de Administrador (`requireAdminAuth`)

Las rutas protegidas requieren cualquiera de estos dos headers en la petición HTTP:

- **Header directo:** `x-api-key: <ADMIN_API_KEY>`
- **Header estándar:** `Authorization: Bearer <ADMIN_API_KEY>`

Si el header falta devuelve `401 Unauthorized`. Si el valor es incorrecto devuelve `403 Forbidden`.

---

## 📡 5. Referencia Completa de la API

### A. Catálogo (`/api/productos`)

#### `GET /api/productos`
- **Acceso:** Público (usado por el menú digital de clientes).
- **Query Params:** `?activo=true` (opcional: si se envía, filtra solo los activos; si no, retorna todos).
- **Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "nombre": "Espresso Americano",
      "precio": "35.00",
      "categoria": "Bebidas Calientes",
      "estado": "activo",
      "fecha_actualizacion": "2026-10-19T14:50:00.000Z"
    }
  ]
}
```

#### `POST /api/productos`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Body:**
```json
{
  "nombre": "Mocaccino Especial",
  "precio": 52.50,
  "categoria": "Bebidas Calientes",
  "estado": "activo"
}
```

#### `PUT /api/productos/:id`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Body:** Actualiza uno o más campos (`nombre`, `precio`, `categoria`).
```json
{
  "precio": 55.00
}
```

#### `PATCH /api/productos/:id/estado`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Body:** Soft delete o reactivación.
```json
{
  "estado": "inactivo"
}
```

---

### B. Operación de Pedidos (`/api/pedidos`)

#### `POST /api/pedidos`
- **Acceso:** Público (Menú de clientes).
- **Body:**
```json
{
  "nombre_cliente": "Sofía Mendoza",
  "origen": "anticuario",
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 4, "cantidad": 1 }
  ]
}
```
- **Lógica Financiera:**
  - Consulta en la base de datos el precio actual de cada producto (verificando `estado: 'activo'`).
  - Calcula `total_calculado` en el servidor con precisión en centavos.
  - Guarda en `DetallePedido` cada item con su `precio_unitario_congelado`.
  - Si `origen === 'anticuario'`, calcula el 10% y crea el registro en `Comision`.
- **Respuesta (201 Created):**
```json
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "data": {
    "id": 12,
    "nombre_cliente": "Sofía Mendoza",
    "origen": "anticuario",
    "total_calculado": "112.00",
    "estado": "pendiente",
    "fecha_creacion": "2026-10-19T14:55:00.000Z",
    "detalles": [
      {
        "id": 20,
        "pedido_id": 12,
        "producto_id": 1,
        "cantidad": 2,
        "precio_unitario_congelado": "35.00",
        "producto": { "id": 1, "nombre": "Espresso Americano", "categoria": "Bebidas Calientes" }
      },
      {
        "id": 21,
        "pedido_id": 12,
        "producto_id": 4,
        "cantidad": 1,
        "precio_unitario_congelado": "42.00",
        "producto": { "id": 4, "nombre": "Croissant Artesanal de Mantequilla", "categoria": "Panadería" }
      }
    ],
    "comision": {
      "id": 5,
      "pedido_id": 12,
      "porcentaje_aplicado": "10.00",
      "monto_comision": "11.20",
      "estado_pago": "pendiente",
      "fecha_creacion": "2026-10-19T14:55:00.000Z"
    }
  }
}
```

#### `GET /api/dashboard/pedidos`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Query Params:** `?estado=pendiente` (opcional: filtra por estado).
- **Orden:** `fecha_creacion` ascendente (los pedidos más antiguos primero para atención ágil en cocina).
- **Relaciones incluidas:** Detalles con nombre y categoría del producto, y datos de comisión.

#### `PATCH /api/pedidos/:id/estado`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Body:**
```json
{
  "estado": "preparando"
}
```
*Estados válidos: `pendiente`, `preparando`, `completado`, `cancelado`.*

---

### C. Finanzas y Corte de Mes (`/api/finanzas/corte`)

#### `GET /api/finanzas/corte`
- **Acceso:** Protegido (`requireAdminAuth`).
- **Query Params Obligatorios:** `?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD`.
- **Filtro:** Incluye únicamente pedidos con `estado: 'completado'` creados dentro del rango de fechas (cubre el día final hasta las 23:59:59.999Z).
- **Ejemplo:** `GET /api/finanzas/corte?fecha_inicio=2026-10-01&fecha_fin=2026-10-31`
- **Respuesta:**
```json
{
  "success": true,
  "periodo": {
    "fecha_inicio": "2026-10-01",
    "fecha_fin": "2026-10-31"
  },
  "total_ventas_brutas": 45200.50,
  "total_comision_anticuario": 4520.05,
  "total_neto_cafeteria": 40680.45,
  "cantidad_pedidos": 310,
  "desglose_pedidos": [
    {
      "id": 12,
      "nombre_cliente": "Sofía Mendoza",
      "origen": "anticuario",
      "total_calculado": "112.00",
      "estado": "completado",
      "fecha_creacion": "2026-10-19T14:55:00.000Z",
      "detalles": [...],
      "comision": {
        "porcentaje_aplicado": "10.00",
        "monto_comision": "11.20"
      }
    }
  ]
}
```

---

## 🛡️ Despliegue en Producción (Render / Railway / Vercel Serverless)

1. En el panel de tu hosting (Render / Railway), agrega las variables de entorno (`DATABASE_URL`, `ADMIN_API_KEY`, `ALLOWED_ORIGINS`, `PORT`).
2. Configura los comandos de build y start:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
3. En la primera ejecución, ejecuta la semilla para cargar el catálogo inicial:
   ```bash
   npm run prisma:seed
   ```
