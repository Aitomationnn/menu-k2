const MENU_DATA = {
  "BURGERS":[
    {n:"YURUANÍ",d:"Pan brioche, res 150g, chuleta ahumada, pollo, tocineta, jamón, huevo, mozzarella, coleslaw, lechuga, tomate, papas cabello ángel.",ing:["Huevo","Cebolla","Coleslaw"],ex:[{t:"Extra Carne 150g",p:0.09},{t:"Extra Pollo 150g",p:0.08},{t:"Extra Chuleta",p:0.06}],v:[{t:"Con Papas",p:0.35}]},
    {n:"AUTANA",d:"Pan brioche ajonjolí, chorizo, res brasileño, huevo, queso amarillo, lechuga, tomate, cebolla, salsa Chick-fil-A.",ing:["Huevo","Cebolla"],ex:[{t:"Extra Res Brasileño",p:0.09},{t:"Extra Chorizo",p:0.05}],v:[{t:"Con Papas",p:0.23}]},
    {n:"TRAMEN",d:"Pan de papa, res 150g, chuleta, tocineta, doble queso americano, cebolla caramelizada, pepinillos.",ing:["Pepinillos","Cebolla"],ex:[{t:"Extra Carne 150g",p:0.09},{t:"Extra Chuleta",p:0.06}],v:[{t:"Con Papas",p:0.25}]},
    {n:"CHIMANTÁ",d:"Pan brioche orégano/parmesano, res 150g estilo italiano, tocineta, mozzarella, mayo-pesto, lechuga romana, tomate.",ing:["Pesto"],ex:[{t:"Extra Carne Italiana 150g",p:0.09},{t:"Extra Mozzarella",p:0.02}],v:[{t:"Con Papas",p:0.20}]},
    {n:"AKOPAN",d:"Pan brioche, 150g lomito, doble queso kraft, mermelada tocineta/cebolla, tocineta, salsa millenium.",ing:["Pepinillos","Mermelada"],ex:[{t:"Extra Lomito 150g",p:0.11},{t:"Extra Queso Kraft",p:0.03}],v:[{t:"Con Papas",p:0.25}]},
    {n:"RORAIMA",d:"Pan de papa, doble blend res 200g americano, doble queso kraft, mermelada tocineta/cebolla, tocineta.",ing:["Pepinillos","Mermelada"],ex:[{t:"Extra Carne Blend 200g",p:0.12}],v:[{t:"Con Papas",p:0.20}]},
    {n:"KUKENÁN",d:"Pan de papa, res 150g colombiano, tocineta, mozzarella y americano, mermelada piña, cebollas encurtidas.",ing:["Mermelada","Pepinillos"],ex:[{t:"Extra Carne 150g",p:0.09}],v:[{t:"Con Papas",p:0.18}]},
    {n:"IGLUTEPUY",d:"Pan brioche, pollo crispy, tocineta, doble mozzarella, salsa ajo, lechuga, tomate, cebolla.",ing:["Cebolla"],ex:[{t:"Extra Pollo crispy",p:0.08},{t:"Extra Mozzarella",p:0.02}],v:[{t:"Con Papas",p:0.16}]},
    {n:"KAMOIRAN",d:"Pan de papa, jugosa carne, queso Kraft fundido, crujiente tocineta, pepinillos y salsa millenium.",ing:["Pepinillos","Tocineta"],v:[{t:"Con Papas",p:0.12}]},
    {n:"SUAPI WEY",d:"Pan de papa, 150g camarones crispy, cebolla morada, lechuga, tomate y salsa tártara especial.",ing:["Cebolla"],ex:[{t:"Extra Camarones Crispy (4 und)",p:0.12}],v:[{t:"Con Papas",p:0.22}]},
    {n:"TRIO MINI BURGERS",d:"Kukenan, Chimantá y Auyantepui en versión mini. La experiencia completa en un solo plato.",ing:[],v:[{t:"Con Papas",p:0.25}]},
    {n:"SOROROPÁN",d:"Pan de papa, pollo a la plancha 120g, tocineta, doble kraft, salsa millenium, lechuga, tomate.",ing:["Cebolla","Pepinillos"],ex:[{t:"Extra Pollo a la Plancha",p:0.07}],v:[{t:"Con Papas",p:0.17}]}
  ],
  "PIZZAS":[
    {n:"KUPAI",d:"Salsa nápoles, queso mozzarella, jamón, tocineta, pepperoni, maíz, aceitunas negras, cebolla y pimentón.",ing:["Cebolla","Pimentón","Aceitunas"],v:[{t:"Pequeña",p:0.15},{t:"Mediana",p:0.25},{t:"Grande",p:0.45}]},
    {n:"MARGARITA",d:"Salsa nápoles y queso mozzarella.",ing:[],v:[{t:"Pequeña",p:0.10},{t:"Mediana",p:0.15},{t:"Grande",p:0.28}]},
    {n:"ESPAÑOLA",d:"Salsa nápoles, queso mozzarella, pepperoni, pimentón y aceitunas negras.",ing:["Aceitunas","Pimentón"],v:[{t:"Pequeña",p:0.12},{t:"Mediana",p:0.20},{t:"Grande",p:0.33}]},
    {n:"TUNA-MEDÁ",d:"Salsa nápoles, queso mozzarella, camarón, pulpo, mejillón, calamar, pimentón, cebolla y orégano.",ing:["Mariscos"],v:[{t:"Pequeña",p:0.20},{t:"Mediana",p:0.33},{t:"Grande",p:0.42}]}
  ],
  "PASTAS":[
    {n:"PUTTANESCA",d:"Salsa Nápoles, aceite de oliva, ajo, aceitunas negras, alcaparras y un toque de anchoas.",ing:["Anchoas","Aceitunas"],v:[{t:"Normal",p:0.12}]},
    {n:"BOLOÑESA",d:"Pasta bañada en nuestra clásica salsa Nápoles y carne cocinada a fuego lento con parmesano.",ing:["Carne"],v:[{t:"Normal",p:0.17}]},
    {n:"PASTICHO",d:"Capas de pasta rellenas de carne con salsa boloñesa, cremosa bechamel, jamón y quesos.",ing:["Bechamel"],v:[{t:"Normal",p:0.23}]},
    {n:"ALFREDO",d:"Salsa extra cremosa a base de crema de leche, bechamel y parmesano, con jamón y maíz.",ing:["Maíz","Jamón"],v:[{t:"Tradicional",p:0.19},{t:"Con pollo",p:0.25},{t:"Pollo y camarones",p:0.31}]},
    {n:"CARBONARA",d:"Extra cremosa a base de crema de leche y bechamel, con parmesano y crujientes trozos de tocineta.",ing:["Tocineta"],v:[{t:"Tradicional",p:0.22},{t:"Con pollo",p:0.25},{t:"Camarón",p:0.27}]},
    {n:"MARINERA",d:"Pasta con salsa Nápoles cargada con calamar, mejillones, langostinos, pulpo y camarones.",ing:["Mariscos"],v:[{t:"Tradicional",p:0.30}]}
  ],
  "ENTRADAS":[
    {n:"CEVICHE",d:"Pescado fresco del día, zumo de limón, cebolla morada, ají dulce, cilantro y chips de plátano.",ing:["Cebolla","Cilantro","Picante"],v:[{t:"Tradicional",p:0.15},{t:"Con frutos del mar",p:0.25},{t:"Frutos del mar compartir",p:0.40}]},
    {n:"ALITAS BBQ",d:"Acompañado de ración de papas francesas, salsa BBQ o BBQ Spicy.",ing:["Salsa BBQ","Picante"],v:[{t:"Snack (8 Piezas)",p:0.15},{t:"Regular (16 Piezas)",p:0.30},{t:"Party (24 Piezas)",p:0.45}]},
    {n:"KUPAI MIX",d:"Combinación de papas fritas, tequeños, alitas BBQ Spicy y tenders de pollo con salsa tártara.",ing:["Salsa Tártara"],v:[{t:"Plato Mix",p:0.30}]},
    {n:"PAPAS FRITAS",d:"300g de papas con ketchup.",ing:["Ketchup"],v:[{t:"Normal",p:0.10}]},
    {n:"PAPAS CHURRY",d:"350g de papas fritas con cheddar y topping de tocineta.",ing:["Cheddar","Tocineta"],v:[{t:"Normal",p:0.15}]},
    {n:"TEQUEÑOS",d:"Ración de 5, con salsa de ajo.",ing:["Salsa de ajo"],v:[{t:"Normal",p:0.10}]},
    {n:"TOSTONES",d:"Ración de 5, con ketchup o ajo.",ing:["Ketchup","Ajo"],v:[{t:"Normal",p:0.10}]},
    {n:"BRUSCHETTA CON CAMARONES",d:"Tres bruschettas artesanales gratinadas con mozzarella y camarones al ajillo.",ing:["Ajo"],v:[{t:"Normal",p:0.15}]}
  ],
  "ENSALADAS":[
    {n:"ENSALADA CÉSAR",d:"Lechuga romana, crutones, aderezo césar, queso parmesano y polvo de tocineta.",ing:["Crutones","Tocineta"],v:[{t:"Tradicional",p:0.10},{t:"Con pollo",p:0.15},{t:"Con camarones",p:0.17},{t:"Con pollo crispy",p:0.20}]},
    {n:"ENSALADA CAPRESE",d:"Queso bocconcini, albahaca, aceite de oliva, tomates cherry y tomates confitados.",ing:["Albahaca"],v:[{t:"Normal",p:0.18}]},
    {n:"ENSALADA COLESLAW",d:"Repollo blanco, repollo morado, zanahoria, maíz y cilantro con aderezo especial.",ing:["Maíz","Cilantro"],v:[{t:"Normal",p:0.10}]}
  ],
  "HOT DOGS":[
    {n:"PERRO ESPECIAL",d:"Salchicha polaca/frankfurt, salsa millenium, sweet relish, cebolla morada, queso amarillo y tocineta.",ing:["Cebolla","Tocineta"],v:[{t:"Normal",p:0.15}]},
    {n:"PERRO ALEMÁN",d:"Salchicha ahumada, papas fritas, mermelada de tocineta y cebolla picada.",ing:["Mermelada"],v:[{t:"Normal",p:0.13}]},
    {n:"PERROS SENCILLOS (X3)",d:"Combo de 3 perros tradicionales con ensalada de repollo, zanahoria, cebolla y salsas.",ing:["Ensalada"],v:[{t:"Combo x3",p:0.15}]}
  ],
  "SALCHIPAPAS":[
    {n:"GOLONDRINA",d:"Papas fritas con carne o pollo, salchicha, tocineta y queso gouda rallado.",ing:["Tocineta"],v:[{t:"Res",p:0.22},{t:"Pollo",p:0.22}]},
    {n:"EL SAPO (MIXTO)",d:"Papas fritas mixtas con carne y pollo, salchicha, tocineta y queso gouda.",ing:["Tocineta"],v:[{t:"Mixto",p:0.27}]},
    {n:"KAWÍ MERÚ",d:"Papas fritas con pollo crispy, salchicha, tocineta y queso gouda.",ing:["Tocineta"],v:[{t:"Pollo Crispy",p:0.25}]}
  ],
  "ARROCES":[
    {n:"PAELLA",d:"Paella cocida con pollo, langostinos, camarones, pulpo, calamar y mejillones en su concha.",ing:["Mejillones"],v:[{t:"Individual",p:0.40},{t:"Para compartir",p:0.70}]},
    {n:"ARROZ CHINO",d:"Chow Fan con jamón, tocineta, cebollín, especias y 2 panes chinos.",ing:["Cebollín"],v:[{t:"Tradicional",p:0.12},{t:"Con pollo",p:0.17},{t:"Con camarón",p:0.19}]}
  ],
  "SOPAS":[
    {n:"ASOPADO DE MARISCOS",d:"Deliciosa sopa estilo aguadito, con camarones, calamares, pulpo, langostino, mejillones y arroz.",ing:["Arroz"],v:[{t:"Normal",p:0.35}]},
    {n:"CAZUELA DE MARISCOS",d:"Guiso de camarones, calamares, pulpo, langostino y mejillón cocinados en sofrito de verduras.",ing:["Verduras"],v:[{t:"Normal",p:0.32}]},
    {n:"SOPA DE COSTILLA",d:"(SOLO DOMINGOS) Costilla de res con rabito, acompañado de limón, casabe, arepas o arroz.",ing:["Verdura"],v:[{t:"1 Porción",p:0.10},{t:"2 Porciones",p:0.18}]}
  ],
  "LOS CLÁSICOS":[
    {n:"SÁNDWICH",d:"3 capas de pan tostado, jamón, queso amarillo, lechuga y tomate.",ing:["Tomate","Lechuga"],v:[{t:"Normal",p:0.06}]},
    {n:"CLUB HOUSE",d:"Pollo a la plancha o crispy, tocineta, jamón, huevo, queso amarillo y papas fritas.",ing:["Huevo","Tocineta"],v:[{t:"Pollo Plancha",p:0.22},{t:"Pollo Crispy",p:0.27}]},
    {n:"ENROLLADOS",d:"Pan árabe relleno de carne o pollo, perejil, lechuga, tomate y cebolla.",ing:["Cebolla","Perejil"],v:[{t:"Tradicional",p:0.22},{t:"Full Equipo",p:0.30}]}
  ]
};

function normalizar(n){return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,'-').replace(/[^\w\-]+/g,'');}
function imgSrc(name){return `REFERENCIAS/img/${normalizar(name)}.jpg`;}
function fmt(n){return n.toFixed(2);}
const MI_WHATSAPP="584124452413";
