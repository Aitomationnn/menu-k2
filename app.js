// ─── State ───────────────────────────────────────────────────────────────────
let cart=[], currentItem=null, currentQty=1, selectedVersion=null, selectedExtras=new Set(), removedIngs=new Set();
let activeCategory='all', trackingMap=null, checkoutMap=null, userMarker=null, checkoutMarker=null, userLat=null, userLng=null, userAddress='';

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
      setTimeout(()=>cur.classList.remove('slide-back'), 500);
    } else {
      cur.classList.add('slide-out');
      setTimeout(()=>cur.classList.remove('slide-out'), 500);
    }
  }
  
  next.classList.add('active');
  next.scrollTop=0;
  if(name==='tracking')initTrackingMap();
}
function goBack(from){
  goTo('home', true);
}

// ─── Bottom Nav clicks ────────────────────────────────────────────────────────
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if(!btn) return;
  const screen = btn.dataset.screen;
  if(screen === 'home') goTo('home');
  if(screen === 'search') goTo('search');
  if(screen === 'orden') { renderCheckout(); goTo('checkout'); setTimeout(initCheckoutMap, 100); }
  if(screen === 'rastrear') goTo('tracking');
});

// ─── Feed ────────────────────────────────────────────────────────────────────
function allItems(){return Object.entries(MENU_DATA).flatMap(([cat,items])=>items.map(i=>({...i,cat})));}
function renderFeed(){
  const feed=$('food-feed');
  feed.innerHTML = '';
  
  const categoriesToRender = activeCategory === 'all' 
    ? Object.keys(MENU_DATA) 
    : [activeCategory];

  $('feed-label').textContent=activeCategory==='all'?'Nuestro Menú':activeCategory;
  
  let html = '';
  let globalIndex = 0;
  categoriesToRender.forEach(cat => {
    if(!MENU_DATA[cat] || MENU_DATA[cat].length === 0) return;
    
    if(activeCategory === 'all') {
      html += `<div style="grid-column: 1 / -1; font-size: 14px; font-weight: 800; color: var(--red); text-transform: uppercase; letter-spacing: 2px; margin: 10px 0 0; display: flex; align-items: center; gap: 10px;">${cat}<div style="height: 1px; flex: 1; background: var(--border);"></div></div>`;
    }

    html += MENU_DATA[cat].map((item) => {
      const idx = globalIndex++;
      return `
      <div class="food-card animate-fade-up" style="animation-delay: ${(idx % 15) * 0.04}s" data-cat="${cat}" data-name="${item.n}">
        <div class="food-card-img-wrap">
          <img class="food-card-img" src="${imgSrc(item.n)}" alt="${item.n}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=70'"/>
          <div class="food-card-overlay"></div>
          <div class="food-card-pills">
            <div class="food-card-pill">${fmt(item.v[0].p)}</div>
          </div>
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${item.n}</div>
          <div class="food-card-desc" title="${item.d}">${item.d}</div>
          <div class="food-card-bottom">
            <div>
              <div class="food-card-price">${fmt(item.v[0].p)}</div>
            </div>
            <button class="food-card-add" data-cat="${cat}" data-name="${item.n}" aria-label="Añadir">+</button>
          </div>
        </div>
      </div>`;
    }).join('');
  });
  
  feed.innerHTML = html;

  feed.querySelectorAll('.food-card').forEach(c=>{
    c.addEventListener('click',e=>{if(e.target.closest('.food-card-add'))return;openProduct(c.dataset.cat,c.dataset.name);});
  });
  feed.querySelectorAll('.food-card-add').forEach(b=>{
    b.addEventListener('click',e=>{
      e.stopPropagation();
      const it=MENU_DATA[b.dataset.cat]?.find(i=>i.n===b.dataset.name);
      if(it){addToCart(it,b.dataset.cat,1,it.v[0],[],[]);flashBtn(b);}
    });
  });
}
function flashBtn(b){b.style.transform='scale(.75)';b.style.background='var(--red)';b.style.color='#fff';setTimeout(()=>{b.style.transform='';b.style.background='';b.style.color='';},200);}

// ─── Categories ───────────────────────────────────────────────────────────────
// Handled directly inside renderHomeCategories() now

