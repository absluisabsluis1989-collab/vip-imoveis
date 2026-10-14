// ===== VIP – núcleo compartilhado: atribuição, dados, layout =====
const VIP={WPP:"5563999577007",IG:"vipimobiliariato",IG_LASTRO:"lastroengenhariato"};
const BASE=location.pathname.includes('/admin/')?'../':'';
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const normTel=t=>(t||'').replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
const normMail=e=>(e||'').trim().toLowerCase();

// ---------- Atribuição ----------
// Fonte única: /shared/tracking.js (window.VIPTracking, chave vip_attr_v1 em js/config.js). Sem tracker próprio.
const isPaidTouch=t=>!!(t&&(t.canal==='pago'||t.gclid||t.fbclid||t.gbraid||t.wbraid||/cpc|ppc|paid|ads|cpm/i.test(t.utm_medium||'')));
const Attr={get(){const T=window.VIPTracking;return T?T.getAttribution():null}};

// Mescla origem: preserva primeiro toque e qualquer toque pago já existente
function mergeOrigem(atual,nova){
 if(!atual)return nova; if(!nova)return atual;
 return {vid:atual.vid||nova.vid,first:atual.first||nova.first,paid:atual.paid||nova.paid||null,last:nova.last||atual.last,
  veio_de_publicidade:!!(atual.paid||nova.paid)};
}

// ---------- Dados ----------
async function getImoveis(){
 const V='2026-10-14b';const loc=LS.get('vip_imoveis',null); if(loc&&LS.get('vip_imoveis_v','')===V) return loc;
 const r=await fetch(BASE+'data/imoveis.json');const d=await r.json();LS.set('vip_imoveis',d);LS.set('vip_imoveis_v',V);return d;
}
function getLeads(){return LS.get('vip_leads',[])}
function setLeads(l){LS.set('vip_leads',l)}
// Salva/atualiza lead; casa por telefone/e-mail e preserva origem paga
// Converte lead do contrato (LeadAdapter.buildLead) para o modelo do CRM local
function leadFromContract(c){const {origem_primeiro_toque:first,origem_paga:paid,origem_ultimo_toque:last,visitor_id:vid,...d}=c;d.imovel=c.imovel_id;d.via=(c.canal_entrada||'formulario')+' '+(c.pagina||'');return upsertLead(d,{vid,first,paid,last})}
function upsertLead(dados,origem){dados={...dados};if(dados.telefone)dados.telefone=normTel(dados.telefone);if(dados.email)dados.email=normMail(dados.email);
 const leads=getLeads(),tel=normTel(dados.telefone),mail=normMail(dados.email);
 let l=leads.find(x=>(tel&&normTel(x.telefone)===tel)||(mail&&normMail(x.email)===mail));
 const org={vid:origem?.vid,first:origem?.first,paid:origem?.paid||null,last:origem?.last,veio_de_publicidade:!!origem?.paid};
 if(l){Object.assign(l,{...dados,etapa:l.etapa});l.origem=mergeOrigem(l.origem,org);l.historico.push({ts:new Date().toISOString(),txt:'Novo contato: '+(dados.via||'site')})}
 else{l={id:uid(),criado:new Date().toISOString(),etapa:'Novo',...dados,origem:org,historico:[{ts:new Date().toISOString(),txt:'Lead criado via '+(dados.via||'site')}]};leads.push(l)}
 setLeads(leads);return l;
}

