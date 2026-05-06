// ─── State ───────────────────────────────────────────────────────────────────
let cart=[], currentItem=null, currentQty=1, selectedVersion=null, selectedExtras=new Set(), removedIngs=new Set();
let activeCategory='all', trackingMap=null, checkoutMap=null, userMarker=null, checkoutMarker=null, userLat=null, userLng=null, userAddress='';
let selectedReceiptFile = null;

const $=id=>document.getElementById(id);

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAh94TysIE6ZnTe4D8hm8ULmpotjNzJlOk",
  authDomain: "kupai-delivery.firebaseapp.com",
  databaseURL: "https://kupai-delivery-default-rtdb.firebaseio.com",
  projectId: "kupai-delivery",
  storageBucket: "kupai-delivery.firebasestorage.app",
  messagingSenderId: "623806203155",
  appId: "1:623806203155:web:1cfab1c57df8d0543306e6"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let currentOrderId = localStorage.getItem('kupai_order_id') || null;

// ─── Loader ───────────────────────────────────────────────────────────────────
window.addEventListener('load',()=>{
  setTimeout(()=>{$('loader').classList.add('out');},1400);
});

// ─── Screen nav ──────────────────────────────────────────────────────────────
const screens={home:$('screen-home'),product:$('screen-product'),checkout:$('screen-checkout'),tracking:$('screen-tracking'),search:$('screen-search')};
function goTo(name, isBack = false){
  const cur=document.querySelector('.screen.active');
  const next=screens[name];
  if(!next||cur===next)return;
  
  if(cur) {
    cur.classList.remove('active');
    if(isBack) {
      cur.classList.add('slide-back');
      setTimeout(()=>cur.classList.remove('slide-back'), 600);
    } else {
      cur.classList.add('slide-out');
      setTimeout(()=>cur.classList.remove('slide-out'), 600);
    }
  }
  
  next.classList.add('active');
  next.scrollTop=0;
  if(name==='tracking')initTrackingMap();
}
function goBack(){
  goTo('home', true);
}

// ─── Bottom Nav clicks ────────────────────────────────────────────────────────
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if(!btn) return;
  const screen = btn.dataset.screen;
  
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  btn.classList.add('active');

  if(screen === 'home') goTo('home');
  if(screen === 'search') goTo('search');
  if(screen === 'orden') { renderCheckout(); goTo('checkout'); setTimeout(initCheckoutMap, 150); }
  if(screen === 'rastrear') goTo('tracking');
});

// ─── Feed ────────────────────────────────────────────────────────────────────
function allItems(){return Object.entries(MENU_DATA).flatMap(([cat,items])=>items.map(i=>({...i,cat})));}
function renderFeed(){
  const feed=$('food-feed');
  feed.innerHTML = '';
  const categoriesToRender = activeCategory === 'all' ? Object.keys(MENU_DATA) : [activeCategory];
  $('feed-label').textContent=activeCategory==='all'?'Nuestro Menú':activeCategory;
  
  let html = '';
  let globalIndex = 0;
  categoriesToRender.forEach(cat => {
    if(!MENU_DATA[cat]) return;
    if(activeCategory === 'all') {
      html += `<div style="grid-column: 1 / -1; font-size: 14px; font-weight: 800; color: var(--red); text-transform: uppercase; letter-spacing: 2px; margin: 15px 0 5px; display: flex; align-items: center; gap: 10px;">${cat}<div style="height: 1px; flex: 1; background: var(--border);"></div></div>`;
    }
    html += MENU_DATA[cat].map((item) => {
      const idx = globalIndex++;
      return `
      <div class="food-card animate-fade-up" style="animation-delay: ${(idx % 12) * 0.05}s" data-cat="${cat}" data-name="${item.n}">
        <div class="food-card-img-wrap">
          <img class="food-card-img" src="${imgSrc(item.n)}" alt="${item.n}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=70'"/>
          <div class="food-card-overlay"></div>
          <div class="food-card-pills">
            <div class="food-card-pill">${fmt(item.v[0].p)}</div>
          </div>
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${item.n}</div>
          <div class="food-card-desc">${item.d}</div>
          <div class="food-card-bottom">
            <div class="food-card-price">${fmt(item.v[0].p)}</div>
            <button class="food-card-add" data-cat="${cat}" data-name="${item.n}">+</button>
          </div>
        </div>
      </div>`;
    }).join('');
  });
  feed.innerHTML = html;
  feed.querySelectorAll('.food-card').forEach(c=>{
    c.onclick=e=>{if(!e.target.closest('.food-card-add'))openProduct(c.dataset.cat,c.dataset.name)};
  });
  feed.querySelectorAll('.food-card-add').forEach(b=>{
    b.onclick=e=>{
      e.stopPropagation();
      const it=MENU_DATA[b.dataset.cat].find(i=>i.n===b.dataset.name);
      addToCart(it,b.dataset.cat,1,it.v[0],[],[]);
      flashBtn(b);
      animateFlyToCart(imgSrc(it.n), b);
    };
  });
}
function flashBtn(b){b.classList.add('btn-success-pop');setTimeout(()=>b.classList.remove('btn-success-pop'),500);}