// ─── Product ─────────────────────────────────────────────────────────────────
function openProduct(cat,name){
  currentItem={...MENU_DATA[cat].find(i=>i.n===name),cat};
  currentQty=1;selectedExtras=new Set();removedIngs=new Set();
  selectedVersion=currentItem.v[0];
  $('product-img').src=imgSrc(name);
  $('product-img').onerror=function(){this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=70';};
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
    el.addEventListener('click',()=>{
      document.querySelectorAll('.version-item').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');
      selectedVersion=currentItem.v[parseInt(el.dataset.idx)];
      updateLinePrice();
    });
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
    el.addEventListener('click',()=>{
      const ing=el.dataset.ing;
      if(removedIngs.has(ing))removedIngs.delete(ing);else removedIngs.add(ing);
      el.classList.toggle('selected',removedIngs.has(ing));
    });
  });
}
function renderExtras(){
  const sec=$('extras-section'),list=$('extras-list');
  if(!currentItem.ex||currentItem.ex.length===0){sec.style.display='none';return;}
  sec.style.display='';
  list.innerHTML=currentItem.ex.map(e=>`
    <div class="extra-item" data-eid="${e.t}">
      <span class="extra-emoji">➕</span>
      <div class="extra-info">
        <div class="extra-name">${e.t}</div>
        <div class="extra-price">+${fmt(e.p)}</div>
      </div>
      <div class="extra-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>`).join('');
  list.querySelectorAll('.extra-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const eid=el.dataset.eid;
      if(selectedExtras.has(eid))selectedExtras.delete(eid);else selectedExtras.add(eid);
      el.classList.toggle('selected',selectedExtras.has(eid));
      updateLinePrice();
    });
  });
}
function updateLinePrice(){
  if(!currentItem||!selectedVersion)return;
  const extP=currentItem.ex?currentItem.ex.filter(e=>selectedExtras.has(e.t)).reduce((s,e)=>s+e.p,0):0;
  $('cart-line-price').textContent=fmt((selectedVersion.p+extP)*currentQty);
}
$('qty-minus').addEventListener('click',()=>{if(currentQty>1){currentQty--;$('qty-val').textContent=currentQty;updateLinePrice();}});
$('qty-plus').addEventListener('click',()=>{currentQty++;$('qty-val').textContent=currentQty;updateLinePrice();});

// ─── Cart ─────────────────────────────────────────────────────────────────────
function addToCart(item,cat,qty,version,extras,removed){
  cart.push({item,cat,qty,version,extras:[...extras],removed:[...removed]});updateBadge();
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

$('btn-add-to-cart').addEventListener('click',()=>{
  const extras=currentItem.ex?currentItem.ex.filter(e=>selectedExtras.has(e.t)):[];
  const removed=[...removedIngs];
  addToCart(currentItem,currentItem.cat,currentQty,selectedVersion,extras,removed);
  goBack('product');
});

// ─── Checkout ────────────────────────────────────────────────────────────────
function renderCheckout(){
  const list=$('order-summary-list');
  if(!cart.length){list.innerHTML='<p style="color:var(--muted);text-align:center;padding:20px 0;font-size:14px">Tu carrito está vacío</p>';$('total-amount').textContent='$0.00';return;}
  list.innerHTML=cart.map((c,i)=>`
    <div class="order-item">
      <img class="order-item-img" src="${imgSrc(c.item.n)}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=60'" alt="${c.item.n}"/>
      <div class="order-item-info">
        <div class="order-item-name">${c.item.n}</div>
        <div class="order-item-sub">${c.version.t}${c.extras.length?' · +'+c.extras.map(e=>e.t).join(', '):''}${c.removed.length?' · Sin '+c.removed.join(', '):''}</div>
        <div class="order-item-price">${fmt(c.version.p*c.qty)}</div>
      </div>
      <div class="order-item-qty">x${c.qty}</div>
    </div>`).join('');
  $('total-amount').textContent=fmt(cartTotal());
}

// ─── Payment select ───────────────────────────────────────────────────────────
let selectedReceiptFile = null;

$('receipt-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(file) {
    $('receipt-label').textContent = file.name;
    selectedReceiptFile = file;
  } else {
    $('receipt-label').textContent = "Adjuntar captura de pago";
    selectedReceiptFile = null;
  }
});