// ---------- Layout ----------
const fmtM2=n=>n?String(n).replace('.',',')+' m²':'–';
const WPP_MSG=p=>`Olá! Vi o site e quero saber mais sobre ${p||'os imóveis da VIP'}.`;
function wppLink(msg){return 'https://wa.me/'+VIP.WPP+'?text='+encodeURIComponent(msg||WPP_MSG(document.body.dataset.pagina))}
const IGI='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
const WAI='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';
function layout(){
 const igUrl='https://instagram.com/'+VIP.IG;
 document.body.insertAdjacentHTML('afterbegin',`<header id="hd"><a class="brand" href="${BASE}index.html" aria-label="VIP Serviços e Negócios Imobiliários"><img class="lg-light" src="${BASE}img/vip-full-light.png" alt="VIP"><img class="lg-dark" src="${BASE}img/vip-full.png" alt=""></a>
 <nav id="nav"><a href="${BASE}imoveis.html">Imóveis</a><a href="${BASE}sobre.html#consultoria">Consultoria</a><a href="${BASE}index.html#vendidos">Vendidos</a><a href="${BASE}sobre.html">Sobre</a><a href="${BASE}contato.html">Contato</a><a class="nav-wpp btn" href="#" data-wpp>Falar no WhatsApp</a></nav>
 <a class="ig" href="${igUrl}" target="_blank" aria-label="Instagram">${IGI}</a><a class="btn hd-wpp" href="#" data-wpp>Falar no WhatsApp</a><button id="burger" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button></header>`);
 document.body.insertAdjacentHTML('beforeend',`<footer class="ft"><div class="ft-in"><div class="ft-logo"><img src="${BASE}img/vip-full-light.png" alt="VIP Serviços e Negócios Imobiliários"></div>
 <div class="ft-lastro"><small>Construção: Lastro Engenharia</small><img src="${BASE}img/lastro-full-light.png" alt="Lastro Engenharia"></div>
 <div class="ft-info"><p>Palmas – TO</p><p><a href="${igUrl}" target="_blank">${IGI} @${VIP.IG}</a></p><p><a href="${BASE}admin/index.html">🔒 Área restrita</a></p></div></div>
 <p class="ft-legal">VIP Serviços e Negócios Imobiliários Ltda · CNPJ 34.658.342/0001-15 · CRECI J-5460</p></footer>
 <a class="wpp" href="#" data-wpp aria-label="WhatsApp">${WAI}<span>WhatsApp</span></a>`);
 if(!document.querySelector('link[rel=icon]'))document.head.insertAdjacentHTML('beforeend',`<link rel="icon" type="image/png" href="${BASE}img/favicon.png">`);
 document.querySelectorAll('[data-wpp]').forEach(a=>{a.href=wppLink();a.target='_blank';a.addEventListener('click',trackWpp)});
 const hd=document.getElementById('hd'),on=()=>hd.classList.toggle('scrolled',scrollY>30||!document.querySelector('.hero'));on();addEventListener('scroll',on,{passive:true});
 const b=document.getElementById('burger');b.onclick=()=>{const o=document.body.classList.toggle('menu-open');b.setAttribute('aria-expanded',o)};
 document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));
}
// Clique no WhatsApp leva a origem junto (registro local + evento para o CRM)
function trackWpp(){const v=LS.get('vip_wpp_clicks',[]);v.push({ts:new Date().toISOString(),site:'vip',pagina:location.pathname,mensagem:WPP_MSG(document.body.dataset.pagina),attr:Attr.get()});LS.set('vip_wpp_clicks',v)}
function setWpp(nome){document.body.dataset.pagina=nome;document.querySelectorAll('[data-wpp]').forEach(a=>a.href=wppLink())}

// ---------- Motion: reveal com stagger (respeita prefers-reduced-motion) ----------
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
function reveal(root=document){
 const els=root.querySelectorAll('.rv:not(.in)');
 if(REDUCED||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
 const io=reveal.io||(reveal.io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.12}));
 els.forEach(e=>{const g=e.closest('[data-stagger]');if(g){const i=[...g.querySelectorAll(':scope .rv')].indexOf(e);e.style.transitionDelay=Math.min(i,6)*90+'ms'}io.observe(e)});
}
function heroVideo(){const v=document.querySelector('.hero video');if(!v)return;
 if(REDUCED){v.removeAttribute('autoplay');v.pause();return}
 const srcs=v.querySelectorAll('source');let fails=0;srcs.forEach(s=>s.addEventListener('error',()=>{if(++fails===srcs.length)v.classList.add('no-video')}));
 v.play?.().catch(()=>{});}
// ---------- Carrossel scroll-snap com pontos ----------
function carousels(){document.querySelectorAll('[data-carousel]').forEach(c=>{const track=c.querySelector('.track'),dots=c.querySelector('.dots');if(!track||!dots)return;
 const n=track.children.length;dots.innerHTML=[...Array(n)].map((_,i)=>`<button aria-label="Ir para ${i+1}"></button>`).join('');
 const upd=()=>{const w=track.children[0]?.offsetWidth||1;const i=Math.round(track.scrollLeft/(w+16));[...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i))};
 track.addEventListener('scroll',upd,{passive:true});[...dots.children].forEach((d,i)=>d.onclick=()=>track.children[i].scrollIntoView({behavior:REDUCED?'auto':'smooth',inline:'start',block:'nearest'}));upd();
 c.querySelectorAll('.arr').forEach(a=>a.onclick=()=>track.scrollBy({left:(a.dataset.dir==='1'?1:-1)*track.clientWidth*.8,behavior:REDUCED?'auto':'smooth'}));})}