// ─── Product ─────────────────────────────────────────────────────────────────
function openProduct(cat,name){
  currentItem={...MENU_DATA[cat].find(i=>i.n===name),cat};
  currentQty=1;selectedExtras=new Set();removedIngs=new Set();selectedVersion=currentItem.v[0];
  $('product-img').src=imgSrc(name);
  $('product-cat').textContent=cat;
  $('product-name').textContent=name;
  $('product-desc').textContent=currentItem.d;
  $('qty-val').textContent='1';
  renderVersions();renderRemove();renderExtras();updateLinePrice();
  goTo('product');
}
function renderVersions(){
  const el=$('version-list');
  el.innerHTML=currentItem.v.map((v,i)=>`
    <div class="version-item${i===0?' selected':''}" data-idx="${i}">
      <div class="version-name">${v.t}</div>
      <div class="version-price">${fmt(v.p)}</div>
      <div class="version-radio"><div class="version-dot"></div></div>
    </div>`).join('');
  el.querySelectorAll('.version-item').forEach(el=>{
    el.onclick=()=>{
      el.parentElement.querySelectorAll('.version-item').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');
      selectedVersion=currentItem.v[parseInt(el.dataset.idx)];
      updateLinePrice();
    };
  });
}
function renderRemove(){
  const sec=$('remove-section'),list=$('remove-list');
  if(!currentItem.ing||currentItem.ing.length===0){sec.style.display='none';return;}
  sec.style.display='';
  list.innerHTML=currentItem.ing.map(ing=>`
    <div class="extra-item" data-ing="${ing}">
      <span class="extra-emoji">❌</span>
      <div class="extra-info"><div class="extra-name">Sin ${ing}</div></div>
      <div class="extra-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>`).join('');
  list.querySelectorAll('.extra-item').forEach(el=>{
    el.onclick=()=>{
      const ing=el.dataset.ing;
      if(removedIngs.has(ing))removedIngs.delete(ing);else removedIngs.add(ing);
      el.classList.toggle('selected',removedIngs.has(ing));
    };
  });
}
function renderExtras(){
  const sec=$('extras-section'),list=$('extras-list');
  if(!currentItem.ex||currentItem.ex.length===0){sec.style.display='none';return;}
  sec.style.display='';
  list.innerHTML=currentItem.ex.map(e=>`
    <div class="extra-item" data-eid="${e.t}">
      <span class="extra-emoji">➕</span>
      <div class="extra-info"><div class="extra-name">${e.t}</div><div class="extra-price">+${fmt(e.p)}</div></div>
      <div class="extra-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>`).join('');
  list.querySelectorAll('.extra-item').forEach(el=>{
    el.onclick=()=>{
      const eid=el.dataset.eid;
      if(selectedExtras.has(eid))selectedExtras.delete(eid);else selectedExtras.add(eid);
      el.classList.toggle('selected',selectedExtras.has(eid));
      updateLinePrice();
    };
  });
}
function updateLinePrice(){
  const extP=currentItem.ex?currentItem.ex.filter(e=>selectedExtras.has(e.t)).reduce((s,e)=>s+e.p,0):0;
  $('cart-line-price').textContent=fmt((selectedVersion.p+extP)*currentQty);
}
$('qty-minus').onclick=()=>{if(currentQty>1){currentQty--;$('qty-val').textContent=currentQty;updateLinePrice();}};
$('qty-plus').onclick=()=>{currentQty++;$('qty-val').textContent=currentQty;updateLinePrice();};