document.querySelectorAll('.payment-item').forEach(lbl=>{
  lbl.addEventListener('click',()=>{
    document.querySelectorAll('.payment-item').forEach(l=>l.classList.remove('selected'));
    lbl.classList.add('selected');
    
    // Update instructions
    const val = lbl.querySelector('input').value;
    const sec = $('payment-details-section');
    const inst = $('payment-instructions');
    
    if(val === 'Efectivo' || val === 'Oro') {
      sec.style.display = 'none';
      selectedReceiptFile = null;
      $('receipt-label').textContent = "Adjuntar captura de pago";
      $('receipt-upload').value = "";
    } else {
      sec.style.display = 'block';
      if(val === 'Pago Móvil') {
        inst.innerHTML = `<strong>Pago Móvil:</strong><br>Banco Mercantil (0105)<br>CI: 12.345.678<br>Tel: 0412-1234567`;
      } else if (val === 'Binance') {
        inst.innerHTML = `<strong>Binance Pay (Email):</strong><br>pagos@kupai.com`;
      }
    }
  });
});

// ─── GPS / Maps ───────────────────────────────────────────────────────────────
const DARK_TILES='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR='&copy; OpenStreetMap &copy; CARTO';

async function reverseGeocode(lat,lng){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const d=await r.json();
    return d.display_name||`${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }catch{return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;}
}

function detectGPS(onSuccess,onError){
  if(!navigator.geolocation){onError('Geolocalización no disponible');return;}
  navigator.geolocation.getCurrentPosition(
    pos=>{onSuccess(pos.coords.latitude,pos.coords.longitude);},
    err=>{onError(err.message);},
    {enableHighAccuracy:true,timeout:10000}
  );
}

// Home GPS button
$('btn-detect-home').addEventListener('click',()=>{
  $('home-address-text').textContent='Obteniendo ubicación…';
  detectGPS(async(lat,lng)=>{
    userLat=lat;userLng=lng;
    userAddress=await reverseGeocode(lat,lng);
    const short=userAddress.split(',').slice(0,2).join(',');
    $('home-address-text').textContent=short;
    $('checkout-address-text').textContent=short;
    $('input-direccion').value=userAddress;
  },err=>{$('home-address-text').textContent='No se pudo detectar';});
});

// Checkout GPS button
$('btn-gps-checkout').addEventListener('click',()=>{
  $('checkout-address-text').textContent='Obteniendo GPS…';
  detectGPS(async(lat,lng)=>{
    userLat=lat;userLng=lng;
    userAddress=await reverseGeocode(lat,lng);
    const short=userAddress.split(',').slice(0,2).join(',');
    $('checkout-address-text').textContent=short;
    $('checkout-address-sub').textContent=`${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    $('input-direccion').value=userAddress;
    if(checkoutMap){
      checkoutMap.setView([lat,lng],16);
      if(checkoutMarker)checkoutMarker.setLatLng([lat,lng]);
      else checkoutMarker=L.marker([lat,lng],{icon:redIcon()}).addTo(checkoutMap);
    }
    closeSuggestions();
  },err=>{$('checkout-address-text').textContent='No se pudo detectar';});
});

// ─── Address Autocomplete (Nominatim) ─────────────────────────────────────────
let addrDebounceTimer = null;
let addrAbortCtrl     = null;

const addrInput   = $('input-direccion');
const addrSuggBox = $('addr-suggestions');
const addrClearBtn= $('addr-clear-btn');

if (addrInput && addrSuggBox && addrClearBtn) {
  /** Muestra / oculta el botón ✕ según si hay texto */
  addrInput.addEventListener('input', () => {
    const q = addrInput.value.trim();
    addrClearBtn.style.display = q ? 'block' : 'none';
    if (!q) { closeSuggestions(); return; }
    scheduleSearch(q);
  });

  addrInput.addEventListener('focus', () => {
    if (addrInput.value.trim().length >= 3) scheduleSearch(addrInput.value.trim());
  });

  addrClearBtn.addEventListener('click', () => {
    addrInput.value = '';
    addrClearBtn.style.display = 'none';
    closeSuggestions();
    addrInput.focus();
    userLat = null; userLng = null; userAddress = '';
    $('checkout-address-text').textContent = 'Sin ubicación aún';
    $('checkout-address-sub').textContent  = 'Escribe o usa el GPS';
  });
}

