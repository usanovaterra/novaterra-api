// Novaterra API — backend (sin dependencias, solo Node puro)
// Guarda en Supabase (si hay credenciales) o en un archivo JSON (si no).
// Arranca con:  node server.js
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ---------- Panel de administrador servido como pagina web (para verlo en el celular) ----------
const PANEL_HTML = "<!doctype html>\n<html lang=\"es\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Panel Novaterra</title>\n<style>\n@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');\n:root{--bg:#eef4f0;--surface:#fff;--fg:#13241d;--muted:#5d7268;--line:#d7e4dc;--acc:#1f8d63;--acc2:#0f4a38;--ok:#1b9a4b;--warn:#d98a1f;--err:#d6336c;--chip:#e7f1ea}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){--bg:#0e1714;--surface:#16211c;--fg:#eaf3ee;--muted:#9db3a8;--line:#26352e;--acc:#35b57f;--acc2:#8fe6c0;--ok:#48c774;--warn:#f0b24a;--err:#ef6a95;--chip:#1c2a24;color-scheme:dark}}\n:root[data-theme=\"dark\"]{--bg:#0e1714;--surface:#16211c;--fg:#eaf3ee;--muted:#9db3a8;--line:#26352e;--acc:#35b57f;--acc2:#8fe6c0;--ok:#48c774;--warn:#f0b24a;--err:#ef6a95;--chip:#1c2a24;color-scheme:dark}\n*{box-sizing:border-box}\nbody{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;line-height:1.5}\n.wrap{max-width:860px;margin:0 auto;padding-block:24px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}\nh1{font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:25px;margin:0 0 2px}\n.sub{color:var(--muted);font-size:14px;margin:0 0 18px}\n.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 8px 22px -16px rgba(15,74,56,.4)}\nlabel{display:block;font-weight:600;font-size:12.5px;margin:0 0 5px;color:var(--muted)}\ninput{width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);font:inherit;margin-bottom:9px}\ninput:focus{outline:none;border-color:var(--acc)}\n.row2{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n@media(max-width:520px){.row2{grid-template-columns:1fr}}\nbutton{padding:11px 16px;border:none;border-radius:10px;font:inherit;font-weight:700;cursor:pointer;background:var(--acc);color:#fff}\nbutton:active{transform:translateY(1px)}\n.hint{font-size:12.5px;color:var(--muted);margin:6px 0 0}\n.hint b{color:var(--fg)}\n.estado{font-size:13px;font-weight:700;padding:8px 11px;border-radius:9px;margin-top:8px;display:none}\n.estado.on{display:block}\n.estado.err{background:color-mix(in srgb,var(--err) 15%,var(--surface));color:var(--err)}\n.estado.ok{background:color-mix(in srgb,var(--ok) 15%,var(--surface));color:var(--ok)}\n.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}\n.tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}\n.tile .lab{font-size:12px;color:var(--muted);font-weight:600}\n.tile .val{font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:26px;margin-top:2px}\n.tile.warn .val{color:var(--warn)}\n.tile.acc .val{color:var(--acc)}\n.planes{display:flex;flex-wrap:wrap;gap:7px;margin:2px 0 14px}\n.pchip{font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;background:var(--chip);border:1px solid var(--line)}\n.tabla-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px}\ntable{width:100%;border-collapse:collapse;font-size:13px;min-width:560px}\nth,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}\nth{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);font-weight:700;background:var(--bg);position:sticky;top:0}\ntr:last-child td{border-bottom:none}\ntd.num{font-variant-numeric:tabular-nums}\n.badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;text-transform:capitalize}\n.badge.free{background:var(--chip);color:var(--muted)}\n.badge.vencido{background:color-mix(in srgb,var(--err) 18%,var(--surface));color:var(--err)}\n.badge.pago{background:color-mix(in srgb,var(--acc) 18%,var(--surface));color:var(--acc)}\n.dias.pocos{color:var(--err);font-weight:800}\n.dias.medio{color:var(--warn);font-weight:700}\n.vacio{padding:22px;text-align:center;color:var(--muted);font-size:14px}\n.spin{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:g .7s linear infinite;vertical-align:-2px;margin-right:6px}\n@keyframes g{to{transform:rotate(360deg)}}\n.filtros{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}\n.filtros button{background:var(--bg);color:var(--fg);border:1.5px solid var(--line);font-size:12.5px;padding:7px 12px}\n.filtros button.on{background:var(--acc);color:#fff;border-color:var(--acc)}\n</style>\n</head>\n<body>\n<div class=\"wrap\">\n<h1>\ud83d\udcca Panel Novaterra</h1>\n<p class=\"sub\">Tu tablero privado: cu\u00e1ntos usuarios tienes, sus planes y qui\u00e9n est\u00e1 por vencer.</p>\n\n<div class=\"card\">\n<div class=\"row2\">\n<div><label for=\"base\">Direcci\u00f3n del servidor</label><input id=\"base\" type=\"text\" value=\"https://novaterra-api.onrender.com\"></div>\n<div><label for=\"key\">Clave de administrador (ADMIN_KEY)</label><input id=\"key\" type=\"password\" placeholder=\"La que pusiste en Render\" autocomplete=\"off\"></div>\n</div>\n<button id=\"cargar\">\ud83d\udd04 Cargar datos</button>\n<div id=\"est\" class=\"estado\"></div>\n<p class=\"hint\">La <b>clave</b> es la variable <b>ADMIN_KEY</b> que agregaste en Render. Se guarda solo en este navegador.</p>\n</div>\n\n<div id=\"resultado\" hidden>\n<div class=\"tiles\" id=\"tiles\"></div>\n<div class=\"planes\" id=\"planes\"></div>\n<div class=\"filtros\" id=\"filtros\">\n<button data-f=\"todos\" class=\"on\">Todos</button>\n<button data-f=\"porvencer\">\u23f0 Por vencer (\u22647 d\u00edas)</button>\n<button data-f=\"pagos\">\ud83d\udcb3 De pago</button>\n<button data-f=\"vencidos\">\u274c Vencidos</button>\n</div>\n<div class=\"tabla-wrap\"><table id=\"tabla\"><thead><tr><th>Correo</th><th>Nombre</th><th>Plan</th><th>D\u00edas</th><th>Vence</th><th>Negocios</th><th>Registrado</th></tr></thead><tbody id=\"tbody\"></tbody></table></div>\n</div>\n</div>\n\n<script>\n(function(){\nvar $=function(i){return document.getElementById(i)};\nvar DATA=null, filtro='todos';\ntry{var b=localStorage.getItem('nv-admin-base');if(b)$('base').value=b;var k=localStorage.getItem('nv-admin-key');if(k)$('key').value=k}catch(e){}\nfunction est(txt,tipo){var e=$('est');e.className='estado on '+(tipo||'');e.innerHTML=txt}\nfunction money(n){return '$'+(n||0).toLocaleString('es-CO')}\nfunction esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}\nfunction fecha(iso){if(!iso)return '\u2014';try{var d=new Date(iso);return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return '\u2014'}}\nvar NOMBREPLAN={free:'Lite',basico:'Start',pro:'Nova',promax:'Ultra',empresa:'Empresa',vencido:'Vencido'};\nfunction nombrePlan(p){return NOMBREPLAN[p]||p}\nfunction claseBadge(p){return p==='free'?'free':(p==='vencido'?'vencido':'pago')}\n\nasync function cargar(){\n  var base=$('base').value.trim().replace(/\\/+$/,''), key=$('key').value.trim();\n  if(!key){est('Escribe tu clave de administrador.','err');return}\n  try{localStorage.setItem('nv-admin-base',base);localStorage.setItem('nv-admin-key',key)}catch(e){}\n  est('<span class=\"spin\"></span>Cargando\u2026 (la 1\u00aa vez puede tardar ~1 min mientras despierta el servidor).','');\n  try{\n    var r=await fetch(base+'/api/admin/usuarios',{headers:{'X-Admin-Key':key}});\n    var txt=await r.text(), d;try{d=JSON.parse(txt)}catch(e){d=null}\n    if(!r.ok){est('\u2717 '+((d&&d.error)||('Error '+r.status)),'err');return}\n    DATA=d;est('\u2713 Datos cargados \u2014 '+d.total+' usuario(s).','ok');\n    pintar();\n  }catch(e){est('\u2717 No se pudo conectar. \u00bfLa direcci\u00f3n es correcta? \u00bfEl servidor est\u00e1 prendido? ('+String(e.message||e)+')','err')}\n}\n\nfunction pintar(){\n  if(!DATA)return;\n  $('resultado').hidden=false;\n  var t=DATA.usuarios||[];\n  var pagos=t.filter(function(u){return u.plan!=='free'&&u.plan!=='vencido'}).length;\n  var vencidos=t.filter(function(u){return u.plan==='vencido'}).length;\n  $('tiles').innerHTML=\n    tile('Usuarios totales',DATA.total,'acc')+\n    tile('Por vencer (\u22647 d\u00edas)',DATA.porVencer,DATA.porVencer>0?'warn':'')+\n    tile('Planes de pago',pagos,'')+\n    tile('Vencidos',vencidos,vencidos>0?'warn':'');\n  var pp=DATA.porPlan||{};\n  $('planes').innerHTML=Object.keys(pp).sort().map(function(k){return '<span class=\"pchip\">'+esc(nombrePlan(k))+': '+pp[k]+'</span>'}).join('');\n  pintarTabla();\n}\nfunction tile(lab,val,cls){return '<div class=\"tile '+(cls||'')+'\"><div class=\"lab\">'+lab+'</div><div class=\"val\">'+val+'</div></div>'}\n\nfunction pintarTabla(){\n  var t=(DATA.usuarios||[]).slice();\n  if(filtro==='porvencer')t=t.filter(function(u){return u.dias!=null&&u.dias>0&&u.dias<=7});\n  else if(filtro==='pagos')t=t.filter(function(u){return u.plan!=='free'&&u.plan!=='vencido'});\n  else if(filtro==='vencidos')t=t.filter(function(u){return u.plan==='vencido'});\n  // ordenar: los que vencen primero, luego el resto\n  t.sort(function(a,b){var da=a.dias==null?99999:a.dias,db=b.dias==null?99999:b.dias;return da-db});\n  if(!t.length){$('tbody').innerHTML='<tr><td colspan=\"7\"><div class=\"vacio\">No hay usuarios en este filtro.</div></td></tr>';return}\n  $('tbody').innerHTML=t.map(function(u){\n    var dias=u.dias==null?'\u2014':(u.dias<=0?'vencido':u.dias+'d');\n    var dcls=u.dias==null?'':(u.dias<=0?'pocos':(u.dias<=7?'pocos':(u.dias<=15?'medio':'')));\n    return '<tr>'+\n      '<td>'+esc(u.email)+'</td>'+\n      '<td>'+esc(u.nombre||'\u2014')+'</td>'+\n      '<td><span class=\"badge '+claseBadge(u.plan)+'\">'+esc(nombrePlan(u.plan))+'</span></td>'+\n      '<td class=\"num dias '+dcls+'\">'+dias+'</td>'+\n      '<td class=\"num\">'+fecha(u.vence)+'</td>'+\n      '<td class=\"num\">'+(u.negocios||0)+'</td>'+\n      '<td class=\"num\">'+fecha(u.creado)+'</td>'+\n    '</tr>';\n  }).join('');\n}\n\n$('cargar').addEventListener('click',cargar);\n$('key').addEventListener('keydown',function(e){if(e.key==='Enter')cargar()});\n$('filtros').addEventListener('click',function(e){var b=e.target.closest('button[data-f]');if(!b)return;filtro=b.dataset.f;Array.prototype.forEach.call($('filtros').children,function(x){x.classList.toggle('on',x===b)});pintarTabla()});\n})();\n</script>\n</body>\n</html>\n";

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
  if ((ruta === '/panel' || ruta === '/admin') && metodo === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PANEL_HTML); return;
  }

  if (ruta === '/' || ruta === '/api/salud') {
    let n = null; try { if (!USA_SB) n = FILE.usuarios.length; } catch (e) {}
    return enviar(res, 200, { ok: true, servicio: 'Novaterra API', version: '0.6', almacen: USA_SB ? 'supabase' : 'archivo', usuarios: n });
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

http.createServer((req, res) => { router(req, res).catch(e => enviar(res, 500, { error: 'Error interno', detalle: String(e.message || e) })); }).listen(PORT, () => console.log('Novaterra API en http://localhost:' + PORT));
