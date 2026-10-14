/*! shared/tracking.js — atribuição (contrato CRM v0.1). Genérico p/ VIP e Lastro.
 * Config opcional antes de carregar: window.TRACKING_CONFIG = { storageKey, cookieDays }
 * Guarda { vid, first, paid, last } em localStorage + cookie 1st-party.
 *  - first: 1ª visita — NUNCA sobrescrito
 *  - paid : 1º toque pago — NUNCA sobrescrito (null até existir)
 *  - last : último toque — atualizado a cada carregamento
 * API: window.VIPTracking.getAttribution() / get() / getFirstTouch()  (alias: window.SiteTracking, window.Tracking)
 */
(function (w, d) {
  var cfg = w.TRACKING_CONFIG || {};
  var K = cfg.storageKey || "site_attr_v1";
  var DAYS = cfg.cookieDays || 180;
  var PARAMS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid","gbraid","wbraid"];
  function cookie(n){var m=d.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):null;}
  function load(){
    var a=null,b=null;
    try{a=JSON.parse(w.localStorage.getItem(K)||"null");}catch(e){}
    try{b=JSON.parse(cookie(K)||"null");}catch(e){}
    if(!a) return b; if(!b) return a;
    // se divergirem, preserva o mais antigo para first/paid (nunca perde)
    var r={vid:a.vid||b.vid,last:a.last||b.last};
    r.first=[a.first,b.first].filter(Boolean).sort(function(x,y){return x.ts<y.ts?-1:1})[0]||null;
    r.paid=[a.paid,b.paid].filter(Boolean).sort(function(x,y){return x.ts<y.ts?-1:1})[0]||null;
    return r;
  }
  function save(s){var j=JSON.stringify(s);try{w.localStorage.setItem(K,j);}catch(e){}
    d.cookie=K+"="+encodeURIComponent(j)+"; max-age="+(DAYS*86400)+"; path=/; SameSite=Lax";}
  function uuid(){ if(w.crypto&&crypto.randomUUID) return crypto.randomUUID();
    return "v-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10); }
  function isPaid(t){ return !!(t.gclid||t.fbclid||t.gbraid||t.wbraid||/cpc|ppc|paid|ads|cpm/i.test(t.utm_medium||"")); }
  function sameSiteRef(r){ try{return r && new URL(r).hostname===w.location.hostname;}catch(e){return false;} }
  function buildTouch(){
    var q=new URLSearchParams(w.location.search), t={};
    PARAMS.forEach(function(k){var v=q.get(k); if(v) t[k]=v;});
    var now=Date.now();
    t.fbc = cookie("_fbc") || (t.fbclid ? "fb.1."+now+"."+t.fbclid : undefined);
    t.fbp = cookie("_fbp") || undefined;
    t.landing = w.location.pathname + w.location.search;
    t.referrer = d.referrer || "";
    t.ts = new Date(now).toISOString();
    t.canal = isPaid(t) ? "pago" : t.utm_source ? "campanha" : (t.referrer && !sameSiteRef(t.referrer)) ? "referencia" : "direto";
    return t;
  }
  var s = load() || {};
  var t = buildTouch();
  var internalNav = sameSiteRef(t.referrer) && t.canal === "direto";
  if (!s.vid) s.vid = uuid();
  if (!s.first) s.first = t;                         // imutável
  if (!s.paid && t.canal === "pago") s.paid = t;     // imutável depois de gravado
  if (!internalNav || !s.last) s.last = t;           // navegação interna não apaga a origem do último toque
  if (s.paid === undefined) s.paid = null;
  save(s);

  function clone(o){ return o ? JSON.parse(JSON.stringify(o)) : o; }
  var api = {
    storageKey: K,
    getAttribution: function(){ var c=load()||s; return { vid:c.vid, visitor_id:c.vid, first:clone(c.first), paid:clone(c.paid)||null, last:clone(c.last) }; },
    getFirstTouch: function(){ return clone((load()||s).first); },
    isPaid: isPaid
  };
  api.get = api.getAttribution;
  api.firstTouch = api.getFirstTouch; // compat
  w.VIPTracking = api; w.SiteTracking = api; if (!w.Tracking) w.Tracking = api;
})(window, document);