// Cerrar al hacer clic fuera
document.addEventListener('click', e => {
  if (!e.target.closest('.address-input-wrap')) closeSuggestions();
});

function scheduleSearch(q) {
  clearTimeout(addrDebounceTimer);
  addrDebounceTimer = setTimeout(() => searchAddress(q), 400);
}

function closeSuggestions() {
  addrSuggBox.style.display = 'none';
}

async function searchAddress(q) {
  if (q.length < 3) return;

  // Mostrar spinner
  addrSuggBox.style.display = 'block';
  addrSuggBox.innerHTML = `
    <div class="addr-sugg-loading">
      <div class="addr-mini-spinner"></div> Buscando…
    </div>`;

  // Cancelar petición anterior
  if (addrAbortCtrl) addrAbortCtrl.abort();
  addrAbortCtrl = new AbortController();

  try {
    // Nominatim: búsqueda libre, priorizando Venezuela
    // Se agrega contact para cumplir con la política de Nominatim
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1` +
      `&accept-language=es&countrycodes=ve&email=admin@kupai.com`;

    const res  = await fetch(url, { signal: addrAbortCtrl.signal });
    const data = await res.json();

    if (!data.length) {
      // Si no hay resultados en Venezuela, buscar globalmente
      const res2  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=es&email=admin@kupai.com`,
        { signal: addrAbortCtrl.signal }
      );
      const data2 = await res2.json();
      renderSuggestions(data2, q);
    } else {
      renderSuggestions(data, q);
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    addrSuggBox.innerHTML = `<div class="addr-sugg-empty">⚠️ Error al buscar. Intenta de nuevo.</div>`;
  }
}

function renderSuggestions(results, query) {
  if (!results.length) {
    addrSuggBox.innerHTML = `<div class="addr-sugg-empty">📍 No se encontraron resultados para "${query}"</div>`;
    return;
  }

  addrSuggBox.innerHTML = results.map((r, i) => {
    // Construir texto corto y sub-texto
    const addr = r.address || {};
    const main = r.name || addr.road || addr.suburb || r.display_name.split(',')[0];
    const parts = r.display_name.split(',').slice(1, 4).join(', ').trim();

    return `
      <div class="addr-sugg-item" data-idx="${i}" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${encodeURIComponent(r.display_name)}">
        <div class="addr-sugg-pin">📍</div>
        <div class="addr-sugg-text">
          <div class="addr-sugg-main">${main}</div>
          <div class="addr-sugg-sub">${parts}</div>
        </div>
      </div>`;
  }).join('');

  // Clicks en sugerencias (usamos mousedown para que ocurra antes del blur/click-outside)
  addrSuggBox.onclick = null; // Limpiar anteriores si los hay
  addrSuggBox.onmousedown = (e) => {
    const item = e.target.closest('.addr-sugg-item');
    if (!item) return;

    e.preventDefault(); // Evita que el input pierda el foco
    
    const lat  = parseFloat(item.dataset.lat);
    const lng  = parseFloat(item.dataset.lng);
    const name = decodeURIComponent(item.dataset.name);
    
    selectAddress(lat, lng, name);
  };
}

/** Selecciona una dirección del dropdown → actualiza mapa + coordenadas */
function selectAddress(lat, lng, displayName) {
  userLat     = lat;
  userLng     = lng;
  userAddress = displayName;

  // Texto corto para mostrar
  const short = displayName.split(',').slice(0, 3).join(', ');
  addrInput.value = short;

  // Actualizar referencias de checkout
  $('checkout-address-text').textContent = displayName.split(',').slice(0, 2).join(',');
  $('checkout-address-sub').textContent  = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // Mover el mapa y el marcador
  if (checkoutMap) {
    checkoutMap.setView([lat, lng], 16, { animate: true });
    if (checkoutMarker) checkoutMarker.setLatLng([lat, lng]);
    else checkoutMarker = L.marker([lat, lng], { icon: redIcon() }).addTo(checkoutMap);
  }

  closeSuggestions();
}


function redIcon(){
  return L.divIcon({html:`<div style="width:14px;height:14px;background:#E94B4D;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(233,75,77,.6)"></div>`,iconSize:[14,14],iconAnchor:[7,7],className:''});
}

