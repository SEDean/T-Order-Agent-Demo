/**
 * Thrive ordering agent, Microsoft Teams frame.
 * Conversation flow, cart, and pre-order logic. Menu data is in menu.js;
 * photos and brand tiles are relative files under assets/.
 */
"use strict";
(function(){
  // ---------- Menu data (from menu.js) ----------
  const { BRANDS, CATS, ITEMS, PHOTOS, BRAND_TILES } = window.ORDER_DATA;
  const ITEM = {};
  Object.values(ITEMS).forEach(a=>a.forEach(i=>ITEM[i.id]=i));
  const catsFor=()=>state.brand?CATS.filter(c=>c.brand===state.brand.id):CATS;
  /* Photos and brand tiles: relative files shipped with the site (see menu.js). */
  const IMG = new Proxy({}, {
    get(_, id) {
      const brand = BRANDS.find(b => b.id === id);
      if (brand) return BRAND_TILES[brand.tile] || null;
      if (CATS.some(c => c.id === id)) {   /* category tile = its first photographed item */
        const hit = (ITEMS[id] || []).find(i => PHOTOS[i.name.toLowerCase()]);
        return hit ? PHOTOS[hit.name.toLowerCase()] : null;
      }
      const it = ITEM[id];
      if (!it) return null;
      const base = it.base ? ITEM[it.base] : it;
      return PHOTOS[base.name.toLowerCase()] || null;
    }
  });

  /* Pickup site for this deployment. */
  const LOCATIONS = ["Eurest Cafe"];
  const REC_WORD = {Daily:"daily",Weekdays:"weekdays",Weekends:"weekends",Weekly:"weekly"};

  const state = { cart:{}, preorders:[], poSeq:1, locIdx:0, brand:null, tab:"home", busy:false, pending:null };

  // ---------- helpers ----------
  const $=s=>document.querySelector(s);
  const money=n=>"$"+n.toFixed(2);
  const now=()=>new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
  const count=()=>Object.values(state.cart).reduce((a,b)=>a+b,0);
  const total=()=>Object.entries(state.cart).reduce((s,[id,q])=>s+ITEM[id].price*q,0);
  const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t,p,...k){const n=document.createElement(t);
    if(p)for(const key in p){if(key==="class")n.className=p[key];
      else if(key.startsWith("on")&&typeof p[key]==="function")n.addEventListener(key.slice(2),p[key]);
      else if(p[key]!=null)n.setAttribute(key,p[key]);}
    k.flat().forEach(c=>c!=null&&n.append(c.nodeType?c:document.createTextNode(c)));return n;}
  const AVATAR="../assets/brand/thrive.png";
  const BOT='<img class="avimg" src="'+AVATAR+'" alt="Thrive">';
  const chat=$("#chat"), scroll=$("#chatScroll");
  const down=()=>{scroll.scrollTop=scroll.scrollHeight;};

  // ---------- message rows (Teams bubbles) ----------
  function rowEl(bot){
    const body=el("div",{class:"body"});
    const bubble=el("div",{class:"bubble"},body);
    const react=el("div",{class:"react"},el("button",{title:"Like",type:"button"},"👍"),
      el("button",{title:"Heart",type:"button"},"❤️"),el("button",{title:"Laugh",type:"button"},"😆"),
      el("button",{title:"More reactions",type:"button"},"⋯"));
    const wrap=el("div",{class:"bwrap"},react,bubble);
    let r;
    if(bot){
      const av=el("div",{class:"av bot"}); av.innerHTML=BOT;
      const meta=el("div",{class:"meta"},el("span",{class:"name"},"Thrive"),el("span",{class:"time"},now()));
      r=el("div",{class:"brow"},av,el("div",{class:"stack"},meta,wrap));
    }else{
      const meta=el("div",{class:"meta"},el("span",{class:"time"},now()));
      r=el("div",{class:"brow me"},el("div",{class:"stack"},meta,wrap));
    }
    chat.append(r); down(); return body;
  }
  function you(text){ rowEl(false).append(el("p",null,text)); }
  function bot(cb,delay=520){
    const body=rowEl(true); const t=el("div",{class:"typing"},el("i"),el("i"),el("i")); body.append(t); down();
    state.busy=true;
    setTimeout(()=>{ t.remove(); cb(body); down(); state.busy=false;
      if(state.tab!=="messages") bumpUnread(); }, reduced()?0:delay);
  }
  let unread=0;
  function bumpUnread(){ unread++; const p=$("#msgPill"); p.textContent=unread; p.classList.add("on"); }
  function clearUnread(){ unread=0; $("#msgPill").classList.remove("on"); }

  function actions(body,defs){
    const w=el("div",{class:"actions"});
    defs.filter(Boolean).forEach(d=>{const cls=d.kind==="primary"?"btn btn-primary":d.kind==="danger"?"btn btn-danger":"btn btn-ghost";
      w.append(el("button",{class:cls,type:"button",onclick:()=>{if(!state.busy)d.on();}},d.label));});
    body.append(w);
  }
  function chips(body,defs){
    const w=el("div",{class:"chips"});
    defs.forEach(d=>w.append(el("button",{class:"chip",type:"button",onclick:()=>{if(!state.busy)d.on();}},d.label)));
    body.append(w);
  }
  /* Makes a card's picture do the same as its primary button (tap, click, Enter or Space). */
  function tappable(node,label,on){
    node.setAttribute("role","button"); node.tabIndex=0; node.setAttribute("aria-label",label);
    const go=()=>{if(!state.busy)on();};
    node.addEventListener("click",go);
    node.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
    return node;
  }
  function tile(obj,onSelect){
    const card=el("div",{class:"imgcard"},
      el("div",{class:"fname"},el("span",null,obj.name+" · image"),el("span",null,"▾")),
      tappable(el("div",{class:"tile",style:`background:linear-gradient(135deg,${obj.a},${obj.b})`},
        IMG[obj.id]?el("img",{class:"ph",src:IMG[obj.id],alt:obj.name}):el("div",{class:"emoji"},obj.emoji),
        el("div",{class:"cap"},obj.name)),"Select "+obj.name,onSelect),
      el("div",{class:"cardname"}, obj.note?obj.name+" — "+obj.note:obj.name));
    actions(card,[{label:"Select",kind:"primary",on:onSelect}]);
    return card;
  }

  // ---------- flow ----------
  function greet(){
    bot(b=>{
      b.append(el("p",null,"Hey! 👋 I'm ",el("b",null,"Thrive"),". You're ordering at ",el("b",null,LOCATIONS[state.locIdx]),"."));
      b.append(el("p",null,"Pick a spot to order from:"));
      BRANDS.forEach(br=>b.append(tile(br,()=>chooseBrand(br.id))));
    },260);
  }
  function chooseBrand(id){
    const br=BRANDS.find(x=>x.id===id); state.brand=br;
    you("Order from "+br.name);
    bot(b=>{
      b.append(el("p",null,"Great — ordering from ",el("b",null,br.name),". What would you like to browse?"));
      catsFor().forEach(c=>b.append(tile(c,()=>chooseCat(c.id))));
    });
  }
  function chooseCat(id){
    const c=CATS.find(x=>x.id===id);
    you(c.name);
    bot(b=>{
      b.append(el("p",null,"Here's the ",el("b",null,c.name.toLowerCase())," menu — tap ",el("b",null,"Add to Cart")," on anything you like:"));
      const list=el("div",{class:"items"});
      ITEMS[id].forEach(it=>{
        const box=el("div",{class:"item"},
          IMG[it.id]?tappable(el("div",{class:"mimg"},el("img",{src:IMG[it.id],alt:it.name})),"Add "+it.name+" to cart",()=>addItem(it.id)):null,
          el("div",{class:"line1"},el("span",{class:"nm"},it.name),el("span",{class:"pr"},"• "+money(it.price))),
          el("div",{class:"ds"},it.desc));
        actions(box,[
          {label:"Add to Cart",kind:"primary",on:()=>addItem(it.id)},
          hasOptions(it)&&{label:"View Options",kind:"ghost",on:()=>viewOptions(it.id)},
        ]);
        list.append(box);
      });
      b.append(list);
      chips(b,[
        {label:"↩︎ Other categories",on:()=>bot(bb=>{bb.append(el("p",null,"Sure — pick a category:"));catsFor().forEach(c=>bb.append(tile(c,()=>chooseCat(c.id))));},240)},
        {label:"🛒 View cart"+(count()?" ("+count()+")":""),on:showCart},
      ]);
    });
  }
  /* "View Options" shows only for items with at least one modifier group. */
  const hasOptions=it=>(it.groups||[]).some(g=>g.mods&&g.mods.length);
  function viewOptions(id){
    const it=ITEM[id]; you("View options — "+it.name);
    const groups=(it.groups||[]).filter(g=>g.mods&&g.mods.length);
    if(!groups.length){
      bot(b=>{ b.append(el("p",null,el("b",null,it.name)," comes as is — no options to choose."));
        actions(b,[{label:"Add to Cart",kind:"primary",on:()=>addItem(id)},{label:"↩︎ Back",kind:"ghost",on:()=>chooseCat(catOf(id))}]); },300);
      return;
    }
    const g=groups[0], req=(g.name||"").toLowerCase().startsWith("choice of protein");
    bot(b=>{
      b.append(el("p",null,"Customize ",el("b",null,it.name),". ",el("b",null,g.name),req?" (pick one):":" (optional):"));
      pick(b,g.mods.map(m=>({label:m.name+(m.price?" (+"+money(m.price)+")":""),on:()=>confirmOption(id,m)}))
        .concat(req?[]:[{label:"No thanks",on:()=>confirmOption(id,null)}]));
    },300);
  }
  /* Choosing an option (or "No thanks") only stages it: nothing goes in the cart until Add to Cart. */
  function confirmOption(id,m){
    const it=ITEM[id]; you(m?m.name:"No thanks");
    bot(b=>{
      b.append(el("p",null,el("b",null,it.name),m?" with "+m.name:"",": "+money(it.price+(m?m.price:0))));
      actions(b,[{label:"Add to Cart",kind:"primary",on:()=>m?addItem(id,m.price,m.name):addItem(id)},
        {label:"↩︎ Back",kind:"ghost",on:()=>chooseCat(catOf(id))}]);
    },300);
  }
  /* Slack/Teams render chips inside the message body — chips(body,defs); WhatsApp renders a
     self-removing quick-reply strip under the chat — chips(defs). Same call from our code. */
  function pick(body,defs){ if(chips.length===1) chips(defs); else chips(body,defs); }
  function catOf(id){ for(const c of CATS){ if((ITEMS[c.id]||[]).some(i=>i.id===id)) return c.id; } return CATS[0].id; }
  function addItem(id,delta,size){
    /* a chosen modifier becomes a derived cart item (name + price carry it), so cart, checkout and pre-orders need no changes */
    if(size){ const base=ITEM[id]; const vid=id+"@"+size.toLowerCase().replace(/[^a-z0-9]+/g,"-");
      if(!ITEM[vid]) ITEM[vid]=Object.assign({},base,{id:vid,base:id,name:base.name+" — "+size,price:+(base.price+(delta||0)).toFixed(2),groups:[]});
      id=vid; size=null; }
    const it=ITEM[id];
    state.cart[id]=(state.cart[id]||0)+1;
    you("Add "+it.name);
    bot(b=>{
      b.append(el("p",null,"Added ",el("b",null,it.name)," to your cart! ✅"));
      actions(b,[
        {label:"View Cart",kind:"ghost",on:showCart},
        {label:"Checkout",kind:"primary",on:checkout},
        {label:"Add More",kind:"ghost",on:()=>bot(bb=>{bb.append(el("p",null,"What else?"));catsFor().forEach(c=>bb.append(tile(c,()=>chooseCat(c.id))));},220)},
      ]);
    },340);
  }

  function cartCardEl(){
    const card=el("div",{class:"cartcard"});
    Object.entries(state.cart).forEach(([id,q])=>{
      const it=ITEM[id];
      card.append(el("div",{class:"cartline"},
        el("div",{class:"thumb",style:`background:linear-gradient(135deg,#333333,#3d3d3d)`},
          IMG[id]?el("img",{src:IMG[id],alt:it.name}):it.emoji),
        el("div",{class:"ci"},el("div",{class:"cn"},it.name),
          el("div",{class:"cq"},
            el("span",null,"Qty:"),
            el("div",{class:"qty"},
              el("button",{type:"button","aria-label":"Decrease",onclick:()=>changeQty(id,-1)},"−"),
              el("span",null,String(q)),
              el("button",{type:"button","aria-label":"Increase",onclick:()=>changeQty(id,1)},"+")),
            el("span",null,"• "+money(it.price*q)))),
      ));
    });
    card.append(el("div",{class:"carttotal"},el("span",null,"🧾"),el("span",null,"Total: "+money(total()))));
    return card;
  }
  function showCart(){
    you("View cart");
    if(!count()){ bot(b=>{b.append(el("p",null,"Your cart's empty. Pick a category and add something tasty:"));catsFor().forEach(c=>b.append(tile(c,()=>chooseCat(c.id))));}); return; }
    bot(b=>{
      b.append(el("p",null,"Here's what's in your cart:"));
      const ul=el("ul",null); Object.entries(state.cart).forEach(([id,q])=>ul.append(el("li",null,el("b",null,ITEM[id].name)," ("+q+") — "+money(ITEM[id].price*q)))); b.append(ul);
      b.append(el("p",null,"Your total is ",el("b",null,money(total())),". Add more items or proceed with your order?"));
      b.append(el("p",null,el("b",null,"🛒 Your Cart")));
      b.append(cartCardEl());
      actions(b,[
        {label:"Checkout",kind:"primary",on:checkout},
        {label:"Add More Items",kind:"ghost",on:()=>bot(bb=>{bb.append(el("p",null,"Go for it:"));catsFor().forEach(c=>bb.append(tile(c,()=>chooseCat(c.id))));},220)},
        {label:"Clear Cart",kind:"danger",on:clearCart},
      ]);
      actions(b,[{label:"💾 Save as Pre-order",kind:"ghost",on:openModal}]);
    },440);
  }
  function changeQty(id,d){
    if(state.busy)return;
    state.cart[id]=(state.cart[id]||0)+d; if(state.cart[id]<=0)delete state.cart[id];
    if(!count()){ bot(b=>{b.append(el("p",null,"Cart cleared out — start again?"));catsFor().forEach(c=>b.append(tile(c,()=>chooseCat(c.id))));},220); return; }
    bot(b=>{ b.append(el("p",null,"Updated your cart:"));b.append(el("p",null,el("b",null,"🛒 Your Cart")));b.append(cartCardEl());
      actions(b,[{label:"Checkout",kind:"primary",on:checkout},
        {label:"Add More Items",kind:"ghost",on:()=>bot(bb=>{bb.append(el("p",null,"Go for it:"));catsFor().forEach(c=>bb.append(tile(c,()=>chooseCat(c.id))));},220)},
        {label:"Clear Cart",kind:"danger",on:clearCart}]);
      actions(b,[{label:"💾 Save as Pre-order",kind:"ghost",on:openModal}]);
    },220);
  }
  function clearCart(){ you("Clear cart"); state.cart={};
    bot(b=>{b.append(el("p",null,"Done — your cart's empty. Start fresh whenever you like:"));catsFor().forEach(c=>b.append(tile(c,()=>chooseCat(c.id))));},280); }
  function checkout(){
    if(!count()){ bot(b=>b.append(el("p",null,"Your cart's empty — add an item first."))); return; }
    you("Checkout");
    const n=count(), t=total(), where=state.brand?state.brand.name:LOCATIONS[state.locIdx];
    state.cart={};
    bot(b=>{ b.append(el("p",null,"✅ Order placed! Your ",el("b",null,n+" item"+(n>1?"s":"")),
      " (",el("b",null,money(t)),") will be ready for pickup at ",el("b",null,where),", ",LOCATIONS[state.locIdx],"."));
      chips(b,[{label:"🍽️ Start a new order",on:()=>bot(bb=>{bb.append(el("p",null,"What sounds good?"));catsFor().forEach(c=>bb.append(tile(c,()=>chooseCat(c.id))));},220)}]);
    },420);
    toast("Order placed · "+money(t));
  }

  // ---------- Pre-order modal ----------
  function openModal(){
    if(!count()){ bot(b=>b.append(el("p",null,"Add something to your cart before saving a pre-order."))); return; }
    $("#poNameInput").value="";
    $("#poHour").value=""; $("#poMin").value=""; $("#poRec").value="";
    $("#overlay").classList.add("show"); setTimeout(()=>$("#poNameInput").focus(),30);
  }
  function closeModal(){ $("#overlay").classList.remove("show"); }
  function createPreorder(){
    const name=($("#poNameInput").value||"Morning order").trim();
    const h=$("#poHour").value||"08", m=$("#poMin").value||"00", rec=$("#poRec").value||"Daily";
    const items=Object.entries(state.cart).map(([id,q])=>({name:ITEM[id].name,qty:q,price:ITEM[id].price,emoji:ITEM[id].emoji}));
    const t=total();
    const po={ id:"po"+(state.poSeq++), name, hour:h, min:m, rec, items, total:t,
      brand:state.brand?state.brand.name:"", location:LOCATIONS[state.locIdx], status:"active" };
    state.preorders.unshift(po);
    renderPreorders();
    state.cart={};
    closeModal();
    bot(b=>{
      b.append(el("p",null,"✅ ",el("b",null,"Pre-order created!")));
      b.append(el("p",null,"🕐 ",el("b",null,name)));
      b.append(el("p",null,h+":"+m+" — "+REC_WORD[rec]));
      b.append(el("p",null,"Manage your pre-orders from the ",el("b",null,"Home")," tab."));
    },420);
    toast("Pre-order “"+name+"” created");
    setTimeout(()=>firePreorderReady(po.id), reduced()?600:4200);
  }
  function firePreorderReady(poId){
    const po=state.preorders.find(p=>p.id===poId);
    if(!po||po.status!=="active")return;
    bot(b=>{
      b.append(el("p",null,"🔔 ",el("b",null,"Pre-order Ready!")));
      b.append(el("p",null,"Your pre-order ",el("b",null,po.name)," is ready!"));
      b.append(el("p",null,el("b",null,"Location: "),po.location));
      b.append(el("p",null,el("b",null,"Brand: "),po.brand||"—"));
      b.append(el("p",null,el("b",null,"Items:")));
      const ul=el("ul",null); po.items.forEach(it=>ul.append(el("li",null,it.qty+"x ",el("b",null,it.name)," • "+money(it.price*it.qty)))); b.append(ul);
      actions(b,[
        {label:"Confirm & Checkout",kind:"primary",on:()=>confirmReady(po.id)},
        {label:"Skip Today",kind:"ghost",on:()=>skipReady(po.id)},
        {label:"Pause Pre-order",kind:"danger",on:()=>pauseReady(po.id)},
      ]);
    },500);
  }
  function confirmReady(poId){ const po=state.preorders.find(p=>p.id===poId); if(!po)return;
    you("Confirm & Checkout"); bot(b=>b.append(el("p",null,"✅ Confirmed! Your ",el("b",null,po.name)," order (",money(po.total),") is being prepared at ",el("b",null,po.brand||po.location),".")),360);
    toast("Confirmed · "+po.name); }
  function skipReady(poId){ const po=state.preorders.find(p=>p.id===poId); if(!po)return;
    you("Skip today"); bot(b=>b.append(el("p",null,"👍 Skipped today's ",el("b",null,po.name),". It'll be back on your next scheduled time.")),320); }
  function pauseReady(poId){ const po=state.preorders.find(p=>p.id===poId); if(!po)return;
    po.status="paused"; renderPreorders(); you("Pause pre-order");
    bot(b=>b.append(el("p",null,"⏸️ Paused ",el("b",null,po.name),". Resume anytime from the ",el("b",null,"Home")," tab.")),320);
    toast(po.name+" paused"); }

  // ---------- Home: pre-orders ----------
  function renderPreorders(){
    const area=$("#poArea"), badge=$("#poBadge"); area.innerHTML="";
    if(!state.preorders.length){
      area.append(el("p",{class:"empty"},"No pre-orders yet. Add items to your cart and tap “Save as Pre-order” to create one."));
      badge.hidden=true; return;
    }
    badge.hidden=false; badge.textContent=state.preorders.length;
    const list=el("div",{class:"po-list"});
    state.preorders.forEach(po=>{
      const items=el("ul",{class:"po-items"});
      po.items.forEach(it=>items.append(el("li",null,el("span",null,(it.qty>1?it.qty+"× ":"")+it.name),el("span",null,money(it.price*it.qty)))));
      const paused=po.status==="paused";
      const card=el("div",{class:"po"},
        el("div",{class:"po-top"},
          el("span",{class:"po-name"},po.name),
          el("span",{class:"po-status "+(paused?"paused":"active")},paused?"Paused":"Active"),
          el("span",{class:"po-sched"},"🕐 "+po.hour+":"+po.min+" — "+REC_WORD[po.rec])),
        el("div",{class:"po-meta"},(po.brand?po.brand+" · ":"")+po.location),
        items,
        el("div",{class:"po-foot"},
          el("span",{class:"po-total"},money(po.total)),
          el("span",{class:"sp"}),
          el("button",{class:"btn btn-ghost",type:"button",onclick:()=>togglePause(po.id)},paused?"Resume":"Pause"),
          el("button",{class:"btn btn-ghost",type:"button",onclick:()=>cancelPO(po.id)},"Cancel")));
      list.append(card);
    });
    area.append(list);
  }
  function togglePause(id){ const po=state.preorders.find(p=>p.id===id); if(!po)return;
    po.status=po.status==="paused"?"active":"paused"; renderPreorders(); toast(po.name+(po.status==="paused"?" paused":" resumed")); }
  function cancelPO(id){ const po=state.preorders.find(p=>p.id===id);
    state.preorders=state.preorders.filter(p=>p.id!==id); renderPreorders(); toast((po?po.name:"Pre-order")+" canceled"); }

  // ---------- free text ----------
  function handleText(raw){
    const t=raw.trim(); if(!t)return; you(t); const q=t.toLowerCase();
    if(/\b(menu|order|start|hi|hello|hey|brand|browse)\b/.test(q)){
      bot(b=>{b.append(el("p",null,"Let's get started — pick a spot:"));BRANDS.forEach(br=>b.append(tile(br,()=>chooseBrand(br.id))));});
    } else if(/\bcart\b/.test(q)){ showCart(); }
    else if(/\b(checkout|pay|done)\b/.test(q)){ checkout(); }
    else if(/\b(help|how)\b/.test(q)){ bot(b=>{b.append(el("p",null,"I can help you order. Pick a brand, choose a category, add items, then ",el("b",null,"Checkout")," or ",el("b",null,"Save as Pre-order"),"."));BRANDS.forEach(br=>b.append(tile(br,()=>chooseBrand(br.id))));}); }
    else { const hit=Object.values(ITEM).filter(i=>!i.base).sort((a,b)=>b.name.length-a.name.length).find(i=>q.includes(i.name.toLowerCase())||q.includes(i.name.toLowerCase().split(/[ ,:]/).slice(0,2).join(" "))); if(hit){addItem(hit.id);} else bot(b=>{b.append(el("p",null,"Not sure about that — want to see the menu?"));BRANDS.forEach(br=>b.append(tile(br,()=>chooseBrand(br.id))));},280); }
  }

  // ---------- tabs / wiring ----------
  function setTab(name){ state.tab=name;
    document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.tab===name)));
    document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.dataset.panel===name));
    /* Focus the composer only with a mouse or trackpad: on touch screens it would pop up the keyboard. */
    if(name==="messages"){ clearUnread(); down(); if(matchMedia("(hover:hover) and (pointer:fine)").matches) $("#cinput").focus(); } }
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>setTab(t.dataset.tab)));
  $("#changeLoc").addEventListener("click",()=>{ state.locIdx=(state.locIdx+1)%LOCATIONS.length;
    $("#locName").textContent=LOCATIONS[state.locIdx]; toast("Location set to "+LOCATIONS[state.locIdx]); });
  $("#composer").addEventListener("submit",e=>{e.preventDefault();const v=$("#cinput").value;$("#cinput").value="";handleText(v);});
  $("#modalX").addEventListener("click",closeModal);
  $("#modalCancel").addEventListener("click",closeModal);
  $("#modalCreate").addEventListener("click",createPreorder);
  $("#overlay").addEventListener("click",e=>{if(e.target===$("#overlay"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#overlay").classList.contains("show"))closeModal();});

  // populate modal selects
  (function fillSelects(){
    const h=$("#poHour"), m=$("#poMin");
    for(let i=0;i<24;i++){const v=String(i).padStart(2,"0");h.append(el("option",{value:v},v));}
    for(let i=0;i<60;i+=5){const v=String(i).padStart(2,"0");m.append(el("option",{value:v},v));}
  })();

  let toastT;
  function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show");
    clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1900); }

  // ---------- boot ----------
  renderPreorders();
  greet();
})();
