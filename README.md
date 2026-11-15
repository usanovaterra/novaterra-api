# Novaterra API — prototipo de backend

Este es el **cerebro en la nube** de Novaterra: una base de datos central + una API
para que la app deje de guardar solo en el celular y pase a ser una **plataforma**
(cuentas, sincronización entre dispositivos, suscripciones y, más adelante, el
conector tipo Shopify/Dropi).

Está hecho **sin dependencias** (solo Node puro), así que corre en cualquier lado
y es muy fácil de desplegar.

---

## 1. Probarlo en tu computador

Necesitas Node 18 o superior.

```bash
cd novaterra-api
node server.js
```

Verás: `Novaterra API escuchando en http://localhost:3000`

Pruébalo en otra terminal:

```bash
curl http://localhost:3000/api/salud
```

Los datos se guardan en `data/db.json` (se crea solo). Para empezar de cero,
borra esa carpeta.

---

## 2. Qué puede hacer hoy (endpoints)

| Método | Ruta | Para qué | ¿Pide sesión? |
|--------|------|----------|----------------|
| GET | `/api/salud` | Ver que está vivo | No |
| POST | `/api/registro` | Crear cuenta `{email, password, nombre}` → devuelve `token` | No |
| POST | `/api/login` | Entrar `{email, password}` → devuelve `token` | No |
| GET | `/api/yo` | Perfil + suscripción (plan y días que faltan) | Sí |
| GET | `/api/negocios` | Lista tus negocios | Sí |
| POST | `/api/negocios` | Crear negocio `{nombre, tipo, frase}` | Sí |
| GET | `/api/negocios/:id/clientes` | Clientes de un negocio | Sí |
| POST | `/api/negocios/:id/clientes` | Agregar cliente `{nombre, total}` | Sí |
| POST | `/api/suscripcion/activar` | **Activar código** `{codigo}` → da el plan 30 días | Sí |

La **sesión** se manda en cada llamada con el encabezado:
`Authorization: Bearer <token>`

### Lo más importante: activación central de códigos

`POST /api/suscripcion/activar` valida el código **en el servidor** (misma fórmula
que la app: prefijos `NOVAB`/`NOVA`/`NOVAM`/`NOVAE` + dígito de control) y le pone
al usuario el plan por 30 días. Esto es lo que hace que el cobro sea "de verdad":
el plan vive en la nube, no solo en el celular.

---

## 3. Desplegarlo (dejarlo prendido 24/7)

Cualquiera de estos sirve y tienen plan gratis para empezar:

### Opción A — Render (recomendado, muy simple)
1. Sube esta carpeta a un repositorio de GitHub.
2. En [render.com](https://render.com) → New → **Web Service** → conecta el repo.
3. Build Command: *(vacío)* · Start Command: `node server.js`
4. Render te da una URL pública tipo `https://novaterra-api.onrender.com`.

### Opción B — Railway
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Start Command: `node server.js`. Railway detecta el puerto por la variable `PORT`.

> Importante: estos servicios usan disco temporal. Para un `db.json` que no se
> borre, el siguiente paso es cambiar el guardado por una base real
> (**Postgres** o **Supabase**) — te lo armo cuando quieras. Por ahora, para
> prototipo, el archivo sirve.

---

## 4. Cómo se conecta con la app Novaterra

Hoy la app guarda en `localStorage`. El cambio es que, cuando el usuario tenga
sesión, la app llame a esta API en vez de (o además de) guardar local:

- Al entrar → `POST /api/login` y guarda el `token`.
- Al abrir → `GET /api/yo` para saber su plan real (y si venció).
- Al crear negocios/clientes → los `POST` de arriba.
- Al activar código → `POST /api/suscripcion/activar` (ya no local).

Lo hacemos por pasos para no romper lo que ya funciona.

---

## 5. Lo que sigue (hoja de ruta del backend)

1. ✅ **Prototipo** (esto): cuentas, negocios, clientes, códigos centrales.
2. **Base de datos real** (Postgres/Supabase) para que los datos no se borren.
3. **Conectar la app** a la API (login + sincronización).
4. **Pasarela de pagos** (MercadoPago/Wompi) → al pagar, el servidor activa el plan solo.
5. **Conector MCP** encima de la API → para conectar Novaterra con un asistente
   como Claude (ver ventas, activar planes, sacar reportes desde un chat), igual
   que Shopify o Dropi.

> Nota de seguridad: este prototipo es para pruebas. Antes de usarlo con clientes
> reales hay que agregar HTTPS (lo da el hosting), límites de intentos de login y
> mover los datos a una base real. Está anotado en el paso 2.