function initCheckoutMap(){
  if(checkoutMap)return;
  const lat=userLat||10.4806;const lng=userLng||-66.9036;
  checkoutMap=L.map('checkout-map',{zoomControl:false,attributionControl:false}).setView([lat,lng],14);
  L.tileLayer(DARK_TILES,{attribution:TILE_ATTR,maxZoom:19}).addTo(checkoutMap);
  if(userLat)checkoutMarker=L.marker([lat,lng],{icon:redIcon()}).addTo(checkoutMap);
}

// Variables globales para el marcador del repartidor en el mapa de seguimiento
let driverLiveMarker = null;
let driverLiveListener = null;

function initTrackingMap(){
  if(trackingMap){trackingMap.invalidateSize();return;}
  const lat=userLat||10.4806;const lng=userLng||-66.9036;
  trackingMap=L.map('tracking-map',{zoomControl:false,attributionControl:false}).setView([lat,lng],15);
  L.tileLayer(DARK_TILES,{attribution:TILE_ATTR,maxZoom:19}).addTo(trackingMap);

  // Marcador del cliente (rojo)
  userMarker=L.marker([lat,lng],{icon:redIcon()}).bindPopup('📍 Tu ubicación').addTo(trackingMap);

  // Escuchar ubicación live del repartidor si hay pedido activo
  if(currentOrderId) {
    startDriverLocationListener(currentOrderId);
  }

  updateTrackingUI(lat,lng);

  // Seguimiento del cliente
  if(navigator.geolocation){
    navigator.geolocation.watchPosition(pos=>{
      const la=pos.coords.latitude,lo=pos.coords.longitude;
      userLat=la;userLng=lo;
      userMarker.setLatLng([la,lo]);
      updateTrackingUI(la,lo);
    },{enableHighAccuracy:true});
  }
}

/** Escucha la ubicación en tiempo real del repartidor y la muestra en el mapa */
function startDriverLocationListener(orderId) {
  if(driverLiveListener) {
    db.ref('orders/' + orderId + '/driverLiveLocation').off('value', driverLiveListener);
  }

  const driverIcon = L.divIcon({
    html: `<div style="
      width:20px;height:20px;
      background:#E94B4D;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 0 0 4px rgba(233,75,77,0.3), 0 2px 10px rgba(0,0,0,0.5);
      animation:driver-pulse 2s ease-in-out infinite;
    "></div>`,
    iconSize:[20,20], iconAnchor:[10,10], className:''
  });

  let routeLine = null;

  driverLiveListener = (snap) => {
    const loc = snap.val();
    if(!loc || !trackingMap) return;

    const dLat = loc.lat;
    const dLng = loc.lng;

    // Crear o mover el marcador del repartidor
    if(!driverLiveMarker) {
      driverLiveMarker = L.marker([dLat, dLng], { icon: driverIcon, zIndexOffset: 500 })
        .bindPopup('🛵 Repartidor en camino')
        .addTo(trackingMap);

      // Mostrar etiqueta de estado
      const driverLabel = $('driver-live-label');
      if(driverLabel) { driverLabel.style.display = 'flex'; }
    } else {
      driverLiveMarker.setLatLng([dLat, dLng]);
    }

    // Actualizar / crear línea entre repartidor y cliente
    if(userLat && userLng) {
      if(routeLine) trackingMap.removeLayer(routeLine);
      routeLine = L.polyline([[dLat, dLng], [userLat, userLng]], {
        color: '#E94B4D', weight: 3, dashArray: '8 6', opacity: 0.75
      }).addTo(trackingMap);
    }

    // Ajustar vista para ver tanto al repartidor como al cliente
    if(userLat && userLng) {
      const bounds = L.latLngBounds([[dLat, dLng], [userLat, userLng]]);
      trackingMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      trackingMap.setView([dLat, dLng], 15);
    }
  };

  db.ref('orders/' + orderId + '/driverLiveLocation').on('value', driverLiveListener);
}

