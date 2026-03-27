import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://zephobibrftatzmagjta.supabase.co";
const supabaseKey = "sb_publishable_WFqb8AOLj0GAUq3UJ364kA_vU9tIAXL";
const sb = createClient(supabaseUrl, supabaseKey);

// Variables globales
let organizadorViaje = null;
let appContent, hamburgerBtn, navItems;
let currentViajeId = null;

async function checkAuthAndInit() {
    appContent = document.getElementById('app-content');
    hamburgerBtn = document.getElementById('hamburger-btn');
    navItems = document.querySelectorAll('.nav-item');

    const { data: { session } } = await sb.auth.getSession();
    
    if (session) {
        // ¿Venimos desde el botón del Admin?
        const urlParams = new URLSearchParams(window.location.search);
        const goToViaje = urlParams.get('viaje');
        
        if (goToViaje) {
            // Limpiamos la URL para que quede bonita (index.html a secas)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Buscamos el nombre de ese viaje para ponerlo en el menú de carga
            const { data } = await sb.from('viajes').select('nombre').eq('id', goToViaje).single();
            if (data) {
                selectTrip(goToViaje, data.nombre); // ¡Entramos directos!
                return;
            }
        }
        
        // Si no venimos del admin, cargamos la lista normal
        loadUserTrips();
    } else {
        document.getElementById('trip-selection-container').style.display = 'none';
        appContent.style.display = 'block';
        renderLogin();
    }
}

// Escuchar cambios de estado
sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        // Usuario no logueado: Ocultar selector de viajes, mostrar appContent y renderizar login
        if(hamburgerBtn) hamburgerBtn.classList.add('hidden');
        document.getElementById('trip-selection-container').style.display = 'none';
        appContent.style.display = 'block'; // Aseguramos que el main es visible
        renderLogin();
    }
});

function renderLogin() {
    if(hamburgerBtn) hamburgerBtn.classList.add('hidden');
    
    appContent.innerHTML = `
        <div class="fade-in h-full flex flex-col items-center justify-center mt-10">
            <i class="fas fa-lock text-5xl text-[var(--gryffindor-red)] mb-6 filter drop-shadow-md"></i>
            <h1 class="text-3xl font-bold text-center magic-font mb-8">El Andén 9 ¾</h1>
            
            <div class="parchment-box p-8 rounded-lg w-full max-w-sm text-center">
                <p class="text-sm italic text-stone-700 mb-6 font-bold">Identifícate, joven mago, para entrar.</p>
                
                <form id="login-form" class="space-y-4">
                    <input type="email" id="magic-email" placeholder="Correo mágico..." required
                        class="w-full p-3 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg">
                    
                    <input type="password" id="magic-password" placeholder="Contraseña..." required
                        class="w-full p-3 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg tracking-widest">
                    
                    <button type="submit" id="login-btn" class="w-full bg-[var(--gryffindor-red)] text-white font-bold py-3 rounded shadow-md active:scale-95 transition mt-4">
                        <i class="fas fa-wand-magic-sparkles mr-2"></i> Iniciar Sesión (Alohomora)
                    </button>
                    
                    <button type="button" id="signup-btn" class="w-full bg-[#2b1b17] text-[var(--gold)] font-bold py-3 rounded shadow-md active:scale-95 transition mt-2 border border-[var(--gold)]">
                        <i class="fas fa-user-plus mr-2"></i> Crear nueva cuenta
                    </button>
                    
                    <p id="login-error" class="text-red-600 text-sm hidden font-bold mt-2"></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignUp);
}

async function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('magic-email').value; // Captura email
    const passwordInput = document.getElementById('magic-password').value;
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Revelando...`;
    btn.disabled = true;

    const { error } = await sb.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        errorMsg.textContent = "Credenciales incorrectas. ¡Muggle detectado!";
        errorMsg.classList.remove('hidden');
        btn.innerHTML = `<i class="fas fa-wand-magic-sparkles mr-2"></i> Alohomora`;
        btn.disabled = false;
    } else {
        // AQUÍ ESTÁ LA CLAVE: 
        // En lugar de inyectar el spinner y llamar a fetchTravelData() directamente,
        // vaciamos el appContent y llamamos a loadUserTrips() para que el usuario elija su viaje.
        appContent.innerHTML = ''; 
        loadUserTrips();
    }
}

// Iniciar la app
document.addEventListener('DOMContentLoaded', checkAuthAndInit);

