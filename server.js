// Novaterra API — prototipo de backend (sin dependencias, solo Node puro)
// Guarda negocios, clientes y suscripciones en un archivo JSON.
// Arranca con:  node server.js   (puerto 3000 por defecto, o PORT)
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// ---------- Base de datos (JSON en archivo) ----------
function dbVacia() { return { usuarios: [], negocios: [], clientes: [], suscripciones: [], tokens: {} }; }
function cargarDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e) { return dbVacia(); }
}
function guardarDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
let DB = cargarDB();
function salvar() { guardarDB(DB); }
const id = (p) => p + crypto.randomBytes(6).toString('hex');

// ---------- Seguridad ----------
function hashPwd(pwd, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pwd, salt, 32).toString('hex');
  return { salt, hash: h };
}
function verifPwd(pwd, salt, hash) {
  const h = crypto.scryptSync(pwd, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}

// ---------- Códigos de plan (misma fórmula que la app) ----------
function codigoChk(d) { return (d[0] * 2 + d[1] * 3 + d[2] * 4 + d[3] * 5) % 10 === d[4]; }
function codigoNivel(c) {
  c = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const tabla = [['NOVAE', 'empresa'], ['NOVAM', 'promax'], ['NOVAB', 'basico'], ['NOVA', 'pro']];
  for (const [pre, plan] of tabla) {
    const m = new RegExp('^' + pre + '(\\d)(\\d)(\\d)(\\d)(\\d)$').exec(c);
    if (m) { const d = m.slice(1).map(Number); if (codigoChk(d)) return plan; }
  }
  return '';
}
const PLAN_DIAS = 30;

// ---------- Utilidades HTTP ----------
function enviar(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(body);
}
function leerBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
  });
}
function usuarioDe(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const uid = DB.tokens[token];
  return uid ? DB.usuarios.find((u) => u.id === uid) : null;
}
function suscDe(uid) {
  const s = DB.suscripciones.find((x) => x.usuarioId === uid);
  if (!s) return { plan: 'free', vence: null, dias: 0 };
  const dias = Math.max(0, Math.ceil((new Date(s.vence).getTime() - Date.now()) / 86400000));
  return { plan: dias > 0 ? s.plan : 'free', planCodigo: s.plan, vence: s.vence, dias };
}
function publicoUsuario(u) { return { id: u.id, email: u.email, nombre: u.nombre, creado: u.creado }; }

// ---------- Rutas ----------
async function router(req, res) {
  const url = new URL(req.url, 'http://x');
  const ruta = url.pathname;
  const metodo = req.method;
  if (metodo === 'OPTIONS') return enviar(res, 204, {});

  // Salud
  if (ruta === '/' || ruta === '/api/salud') {
    return enviar(res, 200, { ok: true, servicio: 'Novaterra API', version: '0.1', usuarios: DB.usuarios.length });
  }

  // Registro
  if (ruta === '/api/registro' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    if (!email || !b.password) return enviar(res, 400, { error: 'Falta email o contraseña.' });
    if (DB.usuarios.find((u) => u.email === email)) return enviar(res, 409, { error: 'Ese correo ya está registrado.' });
    const { salt, hash } = hashPwd(b.password);
    const u = { id: id('u_'), email, nombre: b.nombre || '', salt, hash, creado: new Date().toISOString() };
    DB.usuarios.push(u);
    const token = crypto.randomBytes(24).toString('hex');
    DB.tokens[token] = u.id;
    salvar();
    return enviar(res, 201, { token, usuario: publicoUsuario(u) });
  }

  // Login
  if (ruta === '/api/login' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const u = DB.usuarios.find((x) => x.email === email);
    if (!u || !verifPwd(String(b.password || ''), u.salt, u.hash)) return enviar(res, 401, { error: 'Correo o contraseña incorrectos.' });
    const token = crypto.randomBytes(24).toString('hex');
    DB.tokens[token] = u.id;
    salvar();
    return enviar(res, 200, { token, usuario: publicoUsuario(u) });
  }

  // --- De aquí en adelante requiere sesión ---
  const u = usuarioDe(req);
  if (ruta.startsWith('/api/') && !u) return enviar(res, 401, { error: 'Inicia sesión.' });

  // Yo (perfil + suscripción)
  if (ruta === '/api/yo' && metodo === 'GET') {
    return enviar(res, 200, { usuario: publicoUsuario(u), suscripcion: suscDe(u.id) });
  }

  // Negocios
  if (ruta === '/api/negocios' && metodo === 'GET') {
    return enviar(res, 200, { negocios: DB.negocios.filter((n) => n.usuarioId === u.id) });
  }
  if (ruta === '/api/negocios' && metodo === 'POST') {
    const b = await leerBody(req);
    if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del negocio.' });
    const n = { id: id('n_'), usuarioId: u.id, nombre: b.nombre, tipo: b.tipo || 'general', frase: b.frase || '', creado: new Date().toISOString() };
    DB.negocios.push(n); salvar();
    return enviar(res, 201, { negocio: n });
  }

  // Clientes de un negocio:  /api/negocios/:id/clientes
  const mCli = /^\/api\/negocios\/([^/]+)\/clientes$/.exec(ruta);
  if (mCli) {
    const negId = mCli[1];
    const neg = DB.negocios.find((n) => n.id === negId && n.usuarioId === u.id);
    if (!neg) return enviar(res, 404, { error: 'Negocio no encontrado.' });
    if (metodo === 'GET') return enviar(res, 200, { clientes: DB.clientes.filter((c) => c.negocioId === negId) });
    if (metodo === 'POST') {
      const b = await leerBody(req);
      if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del cliente.' });
      const c = { id: id('c_'), negocioId: negId, nombre: b.nombre, total: b.total || 0, abonos: b.abonos || [], creado: new Date().toISOString() };
      DB.clientes.push(c); salvar();
      return enviar(res, 201, { cliente: c });
    }
  }

  // Activar código de plan (validación CENTRAL)
  if (ruta === '/api/suscripcion/activar' && metodo === 'POST') {
    const b = await leerBody(req);
    const plan = codigoNivel(b.codigo);
    if (!plan) return enviar(res, 400, { error: 'Ese código no es válido.' });
    const desde = new Date();
    const vence = new Date(desde.getTime() + PLAN_DIAS * 86400000);
    let s = DB.suscripciones.find((x) => x.usuarioId === u.id);
    if (!s) { s = { usuarioId: u.id }; DB.suscripciones.push(s); }
    s.plan = plan; s.desde = desde.toISOString(); s.vence = vence.toISOString(); s.codigo = String(b.codigo).toUpperCase();
    salvar();
    return enviar(res, 200, { ok: true, suscripcion: suscDe(u.id) });
  }

  return enviar(res, 404, { error: 'Ruta no encontrada.' });
}

http.createServer((req, res) => {
  router(req, res).catch((e) => enviar(res, 500, { error: 'Error interno', detalle: String(e) }));
}).listen(PORT, () => console.log('Novaterra API escuchando en http://localhost:' + PORT));