async function updateTrackingUI(lat,lng){
  const addr=await reverseGeocode(lat,lng);
  const short=addr.split(',').slice(0,2).join(',');
  $('tracking-address-text').textContent=short;
  $('gps-coords').textContent=`${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

$('btn-refresh-loc').addEventListener('click',()=>{
  detectGPS(async(lat,lng)=>{
    userLat=lat;userLng=lng;
    if(trackingMap&&userMarker){userMarker.setLatLng([lat,lng]);trackingMap.setView([lat,lng],15);}
    updateTrackingUI(lat,lng);
  },()=>{});
});

// ─── WhatsApp order ───────────────────────────────────────────────────────────
function buildWhatsApp(){
  const nombre=$('input-nombre').value.trim()||'Cliente';
  const dir=$('input-direccion').value.trim()||userAddress||'Sin dirección';
  const pago=document.querySelector('input[name="payment"]:checked')?.value||'Pago Móvil';
  const coords=userLat?`\n📍 GPS: https://maps.google.com/?q=${userLat},${userLng}`:'';
  let msg=`🍔 *NUEVO PEDIDO - KUPAI FAST FOOD*\n\n👤 *Cliente:* ${nombre}\n📍 *Dirección:* ${dir}${coords}\n💳 *Pago:* ${pago}\n\n📋 *Pedido:*\n`;
  cart.forEach(c=>{
    const ep=c.extras.reduce((s,e)=>s+e.p,0);
    msg+=`• ${c.item.n} (${c.version.t}) x${c.qty} = ${fmt((c.version.p+ep)*c.qty)}`;
    if(c.extras.length)msg+=`\n  ➕ ${c.extras.map(e=>e.t).join(', ')}`;
    if(c.removed.length)msg+=`\n  ❌ Sin: ${c.removed.join(', ')}`;
    msg+='\n';
  });
  msg+=`\n💰 *TOTAL: ${fmt(cartTotal())}*`;
  return encodeURIComponent(msg);
}

// ─── Events ───────────────────────────────────────────────────────────────────
$('btn-back-product').addEventListener('click',()=>goBack('product'));
$('btn-back-checkout').addEventListener('click',()=>goBack('checkout'));
$('btn-back-tracking').addEventListener('click',()=>goBack('tracking'));

// ─── Image Compression Base64 ──────────────────────────────────────────────────
function compressImageToBase64(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    callback("");
    return;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      let scaleSize = 1;
      if (img.width > MAX_WIDTH) {
        scaleSize = MAX_WIDTH / img.width;
      }
      canvas.width = img.width * scaleSize;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => {
      console.error("Error al cargar la imagen para compresión");
      callback("");
    };
  };
  reader.onerror = () => {
    console.error("Error al leer el archivo");
    callback("");
  };
}

$('btn-place-order').addEventListener('click', async ()=>{
  if(!cart.length){alert('Tu carrito está vacío');return;}
  
  const nombre=$('input-nombre').value.trim()||'Cliente';
  const telefono=$('input-telefono').value.trim()||'';
  const dir=$('input-direccion').value.trim()||userAddress||'Sin dirección';
  const pago=document.querySelector('input[name="payment"]:checked')?.value||'Pago Móvil';
  
  const orderId = 'ord_' + Date.now() + Math.floor(Math.random()*1000);
  currentOrderId = orderId;
  localStorage.setItem('kupai_order_id', orderId);
  
  // UI Loading
  const btn = $('btn-place-order');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Procesando...';

  // Comprimir comprobante a Base64 si existe
  let receiptBase64 = "";
  if(selectedReceiptFile) {
    receiptBase64 = await new Promise(resolve => compressImageToBase64(selectedReceiptFile, resolve));
  }

  const orderData = {
    id: orderId,
    customer: { name: nombre, phone: telefono, address: dir, lat: userLat||10.48, lng: userLng||-66.90 },
    payment: pago,
    receiptUrl: receiptBase64,
    items: cart.map(c => ({
      qty: c.qty,
      name: c.item.n,
      version: c.version.t,
      price: c.version.p + c.extras.reduce((s,e)=>s+e.p,0),
      extras: c.extras.map(e=>e.t),
      removed: c.removed
    })),
    total: cartTotal(),
    status: "PENDIENTE",
    timestamp: Date.now()
  };

  db.ref('orders/' + orderId).set(orderData).then(() => {
    btn.disabled = false;
    btn.innerHTML = originalText;
    
    const msg=buildWhatsApp(orderId);
    window.open(`https://wa.me/${MI_WHATSAPP}?text=${msg}`,'_blank');
    
    $('overlay-success').classList.remove('hidden');
    const now=new Date();
    const fmt2=d=>d.toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'});
    const t1=new Date(now);const t2=new Date(now.getTime()+5*60000);const t3=new Date(now.getTime()+10*60000);const eta=new Date(now.getTime()+30*60000);
    $('tl-time-1').textContent=fmt2(t1);$('tl-time-2').textContent=fmt2(t2);$('tl-time-3').textContent=fmt2(t3);
    $('eta-time').textContent=fmt2(eta);$('eta-time-2').textContent=fmt2(eta);
    
    listenToOrderStatus(orderId);
  }).catch(err => {
    btn.disabled = false;
    btn.innerHTML = originalText;
    alert("Error al enviar el pedido: " + err.message);
  });
});

