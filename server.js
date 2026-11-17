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
// Token opcional de MercadoLibre (si su API lo exige). Variable ML_TOKEN en Render.
const ML_TOKEN = process.env.ML_TOKEN || '';
// App de MercadoLibre para conexión con auto-renovación (variables ML_CLIENT_ID y ML_CLIENT_SECRET en Render).
const ML_CLIENT_ID = process.env.ML_CLIENT_ID || '';
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || '';
// Versión de la política/términos. Si cambias el texto legal, sube este número y se vuelve a pedir el consentimiento.
const TERMS_VERSION = '2026-11';

function anioDe(attrs) { if (!Array.isArray(attrs)) return null; for (const a of attrs) { if (a.id === 'VEHICLE_YEAR' || /^a[nñ]o$/i.test(a.name || '')) return a.value_name || null; } return null; }
function limpiaQ(q) { return String(q).replace(/\b(usad[oa]s?|nuev[oa]s?|segunda)\b/gi, '').replace(/\s+/g, ' ').trim(); }
function mlSlug(q) { return limpiaQ(q).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
var UA_NAV = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
async function scrapeML(q) {
  const url = 'https://listado.mercadolibre.com.co/' + mlSlug(q);
  const r = await fetch(url, { headers: { 'User-Agent': UA_NAV, 'Accept-Language': 'es-CO,es;q=0.9', 'Accept': 'text/html,application/xhtml+xml' } });
  if (!r.ok) return [];
  const html = await r.text();
  const out = [];
  // Partir el HTML por tarjeta de resultado, para mantener alineado precio+titulo+foto
  const cards = html.split(/poly-card|ui-search-layout__item/);
  for (let k = 1; k < cards.length && out.length < 40; k++) {
    const c = cards[k];
    const pm = /andes-money-amount__fraction[^>]*>([\d\.]+)</.exec(c);
    if (!pm) continue;
    const precio = parseInt(pm[1].replace(/\./g, ''), 10);
    if (!(precio > 1000)) continue;
    const tm = /poly-component__title[^>]*>(?:<a[^>]*>)?([^<]{4,120})/.exec(c);
    const titulo = tm ? tm[1].replace(/&amp;/g, '&').trim() : q;
    const im = /(https:\/\/http2\.mlstatic\.com\/[^\s"']+?\.(?:jpg|webp|png))/.exec(c);
    const img = im ? im[1] : '';
    const lm = /href="(https:\/\/(?:articulo|carro|moto|vehiculo|www)\.[^"]+)"/.exec(c);
    const link = lm ? lm[1] : url;
    out.push({ titulo, precio, img, link, ano: null });
  }
  // Respaldo: si el partido no funcionó, barrer precios y fotos por separado
  if (!out.length) {
    const precios = []; let m; const reP = /andes-money-amount__fraction[^>]*>([\d\.]+)</g;
    while ((m = reP.exec(html)) && precios.length < 40) { const n = parseInt(m[1].replace(/\./g, ''), 10); if (n > 1000) precios.push(n); }
    const imgs = []; let g; const reI = /(https:\/\/http2\.mlstatic\.com\/[^\s"']+?\.(?:jpg|webp|png))/g;
    while ((g = reI.exec(html)) && imgs.length < 60) { imgs.push(g[1]); }
    for (let i = 0; i < precios.length; i++) out.push({ titulo: q, precio: precios[i], img: imgs[i] || '', link: url, ano: null });
  }
  return out;
}
// ---------- MercadoLibre OAuth con auto-renovación ----------
async function mlTokenFetch(params) {
  const body = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const r = await fetch('https://api.mercadolibre.com/oauth/token', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const txt = await r.text(); let d; try { d = JSON.parse(txt); } catch (e) { d = null; }
  if (!r.ok || !d || !d.access_token) throw new Error('ML token ' + r.status + ': ' + txt.slice(0, 200));
  return d;
}
async function mlGuardar(d) {
  const tok = { access_token: d.access_token, refresh_token: d.refresh_token, expira: Date.now() + (Math.max(0, +d.expires_in || 21600) - 300) * 1000, user_id: d.user_id || null };
  await datos.setConfig('ml_auth', JSON.stringify(tok)); return tok;
}
async function mlLeer() { try { const v = await datos.getConfig('ml_auth'); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
async function mlAccessToken() {
  if (ML_TOKEN) return ML_TOKEN; // token fijo manual, si se usa
  if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) return '';
  let t = await mlLeer();
  if (!t || !t.refresh_token) return '';
  if (t.access_token && t.expira && Date.now() < t.expira) return t.access_token;
  try { const d = await mlTokenFetch({ grant_type: 'refresh_token', client_id: ML_CLIENT_ID, client_secret: ML_CLIENT_SECRET, refresh_token: t.refresh_token }); const nt = await mlGuardar(d); return nt.access_token; }
  catch (e) { return (t && t.access_token) || ''; }
}
async function buscarMercado(q) {
  let items = [], fuente = '';
  const TOK = await mlAccessToken();
  try {
    const h = { 'Accept': 'application/json', 'User-Agent': UA_NAV };
    if (TOK) h['Authorization'] = 'Bearer ' + TOK;
    const r = await fetch('https://api.mercadolibre.com/sites/MCO/search?q=' + encodeURIComponent(limpiaQ(q)) + '&limit=30', { headers: h });
    if (r.ok) { const d = await r.json(); items = (d.results || []).map(x => ({ titulo: x.title, precio: x.price, img: (x.thumbnail || '').replace(/^http:/, 'https:'), link: x.permalink, ano: anioDe(x.attributes), cond: x.condition })); fuente = 'ml-api'; }
  } catch (e) {}
  if (!items.length) { try { items = await scrapeML(q); fuente = 'ml-web'; } catch (e) {} }
  const precios = items.map(i => +i.precio).filter(p => p > 0).sort((a, b) => a - b);
  let resumen = null;
  if (precios.length) { const sum = precios.reduce((a, b) => a + b, 0); resumen = { n: precios.length, min: precios[0], max: precios[precios.length - 1], prom: Math.round(sum / precios.length), mediana: precios[Math.floor(precios.length / 2)] }; }
  return { q, fuente, items: items.slice(0, 30), resumen };
}
// ---------- Índice Novaterra: precios reales de la comunidad ----------
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function indiceNovaterra(lista, q) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const hits = (lista || []).filter(p => {
    const txt = norm((p.modelo || '') + ' ' + (p.ano || '') + ' ' + (p.cat || ''));
    return toks.every(t => txt.indexOf(t) >= 0);
  });
  if (!hits.length) return { n: 0 };
  const pr = hits.map(h => +h.precio).filter(p => p > 0).sort((a, b) => a - b);
  if (!pr.length) return { n: 0 };
  const sum = pr.reduce((a, b) => a + b, 0);
  const porCiudad = {};
  hits.forEach(h => { const c = String(h.ciudad || '').trim() || '—'; const v = +h.precio; if (v > 0) (porCiudad[c] = porCiudad[c] || []).push(v); });
  const zonas = Object.keys(porCiudad).map(c => { const v = porCiudad[c]; return { ciudad: c, n: v.length, prom: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }; }).sort((a, b) => b.n - a.n).slice(0, 6);
  const recientes = hits.slice(0, 6).map(h => ({ modelo: h.modelo, ano: h.ano, precio: +h.precio, ciudad: h.ciudad || '', tipo: h.tipo || '', unidad: h.unidad || '', fecha: h.fecha }));
  const nCom = hits.filter(h => h.tipo !== 'internet' && h.tipo !== 'referencia').length;
  // Tendencia (historial): promedio por ventana de tiempo
  const ahora = Date.now();
  function ventana(diasMin, diasMax) {
    const sel = hits.filter(h => { const d = (ahora - new Date(h.fecha).getTime()) / 86400000; return d >= diasMin && d < diasMax && +h.precio > 0; });
    if (!sel.length) return null;
    return Math.round(sel.reduce((a, h) => a + (+h.precio), 0) / sel.length);
  }
  const hoy = ventana(0, 8), semana = ventana(8, 20), mes = ventana(25, 45);
  const pct = (a, b) => (a != null && b != null && b > 0) ? Math.round((a - b) / b * 100) : null;
  const tendencia = (hoy != null && (semana != null || mes != null)) ? { hoy, semana, mes, cambioSemana: pct(hoy, semana), cambioMes: pct(hoy, mes) } : null;
  return { n: pr.length, nCom, min: pr[0], max: pr[pr.length - 1], prom: Math.round(sum / pr.length), mediana: pr[Math.floor(pr.length / 2)], zonas, recientes, tendencia };
}
const VISTO_INTERNET = new Set(); // evita guardar el mismo dato de internet varias veces el mismo día
function escH(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function pesos(n) { return '$' + Math.round(+n || 0).toLocaleString('es-CO'); }
function paginaProducto(p, host) {
  const urlActual = 'https://' + host + '/p/' + p.id;
  const imgUrl = p.img ? ('https://' + host + '/img/' + p.id) : '';
  const titulo = (p.modelo || 'Producto') + (p.ano ? ' ' + p.ano : '');
  const tel = String(p.telefono || '').replace(/[^\d]/g, '').replace(/^57/, '');
  const msg = encodeURIComponent('Hola, vi tu ' + titulo + ' en Novaterra por ' + pesos(p.precio) + '. ¿Sigue disponible?');
  const wa = tel ? ('https://wa.me/57' + tel + '?text=' + msg) : '';
  const vendido = p.estado === 'vendido';
  const desc = (p.descripcion || '').slice(0, 300);
  const jsonld = { '@context': 'https://schema.org/', '@type': 'Product', name: titulo, description: desc || ('En venta en Novaterra' + (p.ciudad ? ' en ' + p.ciudad : '')), offers: { '@type': 'Offer', priceCurrency: 'COP', price: Math.round(+p.precio || 0), availability: vendido ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: urlActual } };
  if (imgUrl) jsonld.image = [imgUrl];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escH(titulo)} — ${escH(pesos(p.precio))} | Novaterra</title>
<meta name="description" content="${escH(titulo + ' en venta por ' + pesos(p.precio) + (p.ciudad ? ' en ' + p.ciudad : '') + '. ' + desc)}">
<link rel="canonical" href="${escH(urlActual)}">
<meta property="og:type" content="product">
<meta property="og:url" content="${escH(urlActual)}">
<meta property="og:title" content="${escH(titulo + ' — ' + pesos(p.precio))}">
<meta property="og:description" content="${escH(desc || ('En venta en Novaterra' + (p.ciudad ? ' · ' + p.ciudad : '')))}">
${imgUrl ? '<meta property="og:image" content="' + escH(imgUrl) + '"><meta name="twitter:card" content="summary_large_image">' : ''}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
:root{--bg:#eef4f0;--sf:#fff;--fg:#13241d;--mut:#5d7268;--ln:#d7e4dc;--acc:#1f8d63}
@media(prefers-color-scheme:dark){:root{--bg:#0e1714;--sf:#16211c;--fg:#eaf3ee;--mut:#9db3a8;--ln:#26352e;--acc:#35b57f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;line-height:1.5}
.wrap{max-width:520px;margin:0 auto;padding:16px}
.card{background:var(--sf);border:1px solid var(--ln);border-radius:18px;overflow:hidden;box-shadow:0 12px 30px -20px rgba(0,0,0,.5)}
.foto{width:100%;aspect-ratio:4/3;object-fit:cover;background:#0001;display:block}
.nofoto{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;font-size:60px;background:#0001}
.pad{padding:16px}
.pre{font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:30px;color:var(--acc);margin:0}
.tit{font-size:19px;font-weight:700;margin:4px 0 2px}
.ciu{color:var(--mut);font-size:14px;margin:0 0 10px}
.desc{font-size:14.5px;white-space:pre-wrap;margin:10px 0}
.vend{display:inline-block;background:#d6336c;color:#fff;font-weight:800;font-size:12px;padding:4px 10px;border-radius:999px;margin-bottom:8px}
.wa{display:block;text-align:center;text-decoration:none;background:#25D366;color:#fff;font-weight:800;padding:14px;border-radius:12px;margin:12px 0 8px;font-size:16px}
.ref{background:var(--bg);border:1.5px solid var(--acc);border-radius:12px;padding:11px 13px;margin:10px 0;font-size:13.5px}
.ref b{color:var(--acc)}
.safe{background:color-mix(in srgb,var(--acc) 9%,var(--sf));border:1px solid color-mix(in srgb,var(--acc) 30%,var(--ln));border-radius:12px;padding:11px 13px;margin:10px 0;font-size:12.8px;line-height:1.5}
.safe b{color:var(--acc)}
.leg{font-size:11px;color:var(--mut);border-top:1px solid var(--ln);padding-top:10px;margin-top:12px}
.qr{text-align:center;margin:14px 0 4px}.qr canvas,.qr img{background:#fff;padding:8px;border-radius:10px}
.foot{text-align:center;margin:16px 0;font-size:13px}.foot a{color:var(--acc);font-weight:700}
.marca{text-align:center;font-weight:800;color:var(--acc);margin:6px 0 14px;font-family:'Space Grotesk',sans-serif}
</style></head><body><div class="wrap">
<p class="marca">🌱 Novaterra <span style="font-size:11px;color:var(--mut);font-weight:600">· 🔒 página verificada</span></p>
<div class="card">
${imgUrl ? '<img class="foto" src="' + escH(imgUrl) + '" alt="' + escH(titulo) + '">' : '<div class="nofoto">📦</div>'}
<div class="pad">
${vendido ? '<span class="vend">VENDIDO</span><br>' : ''}
<p class="pre">${escH(pesos(p.precio))}</p>
<p class="tit">${escH(titulo)}</p>
${p.ciudad ? '<p class="ciu">📍 ' + escH(p.ciudad) + '</p>' : ''}
${desc ? '<p class="desc">' + escH(desc) + '</p>' : ''}
${(!vendido && wa) ? '<a class="wa" href="' + wa + '" target="_blank" rel="noopener">💬 Contactar por WhatsApp</a>' : ''}
<div class="safe"><b>🔒 Compra segura:</b> esta página <b>no pide claves ni pagos</b>. Acuerda por WhatsApp, revisa el producto <b>en persona</b> en un lugar público y paga <b>contra entrega</b>. No pagues por adelantado a desconocidos.</div>
<div class="ref" id="ref" hidden></div>
<div class="qr" id="qr"></div>
<p class="leg">⚖️ Publicación de un usuario de Novaterra. El precio es una referencia puesta por el vendedor; Novaterra no vende, no interviene en el pago y no garantiza el producto. Verifica antes de pagar.</p>
</div></div>
<p class="foot"><a href="/vitrina">🔎 Ver más productos en Novaterra</a> · <a href="/privacidad">Privacidad</a></p>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
(function(){
try{new QRCode(document.getElementById('qr'),{text:${JSON.stringify(urlActual)},width:120,height:120,colorDark:'#13241d'});}catch(e){document.getElementById('qr').style.display='none';}
fetch('/api/precios?cat='+encodeURIComponent(${JSON.stringify(p.cat || '')})+'&q='+encodeURIComponent(${JSON.stringify((p.modelo || '') + ' ' + (p.ano || ''))})).then(function(r){return r.json()}).then(function(d){
var n=d&&d.novaterra;if(n&&n.n>0){var e=document.getElementById('ref');e.hidden=false;e.innerHTML='📊 <b>Referencia Novaterra:</b> similares entre '+ '$'+(n.min).toLocaleString('es-CO')+' y $'+(n.max).toLocaleString('es-CO')+' (promedio $'+(n.prom).toLocaleString('es-CO')+'). Dato informativo, no es avalúo.';}
}).catch(function(){});
})();
</script></body></html>`;
}
const CATS_NOMBRE = { moto: 'Motos', carro: 'Carros', compu: 'Computadores', celular: 'Celulares', electro: 'Electrodomésticos', oro: 'Oro y joyas', otro: 'Otros' };
const CAT_ICON = { moto: '🏍️', carro: '🚗', compu: '💻', celular: '📱', electro: '🔌', oro: '💛', otro: '📦' };
function catalogoHTML(items, q, cat, host, base) {
  const titulo = (q ? ('"' + q + '"') : (cat && CATS_NOMBRE[cat] ? CATS_NOMBRE[cat] : 'Vitrina')) + ' en venta en Colombia | Novaterra';
  const baseByCat = {};
  (base || []).forEach(r => { (baseByCat[r.cat] = baseByCat[r.cat] || []).push(r); });
  const cards = items.map(p => {
    const t = escH((p.modelo || 'Producto') + (p.ano ? ' ' + p.ano : ''));
    const img = p.img ? ('https://' + host + '/img/' + p.id) : '';
    let sello = '';
    try { const ref = indiceNovaterra(baseByCat[p.cat] || [], (p.modelo || '') + ' ' + (p.ano || '')); if (ref && ref.n >= 2 && ref.prom > 0 && +p.precio > 0 && +p.precio <= ref.prom * 0.97) sello = '<span class="badge">✅ Buen precio</span>'; } catch (e) {}
    return '<a class="c" href="/p/' + encodeURIComponent(p.id) + '"><div class="cimg">' + (img ? '<img src="' + escH(img) + '" alt="' + t + '" loading="lazy">' : '<div class="ni">' + (CAT_ICON[p.cat] || '📦') + '</div>') + sello + '</div><div class="cb"><div class="cp">' + escH(pesos(p.precio)) + '</div><div class="ct">' + t + '</div>' + (p.ciudad ? '<div class="cc">📍 ' + escH(p.ciudad) + '</div>' : '') + '</div></a>';
  }).join('');
  const chips = '<a class="chip' + (!cat ? ' on' : '') + '" href="/vitrina">⭐ Todas</a>' + Object.keys(CATS_NOMBRE).map(k => '<a class="chip' + (k === cat ? ' on' : '') + '" href="/vitrina?cat=' + k + '">' + (CAT_ICON[k] || '') + ' ' + CATS_NOMBRE[k] + '</a>').join('');
  const opts = Object.keys(CATS_NOMBRE).map(k => '<option value="' + k + '"' + (k === cat ? ' selected' : '') + '>' + CATS_NOMBRE[k] + '</option>').join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escH(titulo)}</title>
<meta name="description" content="Productos en venta en Colombia publicados en Novaterra${q ? ': ' + escH(q) : ''}. Mira fotos, precios y contacta al vendedor por WhatsApp.">
<link rel="canonical" href="https://${escH(host)}/vitrina${cat ? '?cat=' + encodeURIComponent(cat) : ''}">
<style>
:root{--bg:#eef4f0;--sf:#fff;--fg:#13241d;--mut:#5d7268;--ln:#d7e4dc;--acc:#1f8d63}
@media(prefers-color-scheme:dark){:root{--bg:#0e1714;--sf:#16211c;--fg:#eaf3ee;--mut:#9db3a8;--ln:#26352e;--acc:#35b57f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}
.wrap{max-width:920px;margin:0 auto;padding:16px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.marca{font-family:'Space Grotesk',sans-serif;font-weight:800;color:var(--acc);font-size:20px;text-decoration:none}
.pub{background:var(--acc);color:#fff;text-decoration:none;font-weight:700;padding:9px 14px;border-radius:10px;font-size:14px}
form{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
select,input{padding:10px 12px;border:1.5px solid var(--ln);border-radius:10px;background:var(--sf);color:var(--fg);font:inherit}
input{flex:1;min-width:140px}
button{background:var(--acc);color:#fff;border:none;border-radius:10px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer}
h1{font-size:18px;margin:4px 0 12px}
.cats{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:14px;-webkit-overflow-scrolling:touch}
.cats::-webkit-scrollbar{height:0}
.chip{flex:none;white-space:nowrap;background:var(--sf);border:1.5px solid var(--ln);color:var(--fg);text-decoration:none;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px}
.chip.on{background:var(--acc);border-color:var(--acc);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
.c{background:var(--sf);border:1px solid var(--ln);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow .15s,transform .15s}
.c:hover{box-shadow:0 10px 26px -16px rgba(0,0,0,.45);transform:translateY(-2px)}
.cimg{position:relative}
.c img,.c .ni{width:100%;aspect-ratio:1;object-fit:cover;background:#0001;display:block}
.c .ni{display:flex;align-items:center;justify-content:center;font-size:46px}
.badge{position:absolute;top:8px;left:8px;background:#128a4e;color:#fff;font-size:11px;font-weight:800;padding:4px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.cb{padding:10px 12px 12px}
.cp{font-family:'Space Grotesk',sans-serif;font-weight:800;color:var(--acc);font-size:18px}
.ct{font-size:13px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cc{font-size:11.5px;color:var(--mut);margin-top:3px}
.vacio{padding:30px;text-align:center;color:var(--mut)}
.leg{font-size:11.5px;color:var(--mut);margin-top:20px;border-top:1px solid var(--ln);padding-top:12px}
</style></head><body><div class="wrap">
<div class="top"><a class="marca" href="/vitrina">🌱 Novaterra</a><span style="font-size:12.5px;color:var(--mut)">Precios de referencia de la comunidad</span></div>
<form method="get" action="/vitrina"><select name="cat"><option value="">Todas las categorías</option>${opts}</select><input name="q" value="${escH(q || '')}" placeholder="Buscar: NS200, iPhone, nevera…"><button type="submit">Buscar</button></form>
<div class="cats">${chips}</div>
<h1>${q ? (items.length + ' resultado' + (items.length !== 1 ? 's' : '') + ' para “' + escH(q) + '”') : (cat && CATS_NOMBRE[cat] ? CATS_NOMBRE[cat] : '🔥 Recién publicados')}</h1>
${items.length ? '<div class="grid">' + cards + '</div>' : '<div class="vacio">No hay publicaciones todavía. Instala Novaterra y sé el primero en publicar.</div>'}
<p class="leg">Novaterra es una herramienta para que vendedores publiquen y compradores se orienten. Los precios los pone cada vendedor como referencia; Novaterra no vende ni garantiza los productos ni interviene en los pagos. · <a href="/privacidad" style="color:var(--acc)">Privacidad y términos</a></p>
</div></body></html>`;
}
function paginaConsentimientos() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registro de consentimientos | Novaterra</title>
<style>
:root{--bg:#eef4f0;--sf:#fff;--fg:#13241d;--mut:#5d7268;--ln:#d7e4dc;--acc:#1f8d63}
@media(prefers-color-scheme:dark){:root{--bg:#0e1714;--sf:#16211c;--fg:#eaf3ee;--mut:#9db3a8;--ln:#26352e;--acc:#35b57f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:20px}
h1{font-size:22px;margin:0 0 4px}.sub{color:var(--mut);font-size:13.5px;margin:0 0 16px}
.card{background:var(--sf);border:1px solid var(--ln);border-radius:14px;padding:16px;margin-bottom:14px}
label{display:block;font-size:12.5px;font-weight:600;color:var(--mut);margin-bottom:5px}
input{width:100%;padding:10px 12px;border:1.5px solid var(--ln);border-radius:10px;background:var(--bg);color:var(--fg);font:inherit;margin-bottom:9px}
button{padding:11px 16px;border:none;border-radius:10px;font:inherit;font-weight:700;cursor:pointer;background:var(--acc);color:#fff}
.est{font-size:13px;font-weight:700;margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--ln);white-space:nowrap}
th{font-size:11px;text-transform:uppercase;color:var(--mut)}
.tw{overflow-x:auto;border:1px solid var(--ln);border-radius:12px}
</style></head><body><div class="wrap">
<h1>🔒 Panel del dueño</h1>
<p class="sub">Solo para ti. Genera códigos de créditos y revisa quién aceptó los términos.</p>
<div class="card">
<label>Dirección del servidor</label><input id="base" value="https://novaterra-api.onrender.com">
<label>Clave de administrador (ADMIN_KEY)</label><input id="key" type="password" placeholder="La que pusiste en Render">
</div>
<div class="card">
<h3 style="margin:0 0 8px;font-size:16px">🎟️ Generar código de créditos</h3>
<p class="sub" style="margin:0 0 10px">Para vender publicaciones: el cliente te paga (Nequi/Daviplata), tú generas el código aquí y se lo das. Él lo activa en la app.</p>
<label>¿Cuántas publicaciones?</label><input id="ncred" type="number" value="20" min="1" max="999">
<button id="gencred">Generar código</button><div id="credout" class="est"></div>
</div>
<div class="card">
<h3 style="margin:0 0 8px;font-size:16px">📄 Registro de consentimientos</h3>
<button id="cargar">🔄 Cargar registro</button><div id="est" class="est"></div>
</div>
<div id="out"></div>
<script>
var $=function(i){return document.getElementById(i)};
try{var b=localStorage.getItem('nv-ck-base');if(b)$('base').value=b;var k=localStorage.getItem('nv-ck-key');if(k)$('key').value=k}catch(e){}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function guardarkey(){try{localStorage.setItem('nv-ck-base',$('base').value.trim());localStorage.setItem('nv-ck-key',$('key').value.trim())}catch(e){}}
$('gencred').addEventListener('click',async function(){
  var base=$('base').value.trim().replace(/\\/+$/,''),key=$('key').value.trim();
  if(!key){$('credout').textContent='Escribe tu clave de administrador arriba.';return}
  guardarkey();var n=parseInt($('ncred').value,10)||20;
  $('credout').textContent='Generando…';
  try{var r=await fetch(base+'/api/admin/codigo-creditos?n='+n,{headers:{'X-Admin-Key':key}});var d=await r.json();
    if(!r.ok){$('credout').textContent='✗ '+((d&&d.error)||('Error '+r.status));return}
    $('credout').innerHTML='✅ Código para <b>'+d.creditos+'</b> publicaciones: <b style="font-size:20px;color:var(--acc)">'+esc(d.codigo)+'</b><br><span style="font-weight:400;color:var(--mut)">Dáselo al cliente para que lo active en la app.</span>';
  }catch(e){$('credout').textContent='✗ No se pudo conectar: '+String(e.message||e)}
});
function fecha(x){try{return new Date(x).toLocaleString('es-CO')}catch(e){return x||'—'}}
$('cargar').addEventListener('click',async function(){
  var base=$('base').value.trim().replace(/\\/+$/,''),key=$('key').value.trim();
  if(!key){$('est').textContent='Escribe tu clave de administrador.';return}
  try{localStorage.setItem('nv-ck-base',base);localStorage.setItem('nv-ck-key',key)}catch(e){}
  $('est').textContent='Cargando…';
  try{
    var r=await fetch(base+'/api/admin/consentimientos',{headers:{'X-Admin-Key':key}});
    var d=await r.json();
    if(!r.ok){$('est').textContent='✗ '+((d&&d.error)||('Error '+r.status));return}
    $('est').textContent='✓ '+d.total+' consentimiento(s). Versión actual: '+d.version_actual;
    var rows=(d.consentimientos||[]).map(function(c){return '<tr><td>'+esc(c.email)+'</td><td>'+esc(c.version)+'</td><td>'+esc(c.origen||'')+'</td><td>'+esc(fecha(c.fecha))+'</td><td>'+esc(c.ip||'')+'</td></tr>'}).join('');
    $('out').innerHTML='<div class="card"><div class="tw"><table><thead><tr><th>Correo</th><th>Versión</th><th>Origen</th><th>Fecha</th><th>IP</th></tr></thead><tbody>'+(rows||'<tr><td colspan=5>Sin registros aún.</td></tr>')+'</tbody></table></div></div>';
  }catch(e){$('est').textContent='✗ No se pudo conectar: '+String(e.message||e)}
});
</script></body></html>`;
}
function paginaLegal() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Privacidad y términos | Novaterra</title>
<meta name="description" content="Política de privacidad y términos de uso de Novaterra. Precios sugeridos de referencia; no vendemos, no pedimos pagos.">
<style>
:root{--bg:#eef4f0;--sf:#fff;--fg:#13241d;--mut:#5d7268;--ln:#d7e4dc;--acc:#1f8d63}
@media(prefers-color-scheme:dark){:root{--bg:#0e1714;--sf:#16211c;--fg:#eaf3ee;--mut:#9db3a8;--ln:#26352e;--acc:#35b57f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;line-height:1.6}
.wrap{max-width:720px;margin:0 auto;padding:18px}
.marca{font-family:'Space Grotesk',sans-serif;font-weight:800;color:var(--acc);font-size:20px;text-decoration:none}
h1{font-size:24px;margin:14px 0 2px}h2{font-size:17px;margin:22px 0 6px;color:var(--acc)}
.fecha{color:var(--mut);font-size:13px;margin:0 0 6px}
.card{background:var(--sf);border:1px solid var(--ln);border-radius:14px;padding:16px 18px;margin-top:14px}
.dest{background:color-mix(in srgb,var(--acc) 9%,var(--sf));border:1px solid color-mix(in srgb,var(--acc) 30%,var(--ln));border-radius:12px;padding:12px 14px;margin:10px 0}
p,li{font-size:14.5px}b{color:var(--fg)}a{color:var(--acc)}
.foot{margin:20px 0;font-size:13px}
</style></head><body><div class="wrap">
<a class="marca" href="/vitrina">🌱 Novaterra</a>
<h1>Política de privacidad y términos</h1>
<p class="fecha">Última actualización: noviembre de 2026</p>
<div class="card">
<h2>1. Qué es Novaterra</h2>
<p>Novaterra es una herramienta para que los negocios lleven sus cuentas y publiquen productos, y para que las personas se orienten sobre precios. <b>Novaterra no es una tienda:</b> no vende, no cobra, no entrega productos y no interviene en los pagos entre las personas.</p>

<h2>2. Sobre los precios (importante)</h2>
<div class="dest"><p style="margin:0">Los precios que muestra Novaterra son <b>sugeridos, a modo de referencia</b>, para darte un <b>punto de partida al negociar</b>. Vienen de lo que publican los usuarios de la comunidad y de datos públicos de plataformas como <b>MercadoLibre</b>. <b>No son un avalúo, no son una recomendación de comprar o vender, ni una garantía de precio.</b> El precio final lo acuerdan libremente el comprador y el vendedor. Novaterra nunca te pide ni te sugiere que compres algo.</p></div>

<h2>3. Qué datos recogemos</h2>
<p>• <b>Tu cuenta:</b> correo y nombre, para identificarte y guardar tu información en la nube.<br>• <b>Tu negocio:</b> los clientes, pagos, productos y precios que tú registras.<br>• <b>Tus publicaciones:</b> fotos, descripciones y el número de WhatsApp que decidas poner.<br>No pedimos datos que no necesitemos, y <b>nunca pedimos contraseñas ni pagos</b> en las páginas públicas.</p>

<h2>4. Para qué los usamos</h2>
<p>Solo para que la app funcione: guardar tu información, mostrar tus publicaciones y calcular los precios de referencia. <b>No vendemos tus datos</b> ni los entregamos a terceros para publicidad.</p>

<h2>5. Lo que publicas es público</h2>
<p>Los productos y las tiendas que publicas son <b>páginas públicas</b>: cualquiera con el enlace las ve y buscadores como Google pueden mostrarlas. El número de WhatsApp que pongas será visible para que te contacten. No publiques datos que no quieras que se vean.</p>

<h2>6. Compra segura</h2>
<p>Novaterra no interviene en las transacciones. Para comprar o vender: acuerda por WhatsApp, <b>revisa el producto en persona</b> en un lugar público y <b>paga contra entrega</b>. <b>Nunca pagues por adelantado</b> a desconocidos.</p>

<h2>7. Tus derechos</h2>
<p>Puedes editar o borrar tus publicaciones desde la app en cualquier momento. Si quieres eliminar tu cuenta o tus datos, escríbenos desde el botón <b>💡 Sugerencias</b> dentro de la app.</p>

<h2>8. Mayores de edad</h2>
<p>Novaterra está dirigida a personas mayores de edad.</p>

<h2>9. Contacto</h2>
<p>Para dudas, solicitudes sobre tus datos o reportar un problema, escríbenos desde el botón <b>💡 Sugerencias</b> dentro de la app.</p>
</div>
<p class="foot"><a href="/vitrina">← Volver a Novaterra</a></p>
</div></body></html>`;
}
function slugify(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
function mesAno(iso) { try { const d = new Date(iso); return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
function tiendaHTML(t, prods, host) {
  const nombre = t.nombre || 'Tienda en Novaterra';
  const tel = String(t.tel || '').replace(/[^\d]/g, '').replace(/^57/, '');
  const wa = tel ? ('https://wa.me/57' + tel) : '';
  const desde = t.desde ? mesAno(t.desde) : '';
  const cards = prods.map(p => {
    const nom = escH((p.modelo || 'Producto') + (p.ano ? ' ' + p.ano : ''));
    const img = p.img ? ('https://' + host + '/img/' + p.id) : '';
    return '<a class="c" href="/p/' + encodeURIComponent(p.id) + '">' + (img ? '<img src="' + escH(img) + '" alt="' + nom + '" loading="lazy">' : '<div class="ni">📦</div>') + '<div class="cb"><div class="cp">' + escH(pesos(p.precio)) + '</div><div class="ct">' + nom + '</div></div></a>';
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escH(nombre)}${t.ciudad ? ' · ' + escH(t.ciudad) : ''} | Novaterra</title>
<meta name="description" content="${escH(nombre + (t.ciudad ? ' en ' + t.ciudad : '') + '. ' + prods.length + ' productos en venta. ' + (t.desc || ''))}">
<meta property="og:title" content="${escH(nombre)}"><meta property="og:description" content="${escH((t.desc || 'Mira mis productos en venta') + (t.ciudad ? ' · ' + t.ciudad : ''))}">
<style>
:root{--bg:#eef4f0;--sf:#fff;--fg:#13241d;--mut:#5d7268;--ln:#d7e4dc;--acc:#1f8d63}
@media(prefers-color-scheme:dark){:root{--bg:#0e1714;--sf:#16211c;--fg:#eaf3ee;--mut:#9db3a8;--ln:#26352e;--acc:#35b57f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:16px}
.bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.marca{font-family:'Space Grotesk',sans-serif;font-weight:800;color:var(--acc);font-size:19px;text-decoration:none}
.verif{font-size:11px;color:var(--mut);display:flex;align-items:center;gap:4px}
.head{background:var(--sf);border:1px solid var(--ln);border-radius:16px;padding:18px;margin-bottom:12px}
.head h1{font-size:23px;margin:0 0 4px}
.meta{color:var(--mut);font-size:13.5px}
.wa{display:inline-block;margin-top:12px;background:#25D366;color:#fff;text-decoration:none;font-weight:800;padding:11px 18px;border-radius:11px;font-size:15px}
.trust{background:color-mix(in srgb,var(--acc) 9%,var(--sf));border:1px solid color-mix(in srgb,var(--acc) 30%,var(--ln));border-radius:12px;padding:12px 14px;font-size:12.8px;color:var(--fg);margin-bottom:14px;line-height:1.5}
.trust b{color:var(--acc)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.c{background:var(--sf);border:1px solid var(--ln);border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column}
.c img,.c .ni{width:100%;aspect-ratio:1;object-fit:cover;background:#0001}
.c .ni{display:flex;align-items:center;justify-content:center;font-size:40px}
.cb{padding:9px 11px 11px}.cp{font-family:'Space Grotesk',sans-serif;font-weight:800;color:var(--acc);font-size:17px}
.ct{font-size:13px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vacio{padding:26px;text-align:center;color:var(--mut)}
.leg{font-size:11.5px;color:var(--mut);margin-top:20px;border-top:1px solid var(--ln);padding-top:12px;line-height:1.5}
</style></head><body><div class="wrap">
<div class="bar"><a class="marca" href="/vitrina">🌱 Novaterra</a><span class="verif">🔒 Página verificada de Novaterra</span></div>
<div class="head"><h1>${escH(nombre)}</h1><div class="meta">${t.ciudad ? '📍 ' + escH(t.ciudad) + ' · ' : ''}${prods.length} producto${prods.length === 1 ? '' : 's'}${desde ? ' · en Novaterra desde ' + escH(desde) : ''}</div>${t.desc ? '<p style="margin:10px 0 0;font-size:14.5px">' + escH(t.desc) + '</p>' : ''}${wa ? '<a class="wa" href="' + wa + '" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>' : ''}</div>
<div class="trust"><b>🔒 Compra con confianza:</b> Esta página <b>no te pide contraseñas ni pagos</b>. Novaterra solo muestra lo que el vendedor publica. Para comprar: acuerda por WhatsApp, <b>revisa el producto en persona</b> en un lugar público y <b>paga contra entrega</b>. Nunca pagues por adelantado a desconocidos.</div>
${prods.length ? '<div class="grid">' + cards + '</div>' : '<div class="vacio">Esta tienda aún no tiene productos publicados.</div>'}
<p class="leg">Novaterra es una herramienta para que vendedores publiquen y compradores se orienten. Los precios los pone el vendedor como referencia; Novaterra no vende, no interviene en los pagos y no garantiza los productos. · <a href="/privacidad" style="color:var(--acc)">Privacidad y términos</a></p>
</div></body></html>`;
}
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
function cargarArchivo() { try { const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); if (!d.precios) d.precios = []; if (!d.vitrina) d.vitrina = []; if (!d.config) d.config = {}; if (!d.consentimientos) d.consentimientos = []; return d; } catch (e) { return { usuarios: [], negocios: [], clientes: [], suscripciones: [], respaldos: [], precios: [], vitrina: [], config: {}, consentimientos: [] }; } }
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
  async agregarPrecio(p) {
    if (USA_SB) { const r = await sb('POST', 'precios', p); return r[0]; }
    if (!FILE.precios) FILE.precios = [];
    FILE.precios.push(p); salvarArchivo(); return p;
  },
  async preciosBase(cat) {
    if (USA_SB) { const f = cat ? ('&cat=eq.' + encodeURIComponent(cat)) : ''; return await sb('GET', 'precios?select=*' + f + '&order=fecha.desc&limit=3000'); }
    let a = (FILE.precios || []).slice();
    if (cat) a = a.filter(p => p.cat === cat);
    return a.sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
  },
  async crearProducto(p) {
    if (USA_SB) { const r = await sb('POST', 'vitrina', p); return r[0]; }
    if (!FILE.vitrina) FILE.vitrina = [];
    FILE.vitrina.push(p); salvarArchivo(); return p;
  },
  async vitrinaActivos(cat) {
    if (USA_SB) { const f = cat ? ('&cat=eq.' + encodeURIComponent(cat)) : ''; return await sb('GET', 'vitrina?select=*&estado=eq.activo' + f + '&order=fecha.desc&limit=500'); }
    let a = (FILE.vitrina || []).filter(p => p.estado === 'activo');
    if (cat) a = a.filter(p => p.cat === cat);
    return a.sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
  },
  async productoPorId(pid) {
    if (USA_SB) { const r = await sb('GET', 'vitrina?id=eq.' + encodeURIComponent(pid) + '&select=*'); return r[0] || null; }
    return (FILE.vitrina || []).find(p => p.id === pid) || null;
  },
  async misProductos(uid) {
    if (USA_SB) return await sb('GET', 'vitrina?usuario_id=eq.' + encodeURIComponent(uid) + '&select=*&order=fecha.desc');
    return (FILE.vitrina || []).filter(p => p.usuario_id === uid).sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
  },
  async actualizarProducto(pid, uid, patch) {
    if (USA_SB) { const r = await sb('PATCH', 'vitrina?id=eq.' + encodeURIComponent(pid) + '&usuario_id=eq.' + encodeURIComponent(uid), patch); return (r && r[0]) || null; }
    const p = (FILE.vitrina || []).find(x => x.id === pid && x.usuario_id === uid);
    if (p) { Object.assign(p, patch); salvarArchivo(); }
    return p || null;
  },
  async borrarProducto(pid, uid) {
    if (USA_SB) { await sb('DELETE', 'vitrina?id=eq.' + encodeURIComponent(pid) + '&usuario_id=eq.' + encodeURIComponent(uid)); return true; }
    const i = (FILE.vitrina || []).findIndex(x => x.id === pid && x.usuario_id === uid);
    if (i >= 0) { FILE.vitrina.splice(i, 1); salvarArchivo(); }
    return true;
  },
  async registrarConsentimiento(row) {
    if (USA_SB) { try { const r = await sb('POST', 'consentimientos', row); return r[0]; } catch (e) { return null; } }
    if (!FILE.consentimientos) FILE.consentimientos = [];
    FILE.consentimientos.push(row); salvarArchivo(); return row;
  },
  async consentimientos() {
    if (USA_SB) return await sb('GET', 'consentimientos?select=*&order=fecha.desc&limit=5000');
    return (FILE.consentimientos || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  },
  async getConfig(clave) {
    if (USA_SB) { try { const r = await sb('GET', 'config?clave=eq.' + encodeURIComponent(clave) + '&select=valor'); return (r[0] && r[0].valor) || null; } catch (e) { return null; } }
    return (FILE.config && FILE.config[clave]) || null;
  },
  async setConfig(clave, valor) {
    if (USA_SB) { await sb('POST', 'config', { clave, valor }, 'resolution=merge-duplicates,return=representation'); return; }
    if (!FILE.config) FILE.config = {};
    FILE.config[clave] = valor; salvarArchivo();
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

// ---------- Créditos de publicación (tarifa por publicar, accesible) ----------
const CREDITOS_GRATIS = 5; // publicaciones gratis al empezar, para que cualquiera arranque
function codigoCreditos(c) {
  c = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const m = /^PUB(\d)(\d)(\d)(\d)$/.exec(c); // PUB + 3 dígitos de cantidad + 1 verificador
  if (!m) return 0;
  const d = m.slice(1).map(Number);
  const chk = (d[0] * 2 + d[1] * 3 + d[2] * 4) % 10;
  if (chk !== d[3]) return 0;
  const n = d[0] * 100 + d[1] * 10 + d[2];
  return n > 0 ? n : 0;
}
async function getCreditos(uid) { const v = await datos.getConfig('creditos:' + uid); return (v === null || v === undefined) ? CREDITOS_GRATIS : (parseInt(v, 10) || 0); }
async function setCreditos(uid, n) { await datos.setConfig('creditos:' + uid, String(Math.max(0, n | 0))); }

// ---------- HTTP ----------
function enviar(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  res.end(JSON.stringify(obj));
}
function leerBody(req) { return new Promise((resolve) => { let d = ''; req.on('data', c => { d += c; if (d.length > 6e6) req.destroy(); }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } }); }); }
async function usuarioDe(req) { const t = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim(); const uid = verificarToken(t) || TOKENS[t]; return uid ? await datos.usuarioPorId(uid) : null; }
function ipDe(req) { return String((req.headers['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || '').trim().slice(0, 45); }
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
    return enviar(res, 200, { ok: true, servicio: 'Novaterra API', version: '1.9', almacen: USA_SB ? 'supabase' : 'archivo', usuarios: n });
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
    // Registrar el consentimiento: crear la cuenta implica aceptar los términos (la pantalla lo indica).
    try { await datos.registrarConsentimiento({ id: id('cs_'), usuario_id: u.id, email: u.email, version: TERMS_VERSION, origen: 'registro', ip: ipDe(req), fecha: new Date().toISOString() }); } catch (e) {}
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

  // ---------- Registro de consentimientos (solo el dueño, con ADMIN_KEY) ----------
  if (ruta === '/api/admin/consentimientos' && metodo === 'GET') {
    if (!ADMIN_KEY) return enviar(res, 503, { error: 'Falta configurar ADMIN_KEY en Render.' });
    if ((req.headers['x-admin-key'] || '') !== ADMIN_KEY) return enviar(res, 401, { error: 'Clave de administrador incorrecta.' });
    const lista = await datos.consentimientos();
    return enviar(res, 200, { total: lista.length, version_actual: TERMS_VERSION, consentimientos: lista });
  }

  // ---------- Generar código de créditos (solo el dueño, con ADMIN_KEY) ----------
  if (ruta === '/api/admin/codigo-creditos' && metodo === 'GET') {
    if (!ADMIN_KEY) return enviar(res, 503, { error: 'Falta configurar ADMIN_KEY en Render.' });
    if ((req.headers['x-admin-key'] || '') !== ADMIN_KEY) return enviar(res, 401, { error: 'Clave de administrador incorrecta.' });
    const n = Math.max(1, Math.min(999, parseInt(url.searchParams.get('n') || '20', 10) || 20));
    const d = [Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
    const chk = (d[0] * 2 + d[1] * 3 + d[2] * 4) % 10;
    return enviar(res, 200, { creditos: n, codigo: 'PUB' + d[0] + d[1] + d[2] + chk });
  }

  // ---------- Precios de mercado (público, sin sesión) ----------
  if (ruta === '/api/mercado' && metodo === 'GET') {
    const q = (url.searchParams.get('q') || '').trim();
    const catM = (url.searchParams.get('cat') || '').trim();
    if (!q) return enviar(res, 400, { error: 'Escribe qué quieres buscar.' });
    try {
      const r = await buscarMercado(q);
      // Alimentar el Índice Novaterra con el dato de MercadoLibre (1 vez por búsqueda/día, sin duplicar)
      try {
        if (r.resumen && r.resumen.n >= 2 && r.resumen.mediana > 0) {
          const clave = new Date().toISOString().slice(0, 10) + '|' + catM + '|' + norm(limpiaQ(q));
          if (!VISTO_INTERNET.has(clave)) {
            VISTO_INTERNET.add(clave);
            await datos.agregarPrecio({ id: id('pr_'), usuario_id: 'internet', cat: catM || 'otro', modelo: limpiaQ(q), ano: '', precio: Math.round(r.resumen.mediana), unidad: catM === 'oro' ? 'gramo' : '', ciudad: '', tipo: 'internet', fecha: new Date().toISOString() });
          }
        }
      } catch (e) {}
      return enviar(res, 200, r);
    }
    catch (e) { return enviar(res, 200, { q, fuente: 'error', items: [], resumen: null }); }
  }

  // ---------- Índice Novaterra: consultar (público) ----------
  if (ruta === '/api/precios' && metodo === 'GET') {
    const q = (url.searchParams.get('q') || '').trim();
    const cat = (url.searchParams.get('cat') || '').trim();
    if (!q) return enviar(res, 400, { error: 'Escribe qué quieres consultar.' });
    try { const base = await datos.preciosBase(cat); return enviar(res, 200, { q, cat, novaterra: indiceNovaterra(base, q) }); }
    catch (e) { return enviar(res, 200, { q, cat, novaterra: { n: 0 } }); }
  }

  // ---------- Vitrina: buscar publicaciones (público) ----------
  if (ruta === '/api/vitrina' && metodo === 'GET') {
    const q = (url.searchParams.get('q') || '').trim();
    const cat = (url.searchParams.get('cat') || '').trim();
    try {
      let lista = await datos.vitrinaActivos(cat);
      if (q) { const toks = norm(q).split(/\s+/).filter(Boolean); lista = lista.filter(p => { const txt = norm((p.modelo || '') + ' ' + (p.ano || '') + ' ' + (p.descripcion || '') + ' ' + (p.ciudad || '')); return toks.every(t => txt.indexOf(t) >= 0); }); }
      const items = lista.slice(0, 60).map(p => ({ id: p.id, cat: p.cat, modelo: p.modelo, ano: p.ano, precio: p.precio, ciudad: p.ciudad, img: p.img || '', descripcion: (p.descripcion || '').slice(0, 160), fecha: p.fecha }));
      return enviar(res, 200, { q, cat, items });
    } catch (e) { return enviar(res, 200, { q, cat, items: [] }); }
  }

  // ---------- Vitrina: página pública de un producto (para compartir) ----------
  const mProd = /^\/p\/([^/]+)$/.exec(ruta);
  if (mProd && metodo === 'GET') {
    try {
      const p = await datos.productoPorId(mProd[1]);
      const host = req.headers['host'] || 'novaterra-api.onrender.com';
      if (!p) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>Producto no encontrado</h1><p><a href="/vitrina">Ver la Vitrina Novaterra</a></p>'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(paginaProducto(p, host)); return;
    } catch (e) { res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>Error</h1>'); return; }
  }

  // ---------- Privacidad y términos ----------
  if ((ruta === '/privacidad' || ruta === '/terminos' || ruta === '/legal') && metodo === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(paginaLegal()); return;
  }

  // ---------- Registro de consentimientos: página del dueño ----------
  if ((ruta === '/panel-consentimientos' || ruta === '/consentimientos') && metodo === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(paginaConsentimientos()); return;
  }

  // ---------- Tienda del vendedor (página propia para compartir) ----------
  const mTienda = /^\/t\/([^/]+)$/.exec(ruta);
  if (mTienda && metodo === 'GET') {
    try {
      const host = req.headers['host'] || 'novaterra-api.onrender.com';
      let handle = decodeURIComponent(mTienda[1]);
      let uid = /^u_/.test(handle) ? handle : await datos.getConfig('slug:' + handle);
      let t = uid ? await datos.getConfig('tienda:' + uid) : null;
      if (!uid || !t) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>Tienda no encontrada</h1><p><a href="/vitrina">Ver la Vitrina Novaterra</a></p>'); return; }
      t = JSON.parse(t);
      const usr = await datos.usuarioPorId(uid).catch(() => null);
      t.desde = usr ? usr.creado : null;
      const prods = (await datos.misProductos(uid)).filter(p => p.estado === 'activo');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(tiendaHTML(t, prods, host)); return;
    } catch (e) { res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>Error</h1>'); return; }
  }

  // ---------- Imagen de un producto con URL real (para Google y previews) ----------
  const mImg = /^\/img\/([^/]+)$/.exec(ruta);
  if (mImg && metodo === 'GET') {
    try {
      const p = await datos.productoPorId(mImg[1]);
      const m = p && p.img && /^data:(image\/[a-z]+);base64,(.+)$/s.exec(p.img);
      if (!m) { res.writeHead(404); res.end(); return; }
      const buf = Buffer.from(m[2], 'base64');
      res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' });
      res.end(buf); return;
    } catch (e) { res.writeHead(404); res.end(); return; }
  }

  // ---------- Vitrina pública navegable (catálogo que Google recorre) ----------
  if (ruta === '/vitrina' && metodo === 'GET') {
    try {
      const q = (url.searchParams.get('q') || '').trim();
      const cat = (url.searchParams.get('cat') || '').trim();
      const host = req.headers['host'] || 'novaterra-api.onrender.com';
      let lista = await datos.vitrinaActivos(cat);
      if (q) { const toks = norm(q).split(/\s+/).filter(Boolean); lista = lista.filter(p => { const txt = norm((p.modelo || '') + ' ' + (p.ano || '') + ' ' + (p.descripcion || '') + ' ' + (p.ciudad || '')); return toks.every(t => txt.indexOf(t) >= 0); }); }
      let base = []; try { base = await datos.preciosBase(''); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(catalogoHTML(lista.slice(0, 120), q, cat, host, base)); return;
    } catch (e) { res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>Error</h1>'); return; }
  }

  // ---------- robots.txt y sitemap.xml (para que Google indexe) ----------
  if (ruta === '/robots.txt' && metodo === 'GET') {
    const host = req.headers['host'] || 'novaterra-api.onrender.com';
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://' + host + '/sitemap.xml\n'); return;
  }
  if (ruta === '/sitemap.xml' && metodo === 'GET') {
    try {
      const host = req.headers['host'] || 'novaterra-api.onrender.com';
      const lista = await datos.vitrinaActivos('');
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      xml += '<url><loc>https://' + host + '/vitrina</loc><changefreq>daily</changefreq></url>\n';
      lista.slice(0, 5000).forEach(p => { xml += '<url><loc>https://' + host + '/p/' + p.id + '</loc>' + (p.fecha ? '<lastmod>' + String(p.fecha).slice(0, 10) + '</lastmod>' : '') + '</url>\n'; });
      xml += '</urlset>\n';
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(xml); return;
    } catch (e) { res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' }); res.end('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'); return; }
  }

  // ---------- Conectar MercadoLibre (OAuth, una sola vez) ----------
  function mlPagina(titulo, cuerpo) { return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + ' | Novaterra</title><body style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:0 18px;line-height:1.5;color:#13241d"><h1 style="color:#1f8d63">🌱 Novaterra</h1>' + cuerpo + '</body>'; }
  if (ruta === '/ml/conectar' && metodo === 'GET') {
    const host = req.headers['host'] || 'novaterra-api.onrender.com';
    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(mlPagina('Conectar MercadoLibre', '<p>Primero agrega en Render las variables <b>ML_CLIENT_ID</b> y <b>ML_CLIENT_SECRET</b> (de tu app de desarrollador de MercadoLibre) y vuelve a entrar aquí.</p>')); return; }
    const redirect = 'https://' + host + '/ml/callback';
    const auth = 'https://auth.mercadolibre.com.co/authorization?response_type=code&client_id=' + encodeURIComponent(ML_CLIENT_ID) + '&redirect_uri=' + encodeURIComponent(redirect);
    res.writeHead(302, { Location: auth }); res.end(); return;
  }
  if (ruta === '/ml/callback' && metodo === 'GET') {
    const host = req.headers['host'] || 'novaterra-api.onrender.com';
    const code = url.searchParams.get('code') || '';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (!code) { res.end(mlPagina('MercadoLibre', '<p>❌ No llegó el código de MercadoLibre. Intenta de nuevo desde <a href="/ml/conectar">/ml/conectar</a>.</p>')); return; }
    try {
      const redirect = 'https://' + host + '/ml/callback';
      const d = await mlTokenFetch({ grant_type: 'authorization_code', client_id: ML_CLIENT_ID, client_secret: ML_CLIENT_SECRET, code, redirect_uri: redirect });
      await mlGuardar(d);
      res.end(mlPagina('¡Conectado!', '<p style="font-size:18px">✅ <b>MercadoLibre conectado.</b></p><p>Tu Índice Novaterra ya se alimenta solo con los precios de MercadoLibre, y la conexión se renueva automáticamente. Puedes cerrar esta página.</p>'));
    } catch (e) { res.end(mlPagina('Error', '<p>❌ No se pudo conectar: ' + escH(String(e.message || e)) + '</p><p>Revisa que el <b>Redirect URI</b> de tu app en MercadoLibre sea exactamente:<br><code>https://' + escH(host) + '/ml/callback</code></p><p><a href="/ml/conectar">Reintentar</a></p>')); }
    return;
  }
  if (ruta === '/ml/estado' && metodo === 'GET') {
    const t = await mlLeer();
    return enviar(res, 200, { configurado: !!(ML_CLIENT_ID && ML_CLIENT_SECRET), conectado: !!(t && t.refresh_token), expira: t ? t.expira : null, token_manual: !!ML_TOKEN });
  }

  const u = await usuarioDe(req);
  if (ruta.startsWith('/api/') && !u) return enviar(res, 401, { error: 'Inicia sesión.' });

  if (ruta === '/api/yo' && metodo === 'GET') return enviar(res, 200, { usuario: pub(u), suscripcion: susInfo(await datos.suscripcionDe(u.id)) });

  // ---------- Créditos de publicación ----------
  if (ruta === '/api/creditos' && metodo === 'GET') {
    return enviar(res, 200, { creditos: await getCreditos(u.id) });
  }
  if (ruta === '/api/creditos/activar' && metodo === 'POST') {
    const b = await leerBody(req);
    const n = codigoCreditos(b.codigo);
    if (!n) return enviar(res, 400, { error: 'Ese código de créditos no es válido.' });
    const nuevo = (await getCreditos(u.id)) + n;
    await setCreditos(u.id, nuevo);
    return enviar(res, 200, { ok: true, agregados: n, creditos: nuevo });
  }

  // ---------- Consentimiento de términos (usuario con sesión) ----------
  if (ruta === '/api/consentimiento' && metodo === 'POST') {
    const b = await leerBody(req);
    try { await datos.registrarConsentimiento({ id: id('cs_'), usuario_id: u.id, email: u.email, version: String(b.version || TERMS_VERSION).slice(0, 20), origen: 'app', ip: ipDe(req), fecha: new Date().toISOString() }); } catch (e) {}
    return enviar(res, 200, { ok: true });
  }

  // ---------- Tienda del vendedor: leer y guardar (con sesión) ----------
  if (ruta === '/api/tienda/mia' && metodo === 'GET') {
    const host = req.headers['host'] || 'novaterra-api.onrender.com';
    const raw = await datos.getConfig('tienda:' + u.id);
    const t = raw ? JSON.parse(raw) : null;
    const link = t && t.slug ? ('https://' + host + '/t/' + t.slug) : ('https://' + host + '/t/' + u.id);
    return enviar(res, 200, { tienda: t, link });
  }
  if (ruta === '/api/tienda' && metodo === 'POST') {
    const b = await leerBody(req);
    const host = req.headers['host'] || 'novaterra-api.onrender.com';
    const nombre = String(b.nombre || '').trim().slice(0, 60);
    if (!nombre) return enviar(res, 400, { error: 'Ponle un nombre a tu tienda.' });
    let slug = slugify(b.slug || nombre);
    if (!slug) slug = 'tienda-' + u.id.slice(-6);
    // si el slug ya lo tiene otro usuario, hacerlo único
    const dueno = await datos.getConfig('slug:' + slug);
    if (dueno && dueno !== u.id) slug = slug + '-' + u.id.slice(-4);
    // borrar mapeo de slug anterior si cambió
    const prev = await datos.getConfig('tienda:' + u.id);
    if (prev) { try { const pj = JSON.parse(prev); if (pj.slug && pj.slug !== slug) await datos.setConfig('slug:' + pj.slug, ''); } catch (e) {} }
    const t = { nombre, slug, ciudad: String(b.ciudad || '').trim().slice(0, 40), tel: String(b.tel || '').replace(/[^\d]/g, '').slice(0, 15), desc: String(b.desc || '').trim().slice(0, 200) };
    await datos.setConfig('tienda:' + u.id, JSON.stringify(t));
    await datos.setConfig('slug:' + slug, u.id);
    return enviar(res, 200, { ok: true, link: 'https://' + host + '/t/' + slug });
  }

  // ---------- Índice Novaterra: aportar un precio (con sesión) ----------
  if (ruta === '/api/precios' && metodo === 'POST') {
    const b = await leerBody(req);
    const precio = Math.round(+b.precio || 0);
    const modelo = String(b.modelo || '').trim();
    if (!modelo || !(precio > 0)) return enviar(res, 400, { error: 'Faltan el modelo o el precio.' });
    const row = { id: id('pr_'), usuario_id: u.id, cat: String(b.cat || 'otro').slice(0, 20), modelo: modelo.slice(0, 80), ano: String(b.ano || '').slice(0, 8), precio, unidad: String(b.unidad || '').slice(0, 20), ciudad: String(b.ciudad || '').trim().slice(0, 40), tipo: String(b.tipo || '').slice(0, 12), fecha: new Date().toISOString() };
    await datos.agregarPrecio(row);
    return enviar(res, 200, { ok: true });
  }

  // ---------- Vitrina: publicar un producto (con sesión) ----------
  if (ruta === '/api/vitrina' && metodo === 'POST') {
    const b = await leerBody(req);
    const precio = Math.round(+b.precio || 0);
    const modelo = String(b.modelo || '').trim();
    if (!modelo || !(precio > 0)) return enviar(res, 400, { error: 'Faltan el título o el precio.' });
    let img = String(b.img || '');
    if (img && !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(img)) img = '';
    if (img.length > 2500000) return enviar(res, 400, { error: 'La foto es muy pesada. Usa una más liviana.' });
    // Tarifa de publicación: cada publicación cuesta 1 crédito (los primeros son gratis)
    const cred = await getCreditos(u.id);
    if (cred < 1) return enviar(res, 402, { error: 'Se te acabaron las publicaciones. Activa un código de créditos para seguir publicando.', sin_creditos: true, creditos: 0 });
    const pid = id('v_');
    const row = { id: pid, usuario_id: u.id, cat: String(b.cat || 'otro').slice(0, 20), modelo: modelo.slice(0, 80), ano: String(b.ano || '').slice(0, 8), precio, descripcion: String(b.descripcion || '').slice(0, 600), ciudad: String(b.ciudad || '').trim().slice(0, 40), telefono: String(b.telefono || '').replace(/[^\d]/g, '').slice(0, 15), img, estado: 'activo', fecha: new Date().toISOString() };
    await datos.crearProducto(row);
    await setCreditos(u.id, cred - 1); // descontar 1 crédito
    // Publicar un producto también alimenta el Índice (precio pedido)
    try { await datos.agregarPrecio({ id: id('pr_'), usuario_id: u.id, cat: row.cat, modelo: row.modelo, ano: row.ano, precio, unidad: row.cat === 'oro' ? 'gramo' : '', ciudad: row.ciudad, tipo: 'pedido', fecha: row.fecha }); } catch (e) {}
    return enviar(res, 200, { ok: true, id: pid, creditos: cred - 1 });
  }

  // ---------- Vitrina: mis publicaciones ----------
  if (ruta === '/api/vitrina/mias' && metodo === 'GET') {
    const lista = await datos.misProductos(u.id);
    return enviar(res, 200, { items: lista.map(p => ({ id: p.id, cat: p.cat, modelo: p.modelo, ano: p.ano, precio: p.precio, ciudad: p.ciudad, img: p.img || '', estado: p.estado, fecha: p.fecha })) });
  }

  // ---------- Vitrina: cambiar estado o borrar ----------
  if (ruta === '/api/vitrina/estado' && metodo === 'POST') {
    const b = await leerBody(req);
    if (!b.id) return enviar(res, 400, { error: 'Falta el producto.' });
    if (b.borrar) { await datos.borrarProducto(String(b.id), u.id); return enviar(res, 200, { ok: true, borrado: true }); }
    const estado = (b.estado === 'vendido') ? 'vendido' : 'activo';
    await datos.actualizarProducto(String(b.id), u.id, { estado });
    return enviar(res, 200, { ok: true, estado });
  }

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
