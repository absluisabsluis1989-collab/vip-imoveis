/*! shared/lead-adapter.js — envio de lead conforme contrato CRM v0.1.
 * window.LEAD_CONFIG = {
 *   site: "vip" | "lastro",
 *   adapter: "auto" | "http-json" | "localstorage" | "custom",
 *      auto = http-json se houver endpoint, senão localstorage (vip_leads)
 *   endpoint: "/api/leads",
 *   fallbackToLocal: true,   // se o POST falhar, grava em vip_leads
 *   send: function(lead){ return Promise }  // custom
 * }
 * API: LeadAdapter.buildLead(fields) / LeadAdapter.submit(fields) -> Promise<{ok, mode, id, dedup}>
 */
(function (w) {
  var LS_KEY = "vip_leads";
  function cfg(){ return w.LEAD_CONFIG || {}; }
  function normPhone(v){ var x=String(v||"").replace(/\D/g,""); if(x.length>=12 && x.indexOf("55")===0) x=x.slice(2); if(x.length===11||x.length===10) return x; return x.replace(/^0+/,""); }
  function normEmail(v){ return String(v||"").trim().toLowerCase(); }
  function toBool(v){ return v===true||v==="on"||v==="true"||v==="1"; }
  function attribution(){
    var T = w.VIPTracking || w.Tracking || w.tracking;
    if (!T) return {};
    var fn = T.getAttribution || T.get || T.getFirstTouch;
    var a = fn ? fn.call(T) : null;
    if (a && !a.first && (a.ts || a.landing)) a = { first: a, paid: a.canal==="pago"?a:null, last: a };
    return a || {};
  }
  function buildLead(f){
    var c = cfg(), a = attribution();
    var flat = a.paid || a.first || {};
    var lead = {
      site: c.site,
      nome: String(f.nome||"").trim(),
      telefone: normPhone(f.telefone),
      email: normEmail(f.email),
      interesse: f.interesse || "",
      condominio_atual: String(f.condominio_atual||"").trim(),
      horario: f.horario || "",
      imovel_id: f.imovel_id || "",
      canal_entrada: f.canal_entrada || "formulario",
      pagina: f.pagina || w.location.pathname,
      consentimento_lgpd: toBool(f.consentimento_lgpd),
      criado_em: new Date().toISOString(),
      visitor_id: a.vid || a.visitor_id || "",
      origem_primeiro_toque: a.first || null,
      origem_paga: a.paid || null,
      origem_ultimo_toque: a.last || null,
      veio_de_publicidade: !!(a.paid || (a.first && a.first.canal==="pago") || (a.last && a.last.canal==="pago")),
      utm_source: flat.utm_source || "", utm_medium: flat.utm_medium || "", utm_campaign: flat.utm_campaign || "",
      gclid: flat.gclid || "", fbclid: flat.fbclid || ""
    };
    if (f.mensagem) lead.mensagem = String(f.mensagem).trim().slice(0, 2000); // contrato v0.2: opcional, até 2000
    return lead;
  }
  function validate(l){
    var e=[]; if(!l.site) e.push("site"); if(!l.nome) e.push("nome");
    if(!l.telefone && !l.email) e.push("telefone|email"); if(!l.interesse) e.push("interesse");
    if(!l.consentimento_lgpd) e.push("consentimento_lgpd"); return e;
  }
  function saveLocal(l){
    var arr=[]; try{arr=JSON.parse(w.localStorage.getItem(LS_KEY)||"[]");}catch(e){}
    var dup = arr.some(function(x){ return (l.telefone && x.telefone===l.telefone) || (l.email && x.email===l.email); });
    l.id = l.id || ("local-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7));
    arr.push(l); w.localStorage.setItem(LS_KEY, JSON.stringify(arr));
    return { ok:true, mode:"localstorage", id:l.id, dedup:dup };
  }
  function postJson(l){
    var c=cfg();
    return fetch(c.endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(l) })
      .then(function(r){ if(r.status!==201 && !r.ok) throw new Error("HTTP "+r.status); return r.json().catch(function(){return {};}); })
      .then(function(j){ return { ok:true, mode:"http-json", id:j.id, dedup:!!j.dedup }; })
      .catch(function(err){ if(c.fallbackToLocal!==false) return saveLocal(l); throw err; });
  }
  w.LeadAdapter = {
    buildLead: buildLead, buildPayload: buildLead, normPhone: normPhone,
    submit: function(fields){
      var l = buildLead(fields), errs = validate(l), c = cfg();
      if (errs.length) return Promise.reject(new Error("campos obrigatórios: "+errs.join(", ")));
      var mode = c.adapter || "auto";
      if (mode==="auto") mode = c.endpoint ? "http-json" : "localstorage";
      if (mode==="http-json") return c.endpoint ? postJson(l) : Promise.resolve(saveLocal(l));
      if (mode==="custom" && typeof c.send==="function") return Promise.resolve(c.send(l)).then(function(r){ return Object.assign({ok:true,mode:"custom"}, r||{}); });
      return Promise.resolve(saveLocal(l));
    }
  };
})(window);