$('btn-add-to-cart').onclick=()=>{
  const extras=currentItem.ex?currentItem.ex.filter(e=>selectedExtras.has(e.t)):[];
  const removed=[...removedIngs];
  addToCart(currentItem,currentItem.cat,currentQty,selectedVersion,extras,removed);
  
  const btn = $('btn-add-to-cart');
  btn.innerHTML = '¡Añadido! ✓';
  btn.classList.add('btn-success-pop');
  animateFlyToCart(imgSrc(currentItem.n), $('product-img'));
  
  setTimeout(()=>{
    btn.innerHTML = 'Añadir <span id="cart-line-price"></span>';
    btn.classList.remove('btn-success-pop');
    goTo('home');
  }, 600);
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
function addToCart(item,cat,qty,version,extras,removed){
  cart.push({item,cat,qty,version,extras:[...extras],removed:[...removed]});
  updateBadge();
}
function cartTotal(){return cart.reduce((s,c)=>{const ep=c.extras.reduce((es,e)=>es+e.p,0);return s+(c.version.p+ep)*c.qty;},0);}
function cartCount(){return cart.reduce((s,c)=>s+c.qty,0);}
function updateBadge(){
  const n=cartCount();
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent=n;
    b.classList.toggle('hidden',n===0);
  });
}

// ─── Checkout ────────────────────────────────────────────────────────────────
function renderCheckout(){
  const list=$('order-summary-list');
  if(!cart.length){list.innerHTML='<p style="text-align:center;padding:40px 0;color:var(--muted)">Tu carrito está vacío</p>';$('total-amount').textContent='$0.00';return;}
  list.innerHTML=cart.map((c,i)=>`
    <div class="order-item">
      <img class="order-item-img" src="${imgSrc(c.item.n)}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=60'"/>
      <div class="order-item-info">
        <div class="order-item-name">${c.item.n}</div>
        <div class="order-item-sub">${c.version.t}${c.extras.length?' · +'+c.extras.map(e=>e.t).join(', '):''}${c.removed.length?' · Sin '+c.removed.join(', '):''}</div>
        <div class="order-item-price">${fmt(c.version.p*c.qty)}</div>
      </div>
      <div class="order-item-qty">x${c.qty}</div>
    </div>`).join('');
  $('total-amount').textContent=fmt(cartTotal());
}

// ─── Validation & Payment ────────────────────────────────────────────────────
$('receipt-upload').onchange = (e) => {
  const file = e.target.files[0];
  if(file) {
    $('receipt-label').textContent = file.name;
    selectedReceiptFile = file;
  } else {
    $('receipt-label').textContent = "Adjuntar captura de pago";
    selectedReceiptFile = null;
  }
};

document.querySelectorAll('.payment-item').forEach(lbl=>{
  lbl.onclick=()=>{
    document.querySelectorAll('.payment-item').forEach(l=>l.classList.remove('selected'));
    lbl.classList.add('selected');
    const val = lbl.querySelector('input').value;
    const sec = $('payment-details-section');
    const inst = $('payment-instructions');
    if(val === 'Efectivo' || val === 'Oro') {
      sec.style.display = 'none';
    } else {
      sec.style.display = 'block';
      if(val === 'Pago Móvil') inst.innerHTML = `<strong>Pago Móvil:</strong><br>Banco Mercantil (0105)<br>CI: 12.345.678<br>Tel: 0412-1234567`;
      else if (val === 'Binance') inst.innerHTML = `<strong>Binance Pay (Email):</strong><br>pagos@kupai.com`;
    }
  };
});