// --- FETCH DE DATOS DESDE SUPABASE (MAGIA RELACIONAL 3FN) ---
async function fetchTravelData() {
    try {

    // 1. Intentar cargar de caché primero
        const cacheKey = 'travel_data_cache_' + currentViajeId;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            organizadorViaje = JSON.parse(cached);
            renderHome();
            toggleLogoutButton(true);
            // Seguimos descargando en segundo plano para actualizar por si hubo cambios
        }

        const [
            { data: configData, error: configErr },
            { data: diasData, error: diasErr },
            { data: superData },
            { data: secretosData },
            { data: restTopData },
            { data: checkData },
            { data: gastosData },
            { data: transData },  // <-- NUEVA VARIABLE
            { data: pasesData },   // <-- NUEVA VARIABLE
            { data: actividadesPaseData } // <--- NUEVA VARIABLE
        ] = await Promise.all([
            // Cambiamos .single() por .maybeSingle() para que no falle si está vacío
            sb.from('configuracion').select('*').eq('viaje_id', currentViajeId).maybeSingle(),
            
            sb.from('dias').select(`
                *,
                dia_actividad (
                    hora,
                    actividades (
                        nombre, desc_texto, tipo, direccion, precio, contexto, checklist_id,
                        actividad_items ( item_texto, descripcion, imagen_url )
                    )
                ),
                restaurantes_dia (*)
            `).eq('viaje_id', currentViajeId).order('fecha', { ascending: true }),
            
            sb.from('supermercados').select('*').eq('viaje_id', currentViajeId),
            sb.from('secretos').select('*').eq('viaje_id', currentViajeId),
            sb.from('restaurantes_top').select('*').eq('viaje_id', currentViajeId),
            sb.from('checklist').select('*').eq('viaje_id', currentViajeId).order('id', { ascending: true }),
            sb.from('gastos').select('*').eq('viaje_id', currentViajeId).order('created_at', { ascending: true }),
            
            // --- NUEVAS CONSULTAS ---
            sb.from('transportes').select('*').eq('viaje_id', currentViajeId).maybeSingle(),
            sb.from('pases_turisticos').select('*').eq('viaje_id', currentViajeId).maybeSingle(),
            sb.from('actividades_pase').select('*').eq('viaje_id', currentViajeId)
        ]);

        if (configErr || diasErr) throw new Error("Fallo al leer datos");

        // RECONSTRUCCIÓN (ADAPTADOR PATTERN)
        organizadorViaje = {
            config: {
                titulo: configData?.titulo || '', 
                subtitulo: configData?.subtitulo || '',
                presupuesto: configData?.presupuesto || '', 
                base: configData?.base || '',
                tasa_cambio: configData?.tasa_cambio || 1, // Por defecto 1
                lat_centro: configData?.lat_centro || 51.5074, // Londres por defecto
                long_centro: configData?.long_centro || -0.1278
            },
            intro: {
                texto: configData?.intro_texto || '', 
                alojamiento: configData?.intro_alojamiento || ''
            },
            dias: (diasData || []).map(dia => ({
                id: dia.id, 
                fecha: formatearFecha(dia.fecha),
                titulo: dia.titulo || '', 
                icono: dia.icono || 'fa-circle',
                resumen: dia.resumen || '', 
                curiosidad_hp: dia.curiosidad_hp || null,
                historia_dia: dia.historia_dia || null, 
                nota_dia: dia.nota_dia || null,
                
                timeline: (dia.dia_actividad || []).map(relacion => {
                    const act = relacion.actividades || {};
                    const listaItems = act.actividad_items || [];

                    // --- 1. NUEVA LÓGICA: BUSCAR IMAGEN ASOCIADA ---
                    let finalImgUrl = act.imagen_url || null; // Coge la de la actividad por defecto
                    if (act.checklist_id && checkData) {
                        // Buscamos el ítem del checklist correspondiente
                        const checklistAsociado = checkData.find(c => c.id === act.checklist_id);
                        if (checklistAsociado && checklistAsociado.imagen_url) {
                            finalImgUrl = checklistAsociado.imagen_url; // Sobrescribimos con la del checklist
                        }
                    }        

                    // En app.js, dentro de fetchTravelData(), cambia esto:
                    let detallesObj = null;
                    if (act.contexto || listaItems.length > 0) {
                        detallesObj = {
                            contexto: act.contexto || "",
                            lista_ver: listaItems.map(item => ({
                                texto: item.item_texto || "",
                                desc: item.descripcion || null,
                                img: item.imagen_url || null
                            }))
                        };
                    }

                    return {
                        hora: relacion.hora || '',
                        actividad: act.nombre || 'Actividad desconocida',
                        desc: act.desc_texto || null,
                        tipo: act.tipo || 'visita',
                        direccion: act.direccion || null,
                        imagen_url: finalImgUrl, // <--- 2. USAMOS LA NUEVA VARIABLE AQUÍ
                        precio: act.precio || null,
                        detalles: detallesObj
                    };
                }).sort((a, b) => (a.hora || "").localeCompare(b.hora || "")),
                
                restaurantes: (dia.restaurantes_dia || []).map(r => ({
                    nombre: r.nombre || '', desc: r.desc_texto || '', precio: r.precio || '', loc: r.loc || null
                }))
            })),
            supermercados: superData || [],
            curiosidades_extra: secretosData || [],
            restaurantes_lista: restTopData || [],
            // NUEVO: Ahora guardamos el objeto completo del checklist y los gastos
            checklist: checkData || [], 
            gastos: gastosData || [],
            // Textos estáticos (no los pasamos a tabla porque son constantes)
            transporte: {
                // Si no hay datos (viaje nuevo), ponemos un texto por defecto
                consejo_oro: transData?.consejo_oro || "Regla de oro no configurada.",
                detalle: transData?.detalle || "Detalles de transporte no configurados.",
                // Separamos por comas si existe, si no, array vacío
                apps: transData?.apps ? transData.apps.split(',').map(app => app.trim()) : []
            },
            explorer_pass: {
                titulo: pasesData?.titulo || "Pase Turístico",
                subtitulo: pasesData?.subtitulo || "No configurado",
                precio_total: pasesData?.precio_total || "-",
                precio_pp: pasesData?.precio_pp || "-",
                info: pasesData?.info || "Añade la información del pase en el panel de administración.",
                
                // Las actividades del pase las dejamos vacías por ahora para no sobrecomplicar la BBDD.
                // Podrías crear una tabla 'actividades_pase' en el futuro si quieres.
                actividades: actividadesPaseData || []
            }
        };

        // ACTUALIZAR EL TÍTULO DE LA PESTAÑA DEL NAVEGADOR
        document.title = organizadorViaje.config.titulo || "Expedición";
        
        // Guardar en caché para la próxima vez
        localStorage.setItem(cacheKey, JSON.stringify(organizadorViaje));

        // MOSTRAMOS EL BOTÓN HAMBURGUESA EN VEZ DE LA ANTIGUA BARRA
        if(hamburgerBtn) hamburgerBtn.classList.remove('hidden');
        toggleLogoutButton(true);
        if (!cached) renderHome();  

    } catch (error) {
        console.error("Error:", error);
        appContent.innerHTML = `...`;
        // Si el botón de login sigue ahí, hay que resetearlo
        const btn = document.getElementById('login-btn');
        if(btn) btn.disabled = false;       
    }
}

function setActiveNav(id) {
    navItems.forEach(item => {
        item.classList.remove('active', 'text-[var(--gold)]', 'bg-white/10');
        item.classList.add('text-gray-400');
    });
    const activeItem = document.getElementById(id);
    if(activeItem) {
        activeItem.classList.remove('text-gray-400');
        activeItem.classList.add('active', 'text-[var(--gold)]', 'bg-white/10');
    }
}


// ==========================================
// --- FUNCIONES DE RENDERIZADO VISUAL ---
// ==========================================

function renderHome() {
    setActiveNav('nav-home');
    appContent.innerHTML = `
        <div class="fade-in">
            <div class="text-center mb-6 pt-4">
                <i class="fas fa-hat-wizard text-5xl text-[var(--gryffindor-red)] mb-3 filter drop-shadow-md"></i>
                <h1 class="text-3xl font-bold text-[var(--gryffindor-red)] mb-1">${organizadorViaje.config.titulo}</h1>
                <p class="text-xl italic font-bold text-stone-700">${organizadorViaje.config.subtitulo}</p>
                <p class="text-sm mt-3 font-bold bg-yellow-100/80 inline-block px-4 py-1.5 rounded-full border border-yellow-400 shadow-sm">
                    <i class="fas fa-home"></i> Base: ${organizadorViaje.config.base}
                </p>
            </div>

            <div class="parchment-box p-6 rounded-lg mb-6 transform">
                <h2 class="text-xl font-bold mb-3 border-b border-[var(--ink)] pb-2 flex items-center gap-2">
                    <i class="fas fa-scroll text-[var(--gryffindor-red)]"></i> Contexto
                </h2>
                <p class="text-base leading-relaxed text-justify mb-4 font-medium text-stone-800">
                    ${organizadorViaje.intro.texto}
                </p>
                <div class="flex items-start gap-3 text-sm font-bold text-[var(--gryffindor-red)] bg-white/50 p-2 rounded">
                    <i class="fas fa-bed mt-1"></i> 
                    <span>${organizadorViaje.intro.alojamiento}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="parchment-box p-4 rounded text-center active:bg-yellow-100 transition" onclick="renderItineraryList()">
                    <i class="fas fa-map-marked-alt text-3xl mb-2 text-[var(--gryffindor-red)]"></i>
                    <h3 class="font-bold" style="cursor:pointer">Itinerario</h3>
                    <p class="text-xs text-gray-600">Día a día</p>
                </div>
                <div class="parchment-box p-4 rounded text-center active:bg-yellow-100 transition" onclick="renderTransport()">
                    <i class="fas fa-bus text-3xl mb-2 text-[var(--gryffindor-red)]"></i>
                    <h3 class="font-bold" style="cursor:pointer">Transporte</h3>
                    <p class="text-xs text-gray-600">Oyster & Metro</p>
                </div>
            </div>

            <div class="parchment-box p-5 rounded-lg bg-red-50 border-red-200 mb-4">
                <h3 class="font-bold text-[var(--gryffindor-red)] mb-2 flex items-center gap-2">
                    <i class="fas fa-coins"></i> Presupuesto
                </h3>
                <p class="text-sm italic mb-2 font-bold">Objetivo: ${organizadorViaje.config.presupuesto}</p>
            </div>
        </div>
        <button onclick="generarGuiaPDF()" class="w-full parchment-box p-4 rounded-lg shadow-md flex items-center justify-center gap-3 mt-6 bg-red-50 border-[var(--gold)] active:scale-95 transition-all">
            <i class="fas fa-file-pdf text-2xl text-[var(--gryffindor-red)]"></i>
            <span class="font-bold magic-font text-[var(--ink)]">Descargar Guía Mágica (PDF)</span>
        </button>
    `;

    
}

