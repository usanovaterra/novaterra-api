// Novaterra API — backend (sin dependencias, solo Node puro)
// Guarda en Supabase (si hay credenciales) o en un archivo JSON (si no).
// Arranca con:  node server.js
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ---------- ¿Supabase o archivo? ----------
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';
const USA_SB = !!(SB_URL && SB_KEY);
// Clave del panel de administrador (solo el dueño). Se pone como variable ADMIN_KEY en Render.
const ADMIN_KEY = process.env.ADMIN_KEY || '';
console.log(USA_SB ? 'Guardando en Supabase (nube permanente).' : 'Guardando en archivo local (prototipo).');

// ---------- Llamada a Supabase (REST, con fetch nativo de Node 18+) ----------
async function sb(metodo, consulta, cuerpo, prefer) {
  const res = await fetch(SB_URL + '/rest/v1/' + consulta, {
    method: metodo,
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation'
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + txt);
  return data;
}

// ---------- Archivo (modo prototipo) ----------
const DB_FILE = path.join(__dirname, 'data', 'db.json');
function cargarArchivo() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return { usuarios: [], negocios: [], clientes: [], suscripciones: [], respaldos: [] }; } }
function guardarArchivo(db) { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
let FILE = USA_SB ? null : cargarArchivo();
function salvarArchivo() { if (!USA_SB) guardarArchivo(FILE); }

// ---------- Capa de datos (misma interfaz, use Supabase o archivo) ----------
const datos = {
  async usuarioPorEmail(email) {
    if (USA_SB) { const r = await sb('GET', 'usuarios?email=eq.' + encodeURIComponent(email) + '&select=*'); return r[0] || null; }
    return FILE.usuarios.find(u => u.email === email) || null;
  },
  async usuarioPorId(id) {
    if (USA_SB) { const r = await sb('GET', 'usuarios?id=eq.' + encodeURIComponent(id) + '&select=*'); return r[0] || null; }
    return FILE.usuarios.find(u => u.id === id) || null;
  },
  async crearUsuario(u) {
    if (USA_SB) { const r = await sb('POST', 'usuarios', u); return r[0]; }
    FILE.usuarios.push(u); salvarArchivo(); return u;
  },
  async negociosDe(uid) {
    if (USA_SB) return await sb('GET', 'negocios?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*&order=creado.asc');
    return FILE.negocios.filter(n => n.usuario_id === uid);
  },
  async negocioPorId(id, uid) {
    if (USA_SB) { const r = await sb('GET', 'negocios?id=eq.' + encodeURIComponent(id) + '&usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return FILE.negocios.find(n => n.id === id && n.usuario_id === uid) || null;
  },
  async crearNegocio(n) {
    if (USA_SB) { const r = await sb('POST', 'negocios', n); return r[0]; }
    FILE.negocios.push(n); salvarArchivo(); return n;
  },
  async clientesDe(negId) {
    if (USA_SB) return await sb('GET', 'clientes?negocio_id=eq.' + encodeURIComponent(negId) + '&select=*&order=creado.asc');
    return FILE.clientes.filter(c => c.negocio_id === negId);
  },
  async crearCliente(c) {
    if (USA_SB) { const r = await sb('POST', 'clientes', c); return r[0]; }
    FILE.clientes.push(c); salvarArchivo(); return c;
  },
  async suscripcionDe(uid) {
    if (USA_SB) { const r = await sb('GET', 'suscripciones?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return FILE.suscripciones.find(s => s.usuario_id === uid) || null;
  },
  async guardarSuscripcion(s) {
    if (USA_SB) { const r = await sb('POST', 'suscripciones', s, 'resolution=merge-duplicates,return=representation'); return r[0]; }
    let x = FILE.suscripciones.find(y => y.usuario_id === s.usuario_id);
    if (!x) { FILE.suscripciones.push(s); } else { Object.assign(x, s); }
    salvarArchivo(); return s;
  },
  async respaldoDe(uid) {
    if (USA_SB) { const r = await sb('GET', 'respaldos?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return (FILE.respaldos || []).find(x => x.usuario_id === uid) || null;
  },
  async guardarRespaldo(uid, datosBlob) {
    const row = { usuario_id: uid, datos: datosBlob, fecha: new Date().toISOString() };
    if (USA_SB) { const r = await sb('POST', 'respaldos', row, 'resolution=merge-duplicates,return=representation'); return r[0]; }
    if (!FILE.respaldos) FILE.respaldos = [];
    let x = FILE.respaldos.find(y => y.usuario_id === uid);
    if (!x) { FILE.respaldos.push(row); } else { Object.assign(x, row); }
    salvarArchivo(); return row;
  },
  async todosUsuarios() {
    if (USA_SB) return await sb('GET', 'usuarios?select=id,email,nombre,creado&order=creado.desc');
    return (FILE.usuarios || []).map(u => ({ id: u.id, email: u.email, nombre: u.nombre, creado: u.creado })).sort((a, b) => (a.creado < b.creado ? 1 : -1));
  },
  async todasSuscripciones() {
    if (USA_SB) return await sb('GET', 'suscripciones?select=*');
    return FILE.suscripciones || [];
  },
  async todosNegocios() {
    if (USA_SB) return await sb('GET', 'negocios?select=usuario_id');
    return (FILE.negocios || []).map(n => ({ usuario_id: n.usuario_id }));
  }
};

// ---------- Tokens de sesión (firmados: sobreviven reinicios) ----------
// Secreto estable entre reinicios: TOKEN_SECRET si existe, si no la llave de Supabase
// (ya es un valor secreto y fijo), y como último recurso uno de desarrollo.
const TOKEN_SECRET = process.env.TOKEN_SECRET || SB_KEY || 'novaterra-dev-secret-cambiar';
const TOKEN_DIAS = 60;
function firmarToken(uid) {
  const exp = Date.now() + TOKEN_DIAS * 86400000;
  const payload = Buffer.from(uid + '|' + exp).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verificarToken(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const i = tok.indexOf('.'), payload = tok.slice(0, i), sig = tok.slice(i + 1);
  if (!payload || !sig) return null;
  const esper = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== esper.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esper))) return null;
  let dec; try { dec = Buffer.from(payload, 'base64url').toString(); } catch (e) { return null; }
  const j = dec.lastIndexOf('|'); if (j < 0) return null;
  const uid = dec.slice(0, j), exp = +dec.slice(j + 1);
  if (!exp || Date.now() > exp) return null;
  return uid;
}
const TOKENS = {}; // compatibilidad con sesiones viejas (en memoria)
const id = (p) => p + crypto.randomBytes(6).toString('hex');

// ---------- Límite de intentos de login (anti fuerza bruta) ----------
const INTENTOS = {}; // email -> { n, hasta }
const MAX_INTENTOS = 5, BLOQUEO_MS = 15 * 60 * 1000;
function loginBloqueado(email) { const r = INTENTOS[email]; return !!(r && r.hasta > Date.now()); }
function loginFallo(email) { const r = INTENTOS[email] || { n: 0, hasta: 0 }; r.n++; if (r.n >= MAX_INTENTOS) { r.hasta = Date.now() + BLOQUEO_MS; r.n = 0; } INTENTOS[email] = r; }
function loginOk(email) { delete INTENTOS[email]; }
function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }

// ---------- Seguridad ----------
function hashPwd(pwd, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(pwd, salt, 32).toString('hex') }; }
function verifPwd(pwd, salt, hash) { const h = crypto.scryptSync(pwd, salt, 32).toString('hex'); return h.length === hash.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash)); }

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

// ---------- HTTP ----------
function enviar(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  res.end(JSON.stringify(obj));
}
function leerBody(req) { return new Promise((resolve) => { let d = ''; req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } }); }); }
async function usuarioDe(req) { const t = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim(); const uid = verificarToken(t) || TOKENS[t]; return uid ? await datos.usuarioPorId(uid) : null; }
function pub(u) { return { id: u.id, email: u.email, nombre: u.nombre, creado: u.creado }; }
function susInfo(s) {
  if (!s) return { plan: 'free', vence: null, dias: 0 };
  const dias = Math.max(0, Math.ceil((new Date(s.vence).getTime() - Date.now()) / 86400000));
  return { plan: dias > 0 ? s.plan : 'free', planCodigo: s.plan, vence: s.vence, dias };
}