// ---------- Dropdown estilizado (não usa o select nativo) ----------
function dd(name,label,opts,val=''){return `<div class="dd" data-name="${name}"><input type="hidden" name="${name}" value="${val}"><button type="button" class="dd-btn" aria-haspopup="listbox"><span class="dd-l">${label}</span><span class="dd-v">${(opts.find(o=>o[0]===val)||['', 'Selecione'])[1]}</span></button><ul class="dd-list" role="listbox">${opts.map(o=>`<li role="option" data-v="${o[0]}">${o[1]}</li>`).join('')}</ul></div>`}
function expandDD(){document.querySelectorAll('span[data-dd]').forEach(e=>{const a=Function('OPT','return ['+"'"+e.dataset.dd+']')(OPT);e.outerHTML=dd(...a)})}
function bindDD(root=document){root.querySelectorAll('.dd').forEach(d=>{if(d.bound)return;d.bound=1;const b=d.querySelector('.dd-btn'),inp=d.querySelector('input');
 b.onclick=e=>{e.stopPropagation();document.querySelectorAll('.dd.open').forEach(x=>x!==d&&x.classList.remove('open'));d.classList.toggle('open')};
 d.querySelectorAll('li').forEach(li=>li.onclick=()=>{inp.value=li.dataset.v;d.querySelector('.dd-v').textContent=li.dataset.v?li.textContent:'Selecione';d.classList.remove('open');inp.dispatchEvent(new Event('change',{bubbles:true}))})});
 if(!bindDD.g){bindDD.g=1;document.addEventListener('click',()=>document.querySelectorAll('.dd.open').forEach(x=>x.classList.remove('open')))}}
const OPT={tipo:[['','Todos'],['Casa','Casa'],['Sobrado','Sobrado'],['Apartamento','Apartamento'],['Lote','Lote']],local:[['','Todos'],['condominio','Condomínio'],['rua','Rua']],
 condominio:[['','Todos'],['Mirante do Lago','Mirante do Lago'],['Polinésia','Polinésia'],['Alphaville I','Alphaville I'],['Alphaville II','Alphaville II']],suites:[['','Todas'],['2','2 ou mais'],['3','3 ou mais'],['4','4 ou mais']]};

// ---------- Cartões ----------
function hrefImovel(i){return i.id==='casa-pitangueira'?BASE+'casa-pitangueira.html':BASE+'imovel.html?id='+i.id}
function cardHTML(i,foto){const vend=i.status==='vendido';
 const sel=(i.destaque?'<span class="selo">Destaque</span>':'')+(vend?'<span class="selo vend">VENDIDA</span>':'');
 const img=foto||i.fotos?.[0];
 return `<a class="card rv" href="${hrefImovel(i)}">${sel}<div class="ph">${img?`<img src="${BASE}${img}" alt="${i.titulo}" loading="lazy">`:'<span>Foto em breve</span>'}</div><div class="info"><h3>${i.titulo}</h3><div class="meta"><span>📍 ${i.local==='rua'?'Rua':i.condominio}</span><span>${fmtM2(i.area_averbada)}</span><span>${i.suites} suítes</span></div></div></a>`}
function vagaCard(){return `<div class="card vaga rv"><div class="ph"><span>Espaço para o próximo imóvel</span></div><div class="info"><h3>Em breve</h3><div class="meta"><span>Novos imóveis chegando</span></div></div></div>`}

// ---------- Formulário padrão (brief Picsart) ----------
function formHTML(imovel,titulo){return `<form id="leadForm" class="lead-form" novalidate><input type="hidden" name="imovel_id" value="${imovel||''}">
<input name="nome" placeholder="Nome" aria-label="Nome" required autocomplete="name">
<input name="telefone" type="tel" inputmode="tel" placeholder="WhatsApp" aria-label="WhatsApp" required autocomplete="tel">
<input name="condominio_atual" placeholder="Em qual condomínio mora hoje?" aria-label="Em qual condomínio mora hoje?">
<fieldset class="pills"><legend>Interesse</legend>${[['Comprar pronto','Comprar pronto'],['Construir','Construir'],['Só conhecer','Só conhecer'],['Vender meu imóvel','Vender']].map(o=>`<label><input type="radio" name="interesse" value="${o[0]}" required><span>${o[1]}</span></label>`).join('')}</fieldset>
${dd('horario','Melhor horário',[['Manhã','Manhã'],['Tarde','Tarde'],['Noite','Noite']])}
<label class="lgpd"><input type="checkbox" name="consentimento_lgpd" value="true" required> <span>Concordo em ser contatado e com o uso dos meus dados conforme a LGPD.</span></label>
<p class="err" hidden></p><button class="btn">${titulo||'Enviar'}</button></form>`}
function bindForm(){const f=document.getElementById('leadForm');if(!f)return;bindDD(f);f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f)),er=f.querySelector('.err');
 const falta=[!d.nome&&'nome',!d.telefone&&'WhatsApp',!d.interesse&&'interesse',!d.consentimento_lgpd&&'concordar com a LGPD'].filter(Boolean);
 if(falta.length){er.hidden=false;er.textContent='Falta: '+falta.join(', ')+'.';return}
 LeadAdapter.submit(d).then(()=>{f.outerHTML='<div class="ok">Recebemos seu contato. O Paulão ou a Ionã falam com você no horário escolhido.</div>'}).catch(err=>{er.hidden=false;er.textContent=err.message})}}

document.addEventListener('DOMContentLoaded',()=>{expandDD();layout();bindForm();bindDD();carousels();heroVideo();reveal()});