$('btn-track-order').addEventListener('click',()=>{
  $('overlay-success').classList.add('hidden');
  cart=[];updateBadge();goTo('tracking');
});
$('btn-back-home-success').addEventListener('click',()=>{
  $('overlay-success').classList.add('hidden');
  cart=[];updateBadge();goBack('checkout');
});

// ─── Search ───────────────────────────────────────────────────────────────────
function renderSearchCategories() {
  const grid = $('search-cat-grid');
  let html = `<div class="search-cat-card cat-all" data-cat="all">
                <span class="search-cat-name">Todo el menú</span>
              </div>`;
  Object.keys(MENU_DATA).forEach((cat, idx) => {
    html += `<div class="search-cat-card" data-cat="${cat}" style="animation-delay: ${(idx+1) * 0.05}s">
                <span class="search-cat-name">${cat}</span>
              </div>`;
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.search-cat-card').forEach(card => {
    card.addEventListener('click', () => {
      activeCategory = card.dataset.cat;
      document.querySelectorAll('.home-cat-card').forEach(p => {
        p.classList.toggle('active', p.dataset.cat === activeCategory);
      });
      renderFeed();
      goTo('home');
      $('screen-home').scrollTop = 0;
      // Reset search field
      $('search-input').value = '';
      $('search-input').dispatchEvent(new Event('input'));
    });
  });
}

$('search-input').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const clearBtn = $('search-clear');
  const catView = $('search-categories-view');
  const resView = $('search-results-view');
  
  if(q === '') {
    clearBtn.style.display = 'none';
    catView.style.display = '';
    resView.style.display = 'none';
  } else {
    clearBtn.style.display = '';
    catView.style.display = 'none';
    resView.style.display = '';
    renderSearchResults(q);
  }
});

$('search-clear').addEventListener('click', () => {
  $('search-input').value = '';
  $('search-input').dispatchEvent(new Event('input'));
  $('search-input').focus();
});

function renderSearchResults(query) {
  const feed = $('search-feed');
  const all = allItems();
  const filtered = all.filter(i => 
    i.n.toLowerCase().includes(query) || 
    i.d.toLowerCase().includes(query) ||
    i.cat.toLowerCase().includes(query)
  );

  $('search-results-label').textContent = `Resultados (${filtered.length})`;
  
  if(filtered.length === 0) {
    feed.innerHTML = `<p style="color:var(--muted);text-align:center;padding:20px 0;grid-column:1/-1;">No se encontraron resultados para "${query}"</p>`;
    return;
  }

  feed.innerHTML = filtered.map((item, idx) => `
      <div class="food-card animate-fade-up" style="animation-delay: ${(idx % 15) * 0.04}s" data-cat="${item.cat}" data-name="${item.n}">
        <div class="food-card-img-wrap">
          <img class="food-card-img" src="${imgSrc(item.n)}" alt="${item.n}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=70'"/>
          <div class="food-card-overlay"></div>
          <div class="food-card-pills">
            <div class="food-card-pill">${fmt(item.v[0].p)}</div>
          </div>
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${item.n}</div>
          <div class="food-card-desc" title="${item.d}">${item.d}</div>
          <div class="food-card-bottom">
            <div>
              <div class="food-card-price">${fmt(item.v[0].p)}</div>
              <div class="food-card-cat" style="display:block;margin-top:4px;">${item.cat}</div>
            </div>
            <button class="food-card-add" data-cat="${item.cat}" data-name="${item.n}" aria-label="Añadir">+</button>
          </div>
        </div>
      </div>`).join('');

  feed.querySelectorAll('.food-card').forEach(c=>{
    c.addEventListener('click',e=>{if(e.target.closest('.food-card-add'))return;openProduct(c.dataset.cat,c.dataset.name);});
  });
  feed.querySelectorAll('.food-card-add').forEach(b=>{
    b.addEventListener('click',e=>{
      e.stopPropagation();
      const it=MENU_DATA[b.dataset.cat]?.find(i=>i.n===b.dataset.name);
      if(it){addToCart(it,b.dataset.cat,1,it.v[0],[],[]);flashBtn(b);}
    });
  });
}