async function router(req, res) {
  const url = new URL(req.url, 'http://x');
  const ruta = url.pathname, metodo = req.method;
  if (metodo === 'OPTIONS') return enviar(res, 204, {});

  if (ruta === '/' || ruta === '/api/salud') {
    let n = null; try { if (!USA_SB) n = FILE.usuarios.length; } catch (e) {}
    return enviar(res, 200, { ok: true, servicio: 'Novaterra API', version: '0.5', almacen: USA_SB ? 'supabase' : 'archivo', usuarios: n });
  }

  if (ruta === '/api/registro' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const pass = String(b.password || '');
    if (!email || !pass) return enviar(res, 400, { error: 'Falta email o contraseña.' });
    if (!emailValido(email)) return enviar(res, 400, { error: 'El correo no es válido.' });
    if (pass.length < 6) return enviar(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres.' });
    if (await datos.usuarioPorEmail(email)) return enviar(res, 409, { error: 'Ese correo ya está registrado.' });
    const { salt, hash } = hashPwd(pass);
    const u = await datos.crearUsuario({ id: id('u_'), email, nombre: String(b.nombre || '').trim().slice(0, 80), salt, hash, creado: new Date().toISOString() });
    return enviar(res, 201, { token: firmarToken(u.id), usuario: pub(u) });
  }

  if (ruta === '/api/login' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    if (loginBloqueado(email)) return enviar(res, 429, { error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' });
    const u = await datos.usuarioPorEmail(email);
    if (!u || !verifPwd(String(b.password || ''), u.salt, u.hash)) { loginFallo(email); return enviar(res, 401, { error: 'Correo o contraseña incorrectos.' }); }
    loginOk(email);
    return enviar(res, 200, { token: firmarToken(u.id), usuario: pub(u) });
  }

  // ---------- Panel de administrador (solo el dueño, con ADMIN_KEY) ----------
  if (ruta === '/api/admin/usuarios' && metodo === 'GET') {
    if (!ADMIN_KEY) return enviar(res, 503, { error: 'El panel de administrador no está configurado. Agrega la variable ADMIN_KEY en Render.' });
    if ((req.headers['x-admin-key'] || '') !== ADMIN_KEY) return enviar(res, 401, { error: 'Clave de administrador incorrecta.' });
    const [us, subs, negs] = await Promise.all([datos.todosUsuarios(), datos.todasSuscripciones(), datos.todosNegocios()]);
    const subBy = {}; subs.forEach(s => { subBy[s.usuario_id] = s; });
    const negCount = {}; negs.forEach(n => { negCount[n.usuario_id] = (negCount[n.usuario_id] || 0) + 1; });
    const ahora = Date.now();
    const lista = us.map(x => {
      const s = subBy[x.id]; let plan = 'free', vence = null, dias = null;
      if (s && s.vence) { vence = s.vence; dias = Math.ceil((new Date(s.vence).getTime() - ahora) / 86400000); plan = dias > 0 ? (s.plan || 'free') : 'vencido'; }
      return { email: x.email, nombre: x.nombre, creado: x.creado, plan, vence, dias, negocios: negCount[x.id] || 0 };
    });
    const porPlan = {}; lista.forEach(x => { porPlan[x.plan] = (porPlan[x.plan] || 0) + 1; });
    const porVencer = lista.filter(x => x.dias != null && x.dias > 0 && x.dias <= 7).length;
    return enviar(res, 200, { total: lista.length, porPlan, porVencer, usuarios: lista });
  }

  const u = await usuarioDe(req);
  if (ruta.startsWith('/api/') && !u) return enviar(res, 401, { error: 'Inicia sesión.' });

  if (ruta === '/api/yo' && metodo === 'GET') return enviar(res, 200, { usuario: pub(u), suscripcion: susInfo(await datos.suscripcionDe(u.id)) });

  if (ruta === '/api/negocios' && metodo === 'GET') return enviar(res, 200, { negocios: await datos.negociosDe(u.id) });
  if (ruta === '/api/negocios' && metodo === 'POST') {
    const b = await leerBody(req);
    if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del negocio.' });
    const n = await datos.crearNegocio({ id: id('n_'), usuario_id: u.id, nombre: b.nombre, tipo: b.tipo || 'general', frase: b.frase || '', creado: new Date().toISOString() });
    return enviar(res, 201, { negocio: n });
  }

  const mCli = /^\/api\/negocios\/([^/]+)\/clientes$/.exec(ruta);
  if (mCli) {
    const neg = await datos.negocioPorId(mCli[1], u.id);
    if (!neg) return enviar(res, 404, { error: 'Negocio no encontrado.' });
    if (metodo === 'GET') return enviar(res, 200, { clientes: await datos.clientesDe(neg.id) });
    if (metodo === 'POST') {
      const b = await leerBody(req);
      if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del cliente.' });
      const c = await datos.crearCliente({ id: id('c_'), negocio_id: neg.id, nombre: b.nombre, total: b.total || 0, abonos: b.abonos || [], creado: new Date().toISOString() });
      return enviar(res, 201, { cliente: c });
    }
  }

  if (ruta === '/api/suscripcion/activar' && metodo === 'POST') {
    const b = await leerBody(req);
    const plan = codigoNivel(b.codigo);
    if (!plan) return enviar(res, 400, { error: 'Ese código no es válido.' });
    const desde = new Date(), vence = new Date(desde.getTime() + PLAN_DIAS * 86400000);
    await datos.guardarSuscripcion({ usuario_id: u.id, plan, codigo: String(b.codigo).toUpperCase(), desde: desde.toISOString(), vence: vence.toISOString() });
    return enviar(res, 200, { ok: true, suscripcion: susInfo(await datos.suscripcionDe(u.id)) });
  }

  // Respaldo en la nube (copia completa de los datos del usuario)
  if (ruta === '/api/respaldo' && metodo === 'POST') {
    const b = await leerBody(req);
    if (b.datos === undefined || b.datos === null) return enviar(res, 400, { error: 'Falta la copia a guardar.' });
    const r = await datos.guardarRespaldo(u.id, b.datos);
    return enviar(res, 200, { ok: true, fecha: r.fecha });
  }
  if (ruta === '/api/respaldo' && metodo === 'GET') {
    const r = await datos.respaldoDe(u.id);
    return enviar(res, 200, { datos: r ? r.datos : null, fecha: r ? r.fecha : null });
  }

  return enviar(res, 404, { error: 'Ruta no encontrada.' });
}

http.createServer((req, res) => { router(req, res).catch(e => enviar(res, 500, { error: 'Error interno', detalle: String(e.message || e) })); }).listen(PORT, () => console.log('Novaterra API en http://localhost:' + PORT));// Novaterra API — backend (sin dependencias, solo Node puro)
// Guarda en Supabase (si hay credenciales) o en un archivo JSON (si no).
// Arranca con:  node server.js
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ---------- ¿Supabase o archivo? ----------
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';
const USA_SB = !!(SB_URL && SB_KEY);
console.log(USA_SB ? 'Guardando en Supabase (nube permanente).' : 'Guardando en archivo local (prototipo).');

// ---------- Llamada a Supabase (REST, con fetch nativo de Node 18+) ----------
async function sb(metodo, consulta, cuerpo, prefer) {
  const res = await fetch(SB_URL + '/rest/v1/' + consulta, {
    method: metodo,
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation'
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + txt);
  return data;
}

// ---------- Archivo (modo prototipo) ----------
const DB_FILE = path.join(__dirname, 'data', 'db.json');
function cargarArchivo() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return { usuarios: [], negocios: [], clientes: [], suscripciones: [], respaldos: [] }; } }
function guardarArchivo(db) { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
let FILE = USA_SB ? null : cargarArchivo();
function salvarArchivo() { if (!USA_SB) guardarArchivo(FILE); }

// ---------- Capa de datos (misma interfaz, use Supabase o archivo) ----------
const datos = {
  async usuarioPorEmail(email) {
    if (USA_SB) { const r = await sb('GET', 'usuarios?email=eq.' + encodeURIComponent(email) + '&select=*'); return r[0] || null; }
    return FILE.usuarios.find(u => u.email === email) || null;
  },
  async usuarioPorId(id) {
    if (USA_SB) { const r = await sb('GET', 'usuarios?id=eq.' + encodeURIComponent(id) + '&select=*'); return r[0] || null; }
    return FILE.usuarios.find(u => u.id === id) || null;
  },
  async crearUsuario(u) {
    if (USA_SB) { const r = await sb('POST', 'usuarios', u); return r[0]; }
    FILE.usuarios.push(u); salvarArchivo(); return u;
  },
  async negociosDe(uid) {
    if (USA_SB) return await sb('GET', 'negocios?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*&order=creado.asc');
    return FILE.negocios.filter(n => n.usuario_id === uid);
  },
  async negocioPorId(id, uid) {
    if (USA_SB) { const r = await sb('GET', 'negocios?id=eq.' + encodeURIComponent(id) + '&usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return FILE.negocios.find(n => n.id === id && n.usuario_id === uid) || null;
  },
  async crearNegocio(n) {
    if (USA_SB) { const r = await sb('POST', 'negocios', n); return r[0]; }
    FILE.negocios.push(n); salvarArchivo(); return n;
  },
  async clientesDe(negId) {
    if (USA_SB) return await sb('GET', 'clientes?negocio_id=eq.' + encodeURIComponent(negId) + '&select=*&order=creado.asc');
    return FILE.clientes.filter(c => c.negocio_id === negId);
  },
  async crearCliente(c) {
    if (USA_SB) { const r = await sb('POST', 'clientes', c); return r[0]; }
    FILE.clientes.push(c); salvarArchivo(); return c;
  },
  async suscripcionDe(uid) {
    if (USA_SB) { const r = await sb('GET', 'suscripciones?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return FILE.suscripciones.find(s => s.usuario_id === uid) || null;
  },
  async guardarSuscripcion(s) {
    if (USA_SB) { const r = await sb('POST', 'suscripciones', s, 'resolution=merge-duplicates,return=representation'); return r[0]; }
    let x = FILE.suscripciones.find(y => y.usuario_id === s.usuario_id);
    if (!x) { FILE.suscripciones.push(s); } else { Object.assign(x, s); }
    salvarArchivo(); return s;
  },
  async respaldoDe(uid) {
    if (USA_SB) { const r = await sb('GET', 'respaldos?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*'); return r[0] || null; }
    return (FILE.respaldos || []).find(x => x.usuario_id === uid) || null;
  },
  async guardarRespaldo(uid, datosBlob) {
    const row = { usuario_id: uid, datos: datosBlob, fecha: new Date().toISOString() };
    if (USA_SB) { const r = await sb('POST', 'respaldos', row, 'resolution=merge-duplicates,return=representation'); return r[0]; }
    if (!FILE.respaldos) FILE.respaldos = [];
    let x = FILE.respaldos.find(y => y.usuario_id === uid);
    if (!x) { FILE.respaldos.push(row); } else { Object.assign(x, row); }
    salvarArchivo(); return row;
  }
};

// ---------- Tokens de sesión (firmados: sobreviven reinicios) ----------
// Secreto estable entre reinicios: TOKEN_SECRET si existe, si no la llave de Supabase
// (ya es un valor secreto y fijo), y como último recurso uno de desarrollo.
const TOKEN_SECRET = process.env.TOKEN_SECRET || SB_KEY || 'novaterra-dev-secret-cambiar';
const TOKEN_DIAS = 60;
function firmarToken(uid) {
  const exp = Date.now() + TOKEN_DIAS * 86400000;
  const payload = Buffer.from(uid + '|' + exp).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verificarToken(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const i = tok.indexOf('.'), payload = tok.slice(0, i), sig = tok.slice(i + 1);
  if (!payload || !sig) return null;
  const esper = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== esper.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esper))) return null;
  let dec; try { dec = Buffer.from(payload, 'base64url').toString(); } catch (e) { return null; }
  const j = dec.lastIndexOf('|'); if (j < 0) return null;
  const uid = dec.slice(0, j), exp = +dec.slice(j + 1);
  if (!exp || Date.now() > exp) return null;
  return uid;
}
const TOKENS = {}; // compatibilidad con sesiones viejas (en memoria)
const id = (p) => p + crypto.randomBytes(6).toString('hex');

// ---------- Límite de intentos de login (anti fuerza bruta) ----------
const INTENTOS = {}; // email -> { n, hasta }
const MAX_INTENTOS = 5, BLOQUEO_MS = 15 * 60 * 1000;
function loginBloqueado(email) { const r = INTENTOS[email]; return !!(r && r.hasta > Date.now()); }
function loginFallo(email) { const r = INTENTOS[email] || { n: 0, hasta: 0 }; r.n++; if (r.n >= MAX_INTENTOS) { r.hasta = Date.now() + BLOQUEO_MS; r.n = 0; } INTENTOS[email] = r; }
function loginOk(email) { delete INTENTOS[email]; }
function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }

// ---------- Seguridad ----------
function hashPwd(pwd, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(pwd, salt, 32).toString('hex') }; }
function verifPwd(pwd, salt, hash) { const h = crypto.scryptSync(pwd, salt, 32).toString('hex'); return h.length === hash.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash)); }

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

// ---------- HTTP ----------
function enviar(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  res.end(JSON.stringify(obj));
}
function leerBody(req) { return new Promise((resolve) => { let d = ''; req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } }); }); }
async function usuarioDe(req) { const t = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim(); const uid = verificarToken(t) || TOKENS[t]; return uid ? await datos.usuarioPorId(uid) : null; }
function pub(u) { return { id: u.id, email: u.email, nombre: u.nombre, creado: u.creado }; }
function susInfo(s) {
  if (!s) return { plan: 'free', vence: null, dias: 0 };
  const dias = Math.max(0, Math.ceil((new Date(s.vence).getTime() - Date.now()) / 86400000));
  return { plan: dias > 0 ? s.plan : 'free', planCodigo: s.plan, vence: s.vence, dias };
}

