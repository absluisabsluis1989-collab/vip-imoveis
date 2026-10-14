// Config compartilhada – carregar ANTES de /shared/tracking.js e /shared/lead-adapter.js
window.TRACKING_CONFIG={storageKey:'vip_attr_v1',cookieDays:180};
// custom: grava no CRM local (dedup + merge de origem) e, se houver endpoint, envia também ao POST /api/leads
window.LEAD_CONFIG={site:'vip',adapter:'custom',endpoint:null,send(lead){const l=leadFromContract(lead);
 if(this.endpoint)fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)}).catch(()=>{});
 return {id:l.id,dedup:l.historico.length>1}}};