function renderHomeCategories() {
  const grid = $('home-categories-grid');
  if(!grid) return;
  let html = `<div class="home-cat-card active" data-cat="all">
                <span class="home-cat-name">Todo el menú</span>
              </div>`;
  Object.keys(MENU_DATA).forEach((cat) => {
    html += `<div class="home-cat-card" data-cat="${cat}">
                <span class="home-cat-name">${cat}</span>
              </div>`;
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.home-cat-card').forEach(card => {
    card.addEventListener('click', () => {
      activeCategory = card.dataset.cat;
      // Sync styles
      document.querySelectorAll('.home-cat-card').forEach(c => c.classList.toggle('active', c.dataset.cat === activeCategory));
      renderFeed();
    });
  });
}

// ─── Tracking Firebase Sync ───────────────────────────────────────────────────
let orderListenerRef = null;
function listenToOrderStatus(orderId) {
  if(!orderId) return;
  if(orderListenerRef) {
    db.ref('orders/' + orderId).off('value', orderListenerRef);
  }
  orderListenerRef = (snapshot) => {
    const data = snapshot.val();
    if(data) {
      updateTrackingTimeline(data.status);

      // Cuando el pedido pase a EN_CAMINO, activar el listener GPS del repartidor
      if(data.status === 'EN_CAMINO' && trackingMap && !driverLiveMarker) {
        startDriverLocationListener(orderId);
      }
    }
  };
  db.ref('orders/' + orderId).on('value', orderListenerRef);
}

function updateTrackingTimeline(status) {
  const items = document.querySelectorAll('.timeline-item');
  if(!items || items.length < 4) return;
  const ic1 = items[0].querySelector('.tl-icon');
  const ic2 = items[1].querySelector('.tl-icon');
  const ic3 = items[2].querySelector('.tl-icon');
  const ic4 = items[3].querySelector('.tl-icon');

  const lbl2 = items[1].querySelector('.tl-label');
  const lbl3 = items[2].querySelector('.tl-label');
  const lbl4 = items[3].querySelector('.tl-label');

  if(status === 'PENDIENTE') {
    ic1.className = 'tl-icon active'; ic1.innerHTML = '<div class="tl-pulse"></div>';
    ic2.className = 'tl-icon pending'; ic2.innerHTML = '';
    ic3.className = 'tl-icon pending'; ic3.innerHTML = '';
    ic4.className = 'tl-icon pending'; ic4.innerHTML = '';
  } else if(status === 'PREPARANDO') {
    ic1.className = 'tl-icon done'; ic1.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    ic2.className = 'tl-icon active'; ic2.innerHTML = '<div class="tl-pulse"></div>';
    ic3.className = 'tl-icon pending'; ic3.innerHTML = '';
    lbl2.classList.remove('pending-label');
  } else if(status === 'EN_CAMINO') {
    ic1.className = 'tl-icon done';
    ic2.className = 'tl-icon done'; ic2.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    ic3.className = 'tl-icon active'; ic3.innerHTML = '<div class="tl-pulse"></div>';
    lbl3.classList.remove('pending-label');
  } else if(status === 'ENTREGADO') {
    ic1.className = 'tl-icon done';
    ic2.className = 'tl-icon done';
    ic3.className = 'tl-icon done'; ic3.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    ic4.className = 'tl-icon done'; ic4.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    lbl4.classList.remove('pending-label');
    
    // Auto-completar y limpiar
    setTimeout(() => {
      alert("¡Tu pedido ha sido entregado exitosamente!");
      if(orderListenerRef && currentOrderId) {
        db.ref('orders/' + currentOrderId).off('value', orderListenerRef);
      }
      currentOrderId = null;
      localStorage.removeItem('kupai_order_id');
      cart=[]; updateBadge();
      goTo('home');
    }, 2000);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHomeCategories();
renderFeed();
renderSearchCategories();

if (currentOrderId) {
  listenToOrderStatus(currentOrderId);
}