async function router(req, res) {
  const url = new URL(req.url, 'http://x');
  const ruta = url.pathname, metodo = req.method;
  if (metodo === 'OPTIONS') return enviar(res, 204, {});

  if (ruta === '/' || ruta === '/api/salud') {
    let n = null; try { if (!USA_SB) n = FILE.usuarios.length; } catch (e) {}
    return enviar(res, 200, { ok: true, servicio: 'Novaterra API', version: '0.4', almacen: USA_SB ? 'supabase' : 'archivo', usuarios: n });
  }

  if (ruta === '/api/registro' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const pass = String(b.password || '');
    if (!email || !pass) return enviar(res, 400, { error: 'Falta email o contraseña.' });
    if (!emailValido(email)) return enviar(res, 400, { error: 'El correo no es válido.' });
    if (pass.length < 6) return enviar(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres.' });
    if (await datos.usuarioPorEmail(email)) return enviar(res, 409, { error: 'Ese correo ya está registrado.' });
    const { salt, hash } = hashPwd(pass);
    const u = await datos.crearUsuario({ id: id('u_'), email, nombre: String(b.nombre || '').trim().slice(0, 80), salt, hash, creado: new Date().toISOString() });
    return enviar(res, 201, { token: firmarToken(u.id), usuario: pub(u) });
  }

  if (ruta === '/api/login' && metodo === 'POST') {
    const b = await leerBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    if (loginBloqueado(email)) return enviar(res, 429, { error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' });
    const u = await datos.usuarioPorEmail(email);
    if (!u || !verifPwd(String(b.password || ''), u.salt, u.hash)) { loginFallo(email); return enviar(res, 401, { error: 'Correo o contraseña incorrectos.' }); }
    loginOk(email);
    return enviar(res, 200, { token: firmarToken(u.id), usuario: pub(u) });
  }

  const u = await usuarioDe(req);
  if (ruta.startsWith('/api/') && !u) return enviar(res, 401, { error: 'Inicia sesión.' });

  if (ruta === '/api/yo' && metodo === 'GET') return enviar(res, 200, { usuario: pub(u), suscripcion: susInfo(await datos.suscripcionDe(u.id)) });

  if (ruta === '/api/negocios' && metodo === 'GET') return enviar(res, 200, { negocios: await datos.negociosDe(u.id) });
  if (ruta === '/api/negocios' && metodo === 'POST') {
    const b = await leerBody(req);
    if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del negocio.' });
    const n = await datos.crearNegocio({ id: id('n_'), usuario_id: u.id, nombre: b.nombre, tipo: b.tipo || 'general', frase: b.frase || '', creado: new Date().toISOString() });
    return enviar(res, 201, { negocio: n });
  }

  const mCli = /^\/api\/negocios\/([^/]+)\/clientes$/.exec(ruta);
  if (mCli) {
    const neg = await datos.negocioPorId(mCli[1], u.id);
    if (!neg) return enviar(res, 404, { error: 'Negocio no encontrado.' });
    if (metodo === 'GET') return enviar(res, 200, { clientes: await datos.clientesDe(neg.id) });
    if (metodo === 'POST') {
      const b = await leerBody(req);
      if (!b.nombre) return enviar(res, 400, { error: 'Falta el nombre del cliente.' });
      const c = await datos.crearCliente({ id: id('c_'), negocio_id: neg.id, nombre: b.nombre, total: b.total || 0, abonos: b.abonos || [], creado: new Date().toISOString() });
      return enviar(res, 201, { cliente: c });
    }
  }

  if (ruta === '/api/suscripcion/activar' && metodo === 'POST') {
    const b = await leerBody(req);
    const plan = codigoNivel(b.codigo);
    if (!plan) return enviar(res, 400, { error: 'Ese código no es válido.' });
    const desde = new Date(), vence = new Date(desde.getTime() + PLAN_DIAS * 86400000);
    await datos.guardarSuscripcion({ usuario_id: u.id, plan, codigo: String(b.codigo).toUpperCase(), desde: desde.toISOString(), vence: vence.toISOString() });
    return enviar(res, 200, { ok: true, suscripcion: susInfo(await datos.suscripcionDe(u.id)) });
  }

  // Respaldo en la nube (copia completa de los datos del usuario)
  if (ruta === '/api/respaldo' && metodo === 'POST') {
    const b = await leerBody(req);
    if (b.datos === undefined || b.datos === null) return enviar(res, 400, { error: 'Falta la copia a guardar.' });
    const r = await datos.guardarRespaldo(u.id, b.datos);
    return enviar(res, 200, { ok: true, fecha: r.fecha });
  }
  if (ruta === '/api/respaldo' && metodo === 'GET') {
    const r = await datos.respaldoDe(u.id);
    return enviar(res, 200, { datos: r ? r.datos : null, fecha: r ? r.fecha : null });
  }

  return enviar(res, 404, { error: 'Ruta no encontrada.' });
}

http.createServer((req, res) => { router(req, res).catch(e => enviar(res, 500, { error: 'Error interno', detalle: String(e.message || e) })); }).listen(PORT, () => console.log('Novaterra API en http://localhost:' + PORT));