function renderItineraryList() {
    setActiveNav('nav-itin');
    let html = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-quidditch"></i> Diario de Viaje
            </h2>
            <div class="space-y-4">
    `;

    organizadorViaje.dias.forEach(dia => {
        html += `
            <div onclick="renderDayDetail(${dia.id})" class="parchment-box p-4 rounded-lg flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform select-none">
                <div class="bg-[var(--gryffindor-red)] text-white w-12 h-12 rounded-full flex items-center justify-center border-2 border-[var(--gold)] shadow-md shrink-0">
                    <i class="fas ${dia.icono} text-lg"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-lg leading-tight text-[var(--ink)]">${dia.titulo}</h3>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">${dia.fecha}</p>
                    <p class="text-sm italic mt-1 line-clamp-2 text-stone-600">${dia.resumen}</p>
                </div>
                <div class="text-[var(--gryffindor-red)] opacity-50">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    appContent.innerHTML = html;
}

function renderDayDetail(id) {
    const dia = organizadorViaje.dias.find(d => d.id === id);
    if (!dia) return;

    document.getElementById('app-content').scrollTo(0,0);

    let html = `
        <div class="fade-in">
            <button onclick="renderItineraryList()" class="mb-4 text-sm font-bold text-[var(--gryffindor-red)] flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-red-100 shadow-sm active:bg-red-50">
                <i class="fas fa-arrow-left"></i> Volver al Diario
            </button>

            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-[var(--gryffindor-red)] mb-1">${dia.titulo}</h2>
                <p class="text-md font-bold text-gray-600 uppercase tracking-widest">${dia.fecha}</p>
                ${dia.nota_dia ? `
                <div class="mt-4 text-center">
                    <span class="handwritten text-xl text-red-900 bg-yellow-50 px-4 py-2 rounded shadow-sm inline-block transform -rotate-1 border border-yellow-200">
                        "${dia.nota_dia}"
                    </span>
                </div>
                ` : ''}
            </div>

            ${dia.historia_dia ? `
            <div class="parchment-box p-4 rounded mb-8 bg-yellow-50 border-yellow-300">
                <div class="flex gap-4 items-start">
                    <i class="fas fa-book text-3xl text-[var(--ink)] mt-1 opacity-80"></i>
                    <div>
                        <h4 class="font-bold text-xs uppercase tracking-widest mb-1 text-[var(--gryffindor-red)]">Resumen del día</h4>
                        <p class="text-base leading-snug font-medium text-stone-800">${dia.historia_dia}</p>
                    </div>
                </div>
            </div>` : ''}
            
            ${dia.curiosidad_hp ? `
            <div class="parchment-box p-4 rounded mb-8 bg-yellow-50 border-yellow-300">
                <div class="flex gap-4 items-start">
                    <i class="fas fa-glasses text-3xl text-[var(--ink)] mt-1 opacity-80"></i>
                    <div>
                        <h4 class="font-bold text-xs uppercase tracking-widest mb-1 text-[var(--gryffindor-red)]">Dato Mágico</h4>
                        <p class="text-base leading-snug font-medium text-stone-800">${dia.curiosidad_hp}</p>
                    </div>
                </div>
            </div>` : ''}

            <div class="relative ml-2 space-y-8 timeline-line pl-6 mb-8">
    `;

    dia.timeline.forEach((item, index) => {
        let icon = 'fa-circle';
        if(item.tipo === 'transporte') icon = 'fa-train-subway';
        if(item.tipo === 'comida') icon = 'fa-utensils';
        if(item.tipo === 'visita') icon = 'fa-eye';
        if(item.tipo === 'museo') icon = 'fa-building-columns';
        if(item.tipo === 'check') icon = 'fa-check-double';
        if(item.tipo === 'caminar') icon = 'fa-walking';
        if(item.tipo === 'relax') icon = 'fa-leaf';

        const hasDetails = item.detalles ? true : false;

        html += `
            <div class="relative group">
                <div class="absolute -left-[35px] bg-[var(--parchment)] border-2 border-[var(--gryffindor-red)] rounded-full w-9 h-9 flex items-center justify-center text-[var(--gryffindor-red)] text-sm z-10 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                
                <div class="bg-white/80 p-4 rounded-lg shadow-sm border border-stone-200">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-lg leading-tight text-[var(--ink)] pr-2">${item.actividad}</h4>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <span class="bg-stone-200 text-xs px-2 py-1 rounded font-mono font-bold text-stone-700 whitespace-nowrap">${item.hora}</span>
                            ${item.precio ? `<span class="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200 shadow-sm">${item.precio}</span>` : ''}
                        </div>
                    </div>
                    <p class="text-stone-700 text-base mb-3 leading-relaxed">${item.desc || ''}</p>

                    <div class="flex flex-wrap gap-2 mt-2">
                        ${item.direccion ? `
                        <button onclick="openMap('${item.direccion}')" class="text-xs bg-[var(--ink)] text-white px-3 py-1.5 rounded flex items-center gap-2 active:scale-95 transition">
                            <i class="fas fa-location-arrow"></i> Ir
                        </button>` : ''}

                        ${hasDetails ? `
                        <button onclick="renderSecretDetails(${dia.id}, ${index})" class="btn-reveal text-xs group">
                            <i class="fas fa-wand-sparkles text-[var(--gryffindor-red)] group-active:text-white"></i> Revelar Secretos
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (dia.restaurantes && dia.restaurantes.length > 0) {
        html += `
            <div class="mt-8 pt-6 border-t border-[var(--gryffindor-red)] mb-4">
                <h3 class="font-bold text-xl mb-4 flex items-center gap-2 text-[var(--ink)]">
                    <i class="fas fa-utensils text-[var(--gold)]"></i> Dónde comer hoy
                </h3>
                <div class="grid gap-3">
        `;
        dia.restaurantes.forEach(rest => {
            html += `
                <div class="parchment-box p-4 rounded flex justify-between items-center shadow-sm">
                    <div>
                        <h4 class="font-bold text-base text-[var(--gryffindor-red)]">${rest.nombre}</h4>
                        <p class="text-sm italic text-stone-600">${rest.desc}</p>
                    </div>
                    <div class="text-right pl-2 shrink-0">
                        <span class="block text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded mb-1 text-center">${rest.precio}</span>
                        ${rest.loc ? `<button onclick="openMap('${rest.loc}')" class="text-xs font-bold text-blue-700 p-1">Mapa <i class="fas fa-external-link-alt text-[10px]"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    html += `</div>`;
    appContent.innerHTML = html;
}

function renderSecretDetails(diaId, itemIndex) {
    const dia = organizadorViaje.dias.find(d => d.id === diaId);
    if (!dia) return;
    const item = dia.timeline[itemIndex];
    if (!item || !item.detalles) return;

    document.getElementById('app-content').scrollTo(0,0);

    // Si tiene imagen, le aplicamos un diseño tipo marco antiguo
    const imagenPortada = item.imagen_url ? `
        <div class="mb-6 relative rounded-lg overflow-hidden border-4 border-double border-[var(--gold)] shadow-lg">
            <img src="${item.imagen_url}" class="w-full h-48 sm:h-64 object-cover filter contrast-110 sepia-[0.2]" alt="${item.actividad}">
            <div class="absolute inset-0 bg-gradient-to-t from-[#2b1b17] via-transparent to-transparent opacity-80"></div>
            <h2 class="absolute bottom-4 left-0 w-full text-center text-3xl font-bold text-white magic-font drop-shadow-lg px-4">${item.actividad}</h2>
        </div>
    ` : `
        <div class="text-center mb-6">
            <i class="fas fa-star text-3xl text-[var(--gold)] mb-2 animate-pulse"></i>
            <h2 class="text-3xl font-bold text-[var(--gryffindor-red)] magic-font leading-tight">${item.actividad}</h2>
        </div>
    `;

    let html = `
        <div class="fade-in pb-10">
            <button onclick="renderDayDetail(${diaId})" class="mb-6 text-sm font-bold text-[var(--gryffindor-red)] flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-red-100 shadow-sm active:bg-red-50 relative z-10">
                <i class="fas fa-arrow-left"></i> Volver al Día
            </button>
            
            <div class="secret-page-border mb-6">
                
                ${imagenPortada}

                <div class="text-center mb-6">
                    <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">Archivo Secreto</p>
                </div>

                <div class="mb-8">
                    <h3 class="magic-font text-xl font-bold mb-3 border-b-2 border-[var(--ink)] pb-1 inline-block">Historia y Contexto</h3>
                    <p class="text-lg leading-relaxed text-justify text-stone-800 font-medium">
                        <i class="fas fa-quote-left text-[var(--gryffindor-red)] text-xl mr-2"></i>
                        ${item.detalles.contexto}
                    </p>
                </div>      

                ${item.detalles.lista_ver.length > 0 ? `
                <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-200 shadow-inner">
                    <h3 class="magic-font text-lg font-bold mb-4 flex items-center gap-2 text-[var(--ink)]">
                        <i class="fas fa-eye text-[var(--gryffindor-red)]"></i> Lo que no te puedes perder
                    </h3>
                    <ul class="space-y-3">
                        ${item.detalles.lista_ver.map(li => {
                            if (li.desc || li.img) {
                                // Si tiene descripción o imagen, creamos un acordeón desplegable
                                return `
                                <li class="bg-white/80 rounded border border-[var(--gold)] overflow-hidden shadow-sm">
                                    <details class="group">
                                        <summary class="flex justify-between items-center p-3 cursor-pointer list-none hover:bg-white transition text-stone-800">
                                            <div class="flex items-center gap-3">
                                                <i class="fas fa-plus-circle text-[var(--gold)] shrink-0 group-open:hidden"></i>
                                                <i class="fas fa-minus-circle text-[var(--gryffindor-red)] shrink-0 hidden group-open:block"></i>
                                                <span class="font-bold">${li.texto}</span>
                                            </div>
                                        </summary>
                                        <div class="p-4 border-t border-[var(--gold)]/30 text-stone-700 text-base leading-relaxed bg-[#fffef0] font-medium">
                                            ${li.img ? `<img src="${li.img}" class="w-full h-40 sm:h-56 object-cover rounded mb-3 border border-stone-300 shadow-sm" alt="${li.texto}">` : ''}
                                            ${li.desc ? `<p class="italic">"${li.desc}"</p>` : ''}
                                        </div>
                                    </details>
                                </li>`;
                            } else {
                                // Si solo es texto, lo dejamos como una lista normal
                                return `
                                <li class="flex items-start gap-3 p-3">
                                    <i class="fas fa-check-circle text-[var(--gold)] mt-1 shrink-0"></i>
                                    <span class="text-base text-stone-800 font-medium">${li.texto}</span>
                                </li>`;
                            }
                        }).join('')}
                    </ul>
                </div>` : ''}
            </div>
        </div>
    `;
    
    appContent.innerHTML = html;
}

function renderTransport() {
    setActiveNav('nav-trans');
    appContent.innerHTML = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-bus-alt"></i> Transporte Mágico
            </h2>

            <div class="parchment-box p-6 rounded-lg mb-6 text-center border-l-4 border-yellow-500 shadow-md">
                <h3 class="font-bold text-lg mb-2 flex justify-center items-center gap-2"><i class="fas fa-exclamation-circle text-yellow-600"></i> REGLA DE ORO</h3>
                <p class="text-xl font-bold text-[var(--gryffindor-red)] my-3">${organizadorViaje.transporte.consejo_oro}</p>
            </div>

            <div class="bg-white/70 p-5 rounded-lg shadow mb-6 border border-stone-200">
                <h3 class="font-bold mb-3 border-b border-gray-300 pb-2">Detalles</h3>
                <p class="text-base mb-3 text-justify text-stone-800">${organizadorViaje.transporte.detalle}</p>
            </div>

            <h3 class="font-bold mb-3 px-1">Apps Esenciales</h3>
            <div class="grid grid-cols-3 gap-3 mb-6">
                ${organizadorViaje.transporte.apps.map(app => `
                    <div class="bg-stone-800 text-white p-2 rounded-lg text-center text-xs flex flex-col items-center justify-center h-24 shadow-lg border-b-4 border-stone-900 active:scale-95 transition">
                        <i class="fas fa-mobile-alt text-2xl mb-2 text-[var(--gold)]"></i>
                        <span class="font-bold">${app}</span>
                    </div>
                `).join('')}
            </div>

            <div class="parchment-box p-5 rounded-lg">
                <h4 class="font-bold mb-3 text-sm uppercase tracking-wider text-[var(--ink)]">Transporte Especial</h4>
                </ul>
            </div>
        </div>
    `;
}

function renderFood() {
    setActiveNav('nav-food');
    let html = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-drumstick-bite"></i> El Gran Comedor
            </h2>

            <div class="mb-8">
                <h3 class="font-bold text-lg mb-3 px-3 border-l-4 border-green-600 bg-green-50 py-2 rounded-r">Supermercados (Base)</h3>
                <div class="space-y-3">
    `;
    
    organizadorViaje.supermercados.forEach(superm => {
        html += `
            <div class="bg-white p-4 rounded shadow-sm border-l-2 border-green-500">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-green-800 text-lg">${superm.nombre}</h4>
                </div>
                <p class="text-sm text-gray-700 mt-1">${superm.desc_texto}</p>
                ${superm.estrategia ? `<p class="text-sm italic mt-2 text-gray-600 bg-green-50 p-2 rounded border border-green-100"><i class="fas fa-lightbulb text-yellow-500"></i> ${superm.estrategia}</p>` : ''}
            </div>
        `;
    });

    html += `
                </div>
            </div>
            <div>
                <h3 class="font-bold text-lg mb-3 px-3 border-l-4 border-[var(--gryffindor-red)] bg-red-50 py-2 rounded-r">Restaurantes Favoritos</h3>
                <div class="grid gap-4">
    `;

    organizadorViaje.restaurantes_lista.forEach(rest => {
        html += `
            <div class="parchment-box p-4 rounded relative overflow-hidden shadow-sm">
                <div class="absolute top-0 right-0 bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold px-3 py-1 rounded-bl shadow-sm">${rest.tipo}</div>
                <h4 class="font-bold text-xl mt-1 text-[var(--gryffindor-red)]">${rest.nombre}</h4>
                <p class="text-base mb-3 italic text-stone-700">"${rest.nota}"</p>
                <div class="flex justify-between items-center mt-2 border-t border-stone-300 pt-3">
                    <span class="text-xs font-bold bg-stone-200 px-3 py-1 rounded text-stone-700">${rest.precio}</span>
                    <button onclick="openMap('${rest.nombre} London')" class="text-xs text-blue-700 font-bold flex items-center gap-1 p-2 active:bg-blue-50 rounded"><i class="fas fa-map-marker-alt"></i> Ver Mapa</button>
                </div>
            </div>
        `;
    });

    html += `</div></div></div>`;
    appContent.innerHTML = html;
}

// ==========================================
// --- CHECKLIST CONECTADO A SUPABASE ---
// ==========================================
// En app.js
function renderExtras() {
    setActiveNav('nav-extra');
    
    let html = `
        <div class="fade-in pb-10">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-key"></i> Sala de Menesteres
            </h2>

            <div class="mb-8 text-center px-4">
                <h3 class="magic-font text-xl font-bold mb-4 underline decoration-[var(--gold)]">Mapa del Merodeador</h3>
                <button onclick="openFullscreenMap()" class="parchment-box p-6 rounded-lg shadow-md w-full flex flex-col items-center justify-center active:scale-95 transition border-2 border-[var(--gold)] hover:bg-yellow-50 group">
                    <i class="fas fa-map text-6xl text-[var(--gryffindor-red)] mb-3 group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-lg text-[var(--ink)] magic-font">Revelar Mapa</span>
                    <p class="text-center text-xs italic mt-3 font-bold text-stone-600">"Juro solemnemente que mis intenciones no son buenas"</p>
                </button>
            </div>

            <div class="mb-8">
                <h3 class="magic-font text-xl font-bold mb-4 text-center underline decoration-[var(--gold)]">Misiones del Ministerio</h3>
                <div class="bg-white p-5 rounded-lg shadow-md border border-stone-200">
                    <ul class="space-y-3" id="checklist-container">
                        ${organizadorViaje.checklist.map(item => {
                            const isChecked = item.completado ? 'checked' : '';
                            const textStyle = item.completado ? 'line-through text-gray-400' : 'text-stone-800';
                            return `
                                <li class="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                    <input type="checkbox" id="check-${item.id}" onchange="toggleChecklist(${item.id}, ${item.completado})" ${isChecked} class="w-6 h-6 mt-1 accent-[var(--gryffindor-red)] cursor-pointer shrink-0">
                                    <label for="check-${item.id}" class="text-lg handwritten leading-tight flex-1 cursor-pointer select-none transition-all ${textStyle}">${item.item}</label>
                                </li>`;
                        }).join('')}
                    </ul>
                </div>
            </div>

            <div class="mb-8 px-4">
                <button onclick="toggleSecretos()" class="w-full parchment-box p-4 rounded-lg shadow-md flex items-center justify-between active:scale-95 transition border border-[var(--gold)] hover:bg-yellow-50 focus:outline-none">
                    <span class="font-bold text-lg text-[var(--gryffindor-red)] magic-font"><i class="fas fa-wand-sparkles mr-2 text-[var(--gold)]"></i> Revela tus secretos</span>
                    <i id="secretos-chevron" class="fas fa-chevron-down text-[var(--gryffindor-red)] transition-transform duration-300"></i>
                </button>
                
                <div id="secretos-content" class="hidden mt-4 space-y-4 fade-in">
                    ${organizadorViaje.curiosidades_extra.map(curio => `
                        <div class="parchment-box p-5 rounded-lg">
                            <h4 class="font-bold text-[var(--gryffindor-red)] mb-2 flex items-center gap-2"><i class="fas fa-star text-sm text-[var(--gold)]"></i> ${curio.titulo}</h4>
                            <p class="text-base leading-relaxed text-stone-800">${curio.texto}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div id="fullscreen-map-container" class="fixed inset-0 z-[100] hidden bg-[var(--parchment)] flex-col">
            <div class="p-4 bg-[#2b1b17] text-[var(--gold)] flex justify-between items-center z-10 border-b-2 border-[var(--gold)] shadow-md shrink-0">
                <span class="magic-font text-xl"><i class="fas fa-shoe-prints mr-2"></i>Mapa Activo</span>
                <button onclick="closeFullscreenMap()" class="text-white bg-[var(--gryffindor-red)] px-4 py-2 rounded shadow-md border border-[var(--gold)] hover:bg-red-900 transition active:scale-95 flex items-center gap-2 font-bold magic-font tracking-wide">
                    <i class="fas fa-map-pin"></i> Cerrar
                </button>
            </div>
            <div id="london-map" class="flex-1 w-full relative z-0 bg-[var(--parchment)]"></div>
            <div class="p-3 bg-[#2b1b17] text-center z-10 border-t-2 border-[var(--gold)] shrink-0">
                <span class="text-sm font-bold italic text-[var(--gold)] opacity-80">"Travesura realizada"</span>
            </div>
        </div>
    `;
    appContent.innerHTML = html;
}

window.openFullscreenMap = function() {
    const mapContainer = document.getElementById('fullscreen-map-container');
    if(mapContainer) {
        // Mostramos el contenedor con flexbox
        mapContainer.classList.remove('hidden');
        mapContainer.classList.add('flex');
        
        // Inicializamos el mapa con un pequeño retraso para que Leaflet detecte el alto y ancho de la pantalla completa
        setTimeout(initMapaDinamico, 150);
    }
}

window.closeFullscreenMap = function() {
    const mapContainer = document.getElementById('fullscreen-map-container');
    if(mapContainer) {
        // Ocultamos el contenedor
        mapContainer.classList.add('hidden');
        mapContainer.classList.remove('flex');
    }
}

// Nueva función para el mapa dinámico
function initMapaDinamico() {
    setTimeout(() => {
        if (window.londonMap) { window.londonMap.remove(); }
        
        window.londonMap = L.map('london-map').setView([organizadorViaje.config.lat_centro, organizadorViaje.config.long_centro], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.londonMap);

        organizadorViaje.checklist.forEach(item => {
            // Solo dibujamos marcadores que tengan latitud y longitud en la tabla checklist
            if (item.lat && item.long) {
                const isDone = item.completado;
                
                const customIcon = L.divIcon({
                    className: 'clear-leaflet-style',
                    html: `
                        <div class="pin-container" style="${isDone ? 'filter: grayscale(100%) opacity(0.5);' : ''}">
                            <i class="fas fa-map-marker-alt text-[28px] text-[var(--gryffindor-red)] drop-shadow-md"></i>
                            <span class="pin-text">${isDone ? '<s>Visto</s>' : 'Aquí'}</span>
                        </div>`,
                    iconSize: [30, 50],
                    iconAnchor: [15, 50]
                });

                // POPUP: Ahora carga la imagen dinámicamente si existe en el checklist
                const popupContent = `
                    <div class="text-center" style="min-width: 150px">
                        ${item.imagen_url ? `<img src="${item.imagen_url}" class="w-full h-24 object-cover rounded border border-[var(--gold)] mb-2">` : ''}
                        <strong style="font-family: 'Cinzel', serif; color: #740001;">${item.item}</strong>
                    </div>`;

                L.marker([item.lat, item.long], { icon: customIcon })
                    .addTo(window.londonMap)
                    .bindPopup(popupContent);
            }
        });
    }, 100);
}

// --- ACTUALIZAR CHECKLIST SIN REFRESCO FEO ---
window.toggleChecklist = async function(id, estadoActual) {
    // 1. Cambio visual instantáneo (Optimistic UI)
    const itemIndex = organizadorViaje.checklist.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        organizadorViaje.checklist[itemIndex].completado = !estadoActual;
        renderExtras(); // Refrescamos solo la vista actual instantáneamente
    }

    // 2. Guardamos en Supabase en segundo plano
    const { error } = await sb.from('checklist').update({ completado: !estadoActual }).eq('id', id);
    
    if (error) {
        // Si hay error, deshacemos el cambio y avisamos
        alert("Maldición rebotada al guardar en la nube: " + error.message);
        organizadorViaje.checklist[itemIndex].completado = estadoActual;
        renderExtras();
    } else {
        // Si va bien, actualizamos la caché local por si cierras la app de golpe
       localStorage.setItem('travel_data_cache_' + currentViajeId, JSON.stringify(organizadorViaje));
    }
}

// ==========================================
// --- BANCO GRINGOTTS CONECTADO A SUPABASE ---
// ==========================================
function renderGastos() {
    setActiveNav('nav-gastos');
    
    const TASA_CAMBIO = organizadorViaje.config.tasa_cambio; // Modifica según el cambio actual
    let gastos = organizadorViaje.gastos || [];
    
    let totalGBP = gastos.reduce((sum, g) => sum + parseFloat(g.cantidad), 0);
    let totalEUR = totalGBP * TASA_CAMBIO;

    let html = `
        <div class="fade-in pb-10">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-coins"></i> Banco Gringotts
            </h2>

            <div class="parchment-box p-5 rounded-lg mb-6 shadow-md text-center border-l-4 border-yellow-500 bg-yellow-50">
                <h3 class="font-bold text-lg mb-1 text-[var(--ink)]">Gasto Acumulado</h3>
                <p class="text-4xl font-bold text-[var(--gryffindor-red)] mb-1 tracking-wider">${totalGBP.toFixed(2)}</p>
                <p class="text-sm font-bold text-stone-600 bg-white/60 inline-block px-4 py-1.5 rounded-full border border-stone-300 shadow-sm mt-1">
                    <i class="fas fa-exchange-alt mr-1"></i> ≈ €${totalEUR.toFixed(2)}
                </p>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm border border-stone-200 mb-6">
                <h3 class="font-bold mb-3 border-b border-gray-200 pb-2 text-[var(--gryffindor-red)]">
                    <i class="fas fa-plus-circle text-[var(--gold)]"></i> Registrar Gasto
                </h3>
                <div class="flex gap-2">
                    <input type="text" id="gasto-concepto" placeholder="Ej: Pintas pub" class="flex-1 p-2 border-b-2 border-gray-300 bg-gray-50 focus:outline-none focus:border-[var(--gold)] focus:bg-white transition">
                    <input type="number" step="0.01" id="gasto-cantidad" class="w-20 p-2 border-b-2 border-gray-300 bg-gray-50 focus:outline-none focus:border-[var(--gold)] focus:bg-white transition text-center font-bold">
                    <button onclick="addGasto(event)" class="bg-[var(--gryffindor-red)] text-white px-4 py-2 rounded shadow hover:bg-red-900 transition active:scale-95">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>

            <h3 class="font-bold mb-3 px-1 text-lg text-[var(--ink)] border-b-2 border-[var(--gold)] inline-block">Bóveda</h3>
            <div class="space-y-3 mt-2">
    `;

    if (gastos.length === 0) {
        html += `<p class="text-center italic text-stone-500 text-sm py-4">Aún no hay movimientos en la bóveda...</p>`;
    } else {
        gastos.slice().reverse().forEach(g => {
            let eur = g.cantidad * TASA_CAMBIO;
            html += `
                <div class="bg-white/80 p-3 rounded-lg shadow-sm border border-[#e2d1aa] flex justify-between items-center group">
                    <span class="font-medium text-stone-800 text-lg leading-tight w-1/2">${g.concepto}</span>
                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <span class="block font-bold text-[var(--gryffindor-red)] text-lg">${parseFloat(g.cantidad).toFixed(2)}</span>
                            <span class="block text-xs font-bold text-stone-500">€${eur.toFixed(2)}</span>
                        </div>
                        <button onclick="deleteGasto(${g.id})" class="text-red-300 hover:text-red-600 p-2 transition active:scale-95" title="Eliminar gasto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    appContent.innerHTML = html;
}

// ==========================================
// --- MAPA DEL MERODEADOR ---
// ==========================================
let londonMap = null; // Variable para guardar el mapa




// --- AÑADIR GASTO SIN REFRESCO FEO ---
window.addGasto = async function(event) {
    const concepto = document.getElementById('gasto-concepto').value.trim();
    const cantidad = document.getElementById('gasto-cantidad').value;
    if(!concepto || !cantidad || cantidad <= 0) return;

    // Efecto de carga en el botón
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    // Mandamos a Supabase pidiendo que nos devuelva el registro creado (.select())
    const { data, error } = await sb.from('gastos').insert([{ concepto: concepto, cantidad: parseFloat(cantidad) }]).select();
    
    if (error) {
        alert("Los duendes reportan un error: " + error.message);
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.disabled = false;
    } else {
        // Añadimos el nuevo gasto a nuestra lista local
        if (!organizadorViaje.gastos) organizadorViaje.gastos = [];
        organizadorViaje.gastos.push(data[0]); // Metemos el dato real de la BBDD (con su ID)
        
        // Guardamos caché y redibujamos solo la pantalla de gastos
       localStorage.setItem('travel_data_cache_' + currentViajeId, JSON.stringify(organizadorViaje));
        renderGastos();
    }
}
// --- BORRAR GASTO SIN REFRESCO FEO ---
window.deleteGasto = async function(id) {
    if(confirm("¿Seguro que quieres borrar este gasto de la bóveda?")) {
        // Borramos de Supabase
        const { error } = await sb.from('gastos').delete().eq('id', id);
        
        if (error) {
            alert("Error al borrar: " + error.message);
        } else {
            // Filtramos la lista local para quitar el borrado
            organizadorViaje.gastos = organizadorViaje.gastos.filter(g => g.id !== id);
            
            // Actualizamos caché y redibujamos
           localStorage.setItem('travel_data_cache_' + currentViajeId, JSON.stringify(organizadorViaje));
            renderGastos();
        }
    }
}

function renderExplorerPass() {
    setActiveNav('nav-pass');
    
    let html = `
        <div class="fade-in pb-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-ticket-alt"></i> ${organizadorViaje.explorer_pass.titulo}
            </h2>

            <div class="parchment-box p-5 rounded-lg mb-6 shadow-md relative overflow-hidden border-l-4 border-green-600">
                <h3 class="font-bold text-xl mb-1 text-[var(--ink)]">${organizadorViaje.explorer_pass.subtitulo}</h3>
                <p class="text-[var(--gryffindor-red)] font-bold text-sm mb-3">${organizadorViaje.explorer_pass.precio_total}</p>
                <p class="text-stone-700 text-sm italic font-medium leading-relaxed bg-white/50 p-3 rounded border border-stone-200">
                    <i class="fas fa-info-circle text-[var(--gold)]"></i> ${organizadorViaje.explorer_pass.info}
                </p>
            </div>

    `;

    organizadorViaje.explorer_pass.actividades.forEach(act => {
        html += `
            <div class="bg-white p-4 rounded-lg shadow-sm border border-stone-200 flex items-center gap-4">
                <div class="bg-[var(--parchment)] w-12 h-12 rounded-full flex items-center justify-center border border-[var(--gold)] shrink-0 shadow-sm">
                    <i class="fas ${act.icono} text-xl text-[var(--gryffindor-red)]"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-[var(--ink)] text-lg leading-tight">${act.nombre}</h4>
                    <p class="text-xs font-bold text-gray-500 uppercase mt-1"><i class="far fa-calendar-alt"></i> ${act.dia_sugerido}</p>
                </div>
                <div class="text-right">
                    <span class="block text-xs uppercase text-stone-400 mb-1">En taquilla</span>
                    <span class="font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded font-mono">${act.precio_taquilla ? '' + act.precio_taquilla : '-'}</span>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    appContent.innerHTML = html;
}

window.renderExplorerPass = renderExplorerPass;

window.openMap = function(destination) {
    const query = encodeURIComponent(destination);
    // Usamos la URL oficial de búsqueda de Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

// --- CORRECCIÓN 1: El cliente es 'sb' ---
async function logout() {
    const { error } = await sb.auth.signOut();
    if (!error) {
        localStorage.removeItem('travel_data_cache_' + currentViajeId); // Limpiar caché al salir
        location.reload();
    }
}

// --- CORRECCIÓN 2: Mostrar/Ocultar botón de salir ---
function toggleLogoutButton(show) {
    const actions = document.getElementById('header-actions');
    if (actions) {
        if (show) actions.classList.remove('hidden');
        else actions.classList.add('hidden');
    }
}

window.toggleSecretos = function() {
    const content = document.getElementById('secretos-content');
    const chevron = document.getElementById('secretos-chevron');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        chevron.classList.add('rotate-180'); // Gira la flechita hacia arriba
    } else {
        content.classList.add('hidden');
        chevron.classList.remove('rotate-180'); // Vuelve a la posición original
    }
}

window.toggleMenu = function() {
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('-translate-x-full')) {
        // Abrir menú
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        // Pequeño retardo para que la transición de opacidad se vea suave
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        // Cerrar menú
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        // Esperamos a que termine la animación css para ocultarlo del todo
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function formatearFecha(fechaString) {
    if (!fechaString) return '';
    // Añadimos 'T00:00:00' para evitar problemas de zona horaria al convertir
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    let texto = fecha.toLocaleDateString('es-ES', opciones);
    // Capitalizamos y quitamos el " de " para que quede "Lunes 30 Marzo"
    return texto.charAt(0).toUpperCase() + texto.slice(1).replace(' de ', ' ');
}

window.generarGuiaPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = organizadorViaje; // Basado en data.json

    const red = [116, 0, 1];
    const gold = [211, 166, 37];
    const darkInk = [40, 40, 40];
    const textWidth = 175; 

    // Función para renderizar texto justificado manualmente
    const renderJustified = (text, x, y, maxWidth, fontSize, fontStyle = "normal") => {
        doc.setFont("times", fontStyle);
        doc.setFontSize(fontSize);
        const paragraphs = text.split('\n');
        let currentY = y;

        paragraphs.forEach(para => {
            const words = para.split(/\s+/);
            let line = [];
            for (let word of words) {
                let testLine = [...line, word].join(' ');
                if (doc.getTextWidth(testLine) > maxWidth && line.length > 0) {
                    if (currentY > 280) { doc.addPage(); currentY = 20; doc.setFont("times", fontStyle); doc.setFontSize(fontSize); }
                    doc.text(line.join(' '), x, currentY, { align: 'justify', maxWidth: maxWidth });
                    line = [word];
                    currentY += (fontSize * 0.5);
                } else {
                    line.push(word);
                }
            }
            if (currentY > 280) { doc.addPage(); currentY = 20; doc.setFont("times", fontStyle); doc.setFontSize(fontSize); }
            doc.text(line.join(' '), x, currentY);
            currentY += (fontSize * 0.6); 
        });
        return currentY;
    };

    // --- 1. PORTADA ---
    doc.setFillColor(252, 245, 229);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text(data.config.titulo.toUpperCase(), 105, 90, { align: "center" });
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(40, 95, 170, 95);
    doc.setFontSize(18);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(data.config.subtitulo, 105, 110, { align: "center" });
    
    // --- 2. RESUMEN DE ITINERARIO (Sustituye al Índice) ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text("RESUMEN DEL VIAJE", 20, 30);
    
    let resumenY = 50;
    data.dias.forEach((dia) => {
        if (resumenY > 270) { doc.addPage(); resumenY = 30; }
        
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text(`${dia.fecha}: ${dia.titulo}`, 25, resumenY);
        
        resumenY += 6;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
        // Solo el resumen corto
        const resumenCorto = doc.splitTextToSize(dia.resumen || "Sin resumen disponible.", 160);
        doc.text(resumenCorto, 30, resumenY);
        
        resumenY += (resumenCorto.length * 5) + 8;
    });

    // --- 3. CONTENIDO (Un Salto de Página por Día) ---
    data.dias.forEach((dia) => {
        doc.addPage(); 
        let currentY = 20;

        // Título del Día
        doc.setFillColor(252, 245, 229);
        doc.rect(10, currentY, 190, 15, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text(`${dia.fecha.toUpperCase()}: ${dia.titulo}`, 15, currentY + 10);
        currentY += 20;

        // Historia (Justificada)
        currentY = renderJustified(dia.historia_dia || "", 15, currentY, textWidth, 10, "italic") + 5;

        // Tabla Itinerario
        doc.autoTable({
            startY: currentY,
            head: [['Hora', 'Actividad', 'Resumen']],
            body: dia.timeline.map(item => [item.hora, item.actividad, item.desc || ""]),
            headStyles: { fillColor: red },
            styles: { font: "times" },
            margin: { left: 15, right: 15 },
            didDrawPage: (d) => { currentY = d.cursor.y + 10; }
        });

        // SECCIÓN DE DETALLES (Continuo, sin saltar página)
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text("GUÍA DE EXPLORACIÓN Y PUNTOS CLAVE", 15, currentY);
        currentY += 8;

        dia.timeline.forEach(item => {
            if (item.detalles) {
                if (currentY > 280) { doc.addPage(); currentY = 20; }
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
                doc.text(`> ${item.actividad}`, 15, currentY);
                currentY += 6;

                if (item.detalles.contexto) {
                    currentY = renderJustified(item.detalles.contexto, 15, currentY, textWidth, 10) + 2;
                }

                if (item.detalles.lista_ver && item.detalles.lista_ver.length > 0) {
                    if (currentY > 280) { doc.addPage(); currentY = 20; }
                    doc.setFont("times", "bolditalic");
                    doc.setTextColor(gold[0], gold[1], gold[2]);
                    doc.text("Indispensable ver:", 18, currentY);
                    currentY += 5;
                    
                    item.detalles.lista_ver.forEach(punto => {
                        const nombrePunto = typeof punto === 'object' ? punto.texto : punto;
                        if (currentY > 280) { doc.addPage(); currentY = 20; }
                        doc.setFont("times", "bold");
                        doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
                        doc.text(`- ${nombrePunto}`, 22, currentY);
                        currentY += 5;
                        
                        if (punto.desc) {
                            currentY = renderJustified(punto.desc, 27, currentY, textWidth - 12, 9) + 2;
                        }
                    });
                    currentY += 2;
                }
            }
        });
    });

    // --- 4. CHECKLIST FINAL ---
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text("MISIONES DEL MINISTERIO", 20, 30);
    let checkY = 50;
    const itemsCheck = [...data.checklist].sort((a, b) => a.item.localeCompare(b.item));
    itemsCheck.forEach(obj => {
        if (checkY > 280) { doc.addPage(); checkY = 20; }
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.rect(20, checkY - 4, 5, 5);
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(obj.item, 30, checkY);
        checkY += 8;
    });

    // --- 5. PAGINACIÓN FINAL ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: "center" });
    }

    const nombreArchivo = data.config.titulo ? data.config.titulo.replace(/\s+/g, '_') : 'Viaje';
    doc.save(`Guia_${nombreArchivo}.pdf`);
};

async function loadUserTrips() {
    // 1. Ocultar el contenido principal (appContent) y mostrar el selector como FLEX
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('trip-selection-container').style.display = 'flex'; // IMPORTANTE: flex en vez de block
    
    const tripList = document.getElementById('trip-list');
    tripList.innerHTML = '<p class="text-stone-600 italic text-sm"><i class="fas fa-spinner fa-spin text-[var(--gold)] mr-2"></i>Consultando con Gringotts...</p>';

    // 2. Obtener los viajes del usuario actual
    const { data: viajes, error } = await sb.from('viajes').select('*').eq('activo', true).order('created_at', { ascending: true });

    if (error) {
        console.error("Error cargando viajes:", error);
        tripList.innerHTML = '<p class="text-red-600 font-bold text-sm">Maldición detectada al cargar los viajes.</p>';
        return;
    }

    tripList.innerHTML = ''; 

    // 3. Evaluar si tiene viajes
    if (viajes.length === 0) {
        tripList.innerHTML = '<p class="text-stone-700 font-medium text-sm">No tienes ningún activo. ¡Forja el primero abajo!</p>';
    } else {
        viajes.forEach(viaje => {
            const btn = document.createElement('button');
            // Estilos mágicos para el botón generado
            btn.className = 'w-full bg-white/80 p-3 rounded shadow-sm border border-[var(--gold)] text-[var(--ink)] font-bold active:scale-95 transition hover:bg-yellow-50 flex justify-between items-center group';
            
            // Añadimos el nombre y una flechita a la derecha
            btn.innerHTML = `
                <span class="text-left flex-1 truncate pr-2 text-lg">${viaje.nombre}</span> 
                <i class="fas fa-chevron-right text-[var(--gryffindor-red)] opacity-50 group-hover:opacity-100 transition-opacity"></i>
            `;
            
            btn.onclick = () => selectTrip(viaje.id, viaje.nombre);
            tripList.appendChild(btn);
        });
    }
}

window.selectTrip = function(viajeId, viajeNombre) {
    // 1. Guardar el ID globalmente para usarlo en los Inserts de la app (gastos, checklist, etc)
    currentViajeId = viajeId; 
    
    // (Opcional) Guardarlo en LocalStorage por si refresca la página
    localStorage.setItem('currentViajeId', viajeId);

    // 2. Ocultar selector de viajes, mostrar el contenedor principal real (app-content)
    document.getElementById('trip-selection-container').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    // 3. Poner un spinner de carga bonito mientras se descargan los datos
    document.getElementById('app-content').innerHTML = `
        <div class="h-full flex flex-col items-center justify-center mt-20 fade-in">
            <i class="fas fa-spinner fa-spin text-5xl text-[var(--gold)] mb-4"></i>
            <p class="font-bold magic-font text-[var(--ink)] text-xl">Viajando a ${viajeNombre}...</p>
        </div>
    `;

    // 4. Llamar a tu función original para cargar los datos del viaje
    // (Asegúrate de que dentro de fetchTravelData estás usando .eq('viaje_id', currentViajeId))
    fetchTravelData(); 
};

window.createNewTrip = async function() {
    const inputName = document.getElementById('new-trip-name');
    const nombreViaje = inputName.value.trim();

    if (!nombreViaje) {
        alert("Por favor, introduce un nombre para el viaje.");
        return;
    }

    // Obtenemos el ID del usuario actual
    const { data: { user } } = await sb.auth.getUser();

    // Insertamos el nuevo viaje
    const { data, error } = await sb.from('viajes').insert([
        { 
            nombre: nombreViaje, 
            user_id: user.id 
        }
    ]).select();

    if (error) {
        console.error("Error creando el viaje:", error);
        alert("Hubo un error al crear el viaje.");
        return;
    }

    // Limpiamos el input
    inputName.value = '';

    // OPCIÓN A: Entrar automáticamente al viaje recién creado
    selectTrip(data[0].id, data[0].nombre);
    
    // OPCIÓN B: Simplemente recargar la lista de viajes (descomenta la siguiente línea y comenta la de arriba)
    // loadUserTrips();
};

window.backToTrips = function() {
    // 1. Opcional: Limpiar el ID del viaje actual en caché para evitar auto-cargas extrañas
    currentViajeId = null;
    
    // 2. Vaciamos el contenido de la app para que no se quede "congelado" el viaje anterior de fondo
    document.getElementById('app-content').innerHTML = '';
    
    // 3. Ocultamos la app y mostramos el selector de viajes
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('trip-selection-container').style.display = 'flex';
    
    // 5. Volvemos a cargar la lista para que se muestre actualizada
    loadUserTrips();
};

window.goToAdmin = function() {
    if (currentViajeId) {
        // Mandamos al admin con el ID del viaje actual en la URL
        window.location.href = `admin.html?viaje=${currentViajeId}`;
    } else {
        window.location.href = 'admin.html';
    }
};

async function handleSignUp(e) {
    e.preventDefault();
    const emailInput = document.getElementById('magic-email').value;
    const passwordInput = document.getElementById('magic-password').value;
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('signup-btn');
    
    // Ocultar mensajes de error previos
    errorMsg.classList.add('hidden');

    if (!emailInput || !passwordInput) {
        errorMsg.textContent = "Introduce correo y contraseña para crear la cuenta.";
        errorMsg.classList.remove('hidden');
        return;
    }

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Forjando cuenta...`;
    btn.disabled = true;

    // Llamada a Supabase para registrar al usuario
    const { data, error } = await sb.auth.signUp({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        errorMsg.textContent = "Error al crear cuenta: " + error.message;
        errorMsg.classList.remove('hidden');
        btn.innerHTML = `<i class="fas fa-user-plus mr-2"></i> Crear nueva cuenta`;
        btn.disabled = false;
    } else {
        // ¡ÉXITO! Lanzamos el modal dinámico
        mostrarModalExito(emailInput, passwordInput);
    }
}

// NUEVA FUNCION: Crea un modal dinámico, lo inyecta en el HTML y maneja el auto-login
function mostrarModalExito(email, password) {
    const modalHtml = `
        <div id="signup-success-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4 fade-in">
            <div class="parchment-box p-8 rounded-lg text-center max-w-sm w-full relative border-2 border-[var(--gold)] shadow-2xl">
                <i class="fas fa-envelope-open-text text-6xl text-[var(--gold)] mb-4 filter drop-shadow-md"></i>
                <h2 class="text-2xl font-bold text-[var(--gryffindor-red)] mb-2 magic-font">¡Carta Aceptada!</h2>
                <p class="text-stone-700 font-medium mb-6 text-sm">Tu cuenta ha sido forjada con éxito en los registros del Ministerio de Magia.</p>
                
                <button id="btn-enter-app" class="w-full bg-[var(--gryffindor-red)] text-white font-bold py-3 rounded shadow-md active:scale-95 transition border border-[var(--gold)]">
                    <i class="fas fa-door-open mr-2"></i> Entrar al Andén 9 ¾
                </button>
            </div>
        </div>
    `;
    
    // Lo inyectamos al final del body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Le damos vida al botón del modal
    document.getElementById('btn-enter-app').addEventListener('click', async () => {
        const btn = document.getElementById('btn-enter-app');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Cruzando el muro...';
        btn.disabled = true;

        // Iniciar sesión automáticamente de fondo
        const { error } = await sb.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // Destruimos el modal del HTML
        document.getElementById('signup-success-modal').remove();

        if (error) {
            alert("Error al intentar cruzar el muro: " + error.message);
        } else {
            // Entramos de lleno a la aplicación
            appContent.innerHTML = ''; 
            loadUserTrips();
        }
    });
}

// --- EXPORTAR FUNCIONES AL ÁMBITO GLOBAL ---
window.renderHome = renderHome;
window.renderItineraryList = renderItineraryList;
window.renderDayDetail = renderDayDetail;
window.renderTransport = renderTransport;
window.renderFood = renderFood;
window.renderExtras = renderExtras;
window.renderExplorerPass = renderExplorerPass;
window.logout = logout;
window.handleLogin = handleLogin;
window.renderSecretDetails = renderSecretDetails;
// Añadidos para Gringotts y el Checklist
window.renderGastos = renderGastos;
window.addGasto = addGasto;
window.deleteGasto = deleteGasto;
window.toggleChecklist = toggleChecklist;
window.toggleSecretos = toggleSecretos;
window.toggleMenu = toggleMenu;
window.selectTrip = selectTrip;
window.loadUserTrips = loadUserTrips;
window.handleSignUp = handleSignUp;