$('btn-place-order').onclick = async () => {
  const nombre = $('input-nombre').value.trim();
  const telefono = $('input-telefono').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;
  const receipt = $('receipt-upload').files[0];

  let hasError = false;
  if(!nombre) { showInputError('input-nombre'); hasError=true; }
  if(!telefono) { showInputError('input-telefono'); hasError=true; }
  
  if(payment !== 'Efectivo' && !receipt) {
    const labelWrap = $('receipt-label').parentElement;
    labelWrap.classList.add('receipt-error');
    setTimeout(()=>labelWrap.classList.remove('receipt-error'), 3000);
    hasError = true;
  }

  if(hasError) return;

  const orderId = 'ORD-' + Date.now();
  currentOrderId = orderId;
  localStorage.setItem('kupai_order_id', orderId);

  const btn = $('btn-place-order');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="loader-mini-spinner"></div> Procesando...';

  // Comprimir recibo si existe
  let receiptBase64 = "";
  if(receipt) {
    receiptBase64 = await new Promise(resolve => compressImageToBase64(receipt, resolve));
  }

  const orderData = {
    id: orderId,
    status: 'PENDIENTE',
    timestamp: Date.now(),
    total: cartTotal(),
    payment: payment,
    receiptUrl: receiptBase64,
    customer: {
      name: nombre,
      phone: telefono,
      address: $('checkout-address-text').textContent,
      lat: userLat,
      lng: userLng
    },
    items: cart.map(c => ({
      qty: c.qty,
      name: c.item.n,
      version: c.version.t,
      price: c.version.p + c.extras.reduce((s,e)=>s+e.p,0),
      extras: c.extras.map(e=>e.t),
      removed: c.removed
    }))
  };

  db.ref('orders/' + orderId).set(orderData)
    .then(() => {
      const msg = buildWhatsAppMsg(orderData);
      window.open(`https://wa.me/584121234567?text=${encodeURIComponent(msg)}`, '_blank');
      showSuccessOverlay();
      listenToOrderStatus(orderId);
    })
    .catch(err => {
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
};

function showInputError(id) {
  const el = $(id);
  el.classList.add('error');
  el.focus();
  setTimeout(()=>el.classList.remove('error'), 3000);
}

function showSuccessOverlay() {
  $('overlay-success').classList.remove('hidden');
  const now = new Date();
  const fmt2 = d => d.toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'});
  $('tl-time-1').textContent = fmt2(now);
  $('tl-time-2').textContent = fmt2(new Date(now.getTime() + 10*60000));
  $('eta-time').textContent = fmt2(new Date(now.getTime() + 30*60000));
}

// ─── Tracking Map ────────────────────────────────────────────────────────────
function initTrackingMap(){
  if(trackingMap){trackingMap.invalidateSize();return;}
  const lat=userLat||10.48; const lng=userLng||-66.90;
  trackingMap=L.map('tracking-map',{zoomControl:false,attributionControl:false}).setView([lat,lng],15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(trackingMap);
  userMarker=L.marker([lat,lng],{icon:redIcon()}).addTo(trackingMap);
}

function startDriverLocationListener(orderId) {
  db.ref('orders/' + orderId + '/driverLiveLocation').on('value', snap => {
    const loc = snap.val();
    if(!loc || !trackingMap) return;
    if(!driverLiveMarker) {
      driverLiveMarker = L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({html:'<div class="marker-driver"></div>',iconSize:[20,20]})
      }).addTo(trackingMap);
    } else {
      driverLiveMarker.setLatLng([loc.lat, loc.lng]);
    }
    const bounds = L.latLngBounds([[loc.lat, loc.lng], [userLat||10.48, userLng||-66.90]]);
    trackingMap.fitBounds(bounds, {padding:[50,50]});
  });
}

function listenToOrderStatus(orderId) {
  db.ref('orders/' + orderId).on('value', snap => {
    const data = snap.val();
    if(!data) return;
    updateTrackingTimeline(data.status);
    if(data.driverId) updateDriverInfoUI(data.driverId);
    if(data.status === 'EN_CAMINO') startDriverLocationListener(orderId);
  });
}

function updateDriverInfoUI(driverId) {
  const d = DRIVERS.find(x=>x.id === driverId);
  if(!d) return;
  const card = $('tracking-driver-card');
  card.style.display = 'flex';
  $('tracking-driver-avatar').src = d.photo;
  $('tracking-driver-name').textContent = d.name;
  $('tracking-driver-vehicle').textContent = d.vehicle;
  $('tracking-driver-call').href = `tel:${d.phone}`;
  $('tracking-driver-msg').href = `https://wa.me/${d.phone}`;
  $('tracking-timeline-driver-status').textContent = `${d.name.split(' ')[0]} lleva tu pedido`;
}

function updateTrackingTimeline(status) {
  const items = document.querySelectorAll('.timeline-item');
  const steps = ['PENDIENTE','COCINANDO','EN_CAMINO','ENTREGADO'];
  const idx = steps.indexOf(status);
  items.forEach((item, i) => {
    const icon = item.querySelector('.tl-icon');
    icon.className = 'tl-icon ' + (i < idx ? 'done' : i === idx ? 'active' : 'pending');
  });
}

// ─── Utils ───────────────────────────────────────────────────────────────────
function fmt(n){return '$'+n.toFixed(2);}
function imgSrc(n){return `REFERENCIAS/img/${n.toLowerCase().replace(/ /g,'-')}.jpg`;}
function redIcon(){return L.divIcon({html:'<div class="marker-dest"></div>',iconSize:[14,14]});}

function animateFlyToCart(imgSrc, startEl) {
  const cartBtn = document.querySelector('[data-screen="orden"]');
  if(!cartBtn) return;
  const s = startEl.getBoundingClientRect();
  const e = cartBtn.getBoundingClientRect();
  const flyer = document.createElement('img');
  flyer.src = imgSrc; flyer.className = 'flying-item';
  flyer.style.left = s.left + 'px'; flyer.style.top = s.top + 'px';
  flyer.style.setProperty('--tx', `${(e.left + e.width/2) - (s.left + s.width/2)}px`);
  flyer.style.setProperty('--ty', `${(e.top + e.height/2) - (s.top + s.height/2)}px`);
  document.body.appendChild(flyer);
  setTimeout(()=>flyer.remove(), 800);
}

function buildWhatsAppMsg(o) {
  let m = `🍔 *PEDIDO KUPAI #${o.id.slice(-5)}*\n\n`;
  m += `👤 ${o.customer.name}\n📍 ${o.customer.address}\n💳 ${o.payment}\n\n`;
  o.items.forEach(i => m += `• ${i.name} (${i.version}) x${i.qty}\n`);
  m += `\n💰 *TOTAL: ${fmt(o.total)}*`;
  return m;
}

function compressImageToBase64(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = Math.min(1, 600 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
  };
}

// ─── Init ────────────────────────────────────────────────────────────────────
if(currentOrderId) listenToOrderStatus(currentOrderId);
renderFeed();
renderHomeCategories();
renderSearchCategories();

function renderHomeCategories() {
  const grid = $('home-categories-grid');
  const cats = ['all', ...Object.keys(MENU_DATA)];
  grid.innerHTML = cats.map(c => `<div class="home-cat-card${c===activeCategory?' active':''}" data-cat="${c}"><span class="home-cat-name">${c==='all'?'TODO':c}</span></div>`).join('');
  grid.querySelectorAll('.home-cat-card').forEach(card => {
    card.onclick = () => {
      activeCategory = card.dataset.cat;
      grid.querySelectorAll('.home-cat-card').forEach(x=>x.classList.toggle('active', x===card));
      renderFeed();
    };
  });
}

function renderSearchCategories() {
  const grid = $('search-cat-grid');
  const cats = ['all', ...Object.keys(MENU_DATA)];
  grid.innerHTML = cats.map(c => `<div class="search-cat-card" data-cat="${c}"><span class="search-cat-name">${c==='all'?'TODO':c}</span></div>`).join('');
  grid.querySelectorAll('.search-cat-card').forEach(card => {
    card.onclick = () => {
      activeCategory = card.dataset.cat;
      goTo('home');
      renderHomeCategories();
      renderFeed();
    };
  });
}

$('search-input').oninput = e => {
  const q = e.target.value.toLowerCase();
  const res = allItems().filter(i => i.n.toLowerCase().includes(q) || i.d.toLowerCase().includes(q));
  const feed = $('search-feed');
  $('search-results-view').style.display = q ? 'block' : 'none';
  $('search-categories-view').style.display = q ? 'none' : 'block';
  feed.innerHTML = res.map(i => `<div class="food-card" onclick="openProduct('${i.cat}','${i.n}')"><div class="food-card-name">${i.n}</div></div>`).join('');
};

$('btn-track-order').onclick = () => { $('overlay-success').classList.add('hidden'); cart=[]; updateBadge(); goTo('tracking'); };
$('btn-back-home-success').onclick = () => { $('overlay-success').classList.add('hidden'); cart=[]; updateBadge(); goTo('home'); };
$('btn-back-product').onclick = () => goBack();
$('btn-back-checkout').onclick = () => goBack();
$('btn-back-tracking').onclick = () => goBack();
