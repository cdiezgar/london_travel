// Variable global para almacenar los datos una vez cargados
let organizadorViaje = null;

const appContent = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');

// Función para cargar los datos e inicializar la app
async function initApp() {
    try {
        const response = await fetch('data.json');
        organizadorViaje = await response.json();
        
        // Una vez tenemos los datos, pintamos la pantalla de inicio
        renderHome();
    } catch (error) {
        console.error("Error cargando los datos del viaje:", error);
        appContent.innerHTML = `<p class="p-5 text-red-600">Error mágico: No se pudo cargar el pergamino de datos.</p>`;
    }
}

function setActiveNav(id) {
    navItems.forEach(item => item.classList.remove('active', 'text-yellow-500'));
    const activeItem = document.getElementById(id);
    if(activeItem) activeItem.classList.add('active', 'text-yellow-500');
}

// --- RENDERIZADO: HOME ---
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
                <ul class="text-sm list-disc pl-5 space-y-1 text-stone-700">
                    <li>Desayunos en la habitación.</li>
                    <li>Cenas en la habitación.</li>
                    <li>Comidas fuera de casa. Tope de £25 por persona</li>
                    <li>Tope de transporte semanal £44.70.</li>
                </ul>
            </div>
        </div>
    `;
}

// --- RENDERIZADO: LISTA ITINERARIO ---
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

// --- RENDERIZADO: DETALLE DÍA ---
function renderDayDetail(id) {
    const dia = organizadorViaje.dias.find(d => d.id === id);
    if (!dia) return;

    // Scroll al top al entrar
    document.getElementById('app-content').scrollTo(0,0);

    let html = `
        <div class="fade-in">
            <button onclick="renderItineraryList()" class="mb-4 text-sm font-bold text-[var(--gryffindor-red)] flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-red-100 shadow-sm active:bg-red-50">
                <i class="fas fa-arrow-left"></i> Volver al Diario
            </button>

            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-[var(--gryffindor-red)] mb-1">${dia.titulo}</h2>
                <p class="text-md font-bold text-gray-600 uppercase tracking-widest">${dia.fecha}</p>
                <div class="mt-4 text-center">
                    <span class="handwritten text-xl text-red-900 bg-yellow-50 px-4 py-2 rounded shadow-sm inline-block transform -rotate-1 border border-yellow-200">
                        "${dia.nota_dia}"
                    </span>
                </div>
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
        console.log(item.precio)

        const hasDetails = item.detalles ? true : false;

        html += `
            <div class="relative group">
                <!-- Icono Timeline -->
                <div class="absolute -left-[35px] bg-[var(--parchment)] border-2 border-[var(--gryffindor-red)] rounded-full w-9 h-9 flex items-center justify-center text-[var(--gryffindor-red)] text-sm z-10 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                
                <!-- Tarjeta Contenido -->
                <div class="bg-white/80 p-4 rounded-lg shadow-sm border border-stone-200">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-lg leading-tight text-[var(--ink)] pr-2">${item.actividad}</h4>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <span class="bg-stone-200 text-xs px-2 py-1 rounded font-mono font-bold text-stone-700 whitespace-nowrap">${item.hora}</span>
                            ${item.precio ? `<span class="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200 shadow-sm">${item.precio}</span>` : ''}
                        </div>
                    </div>
                    <p class="text-stone-700 text-base mb-3 leading-relaxed">${item.desc}</p>
                    
                    ${item.imgBase64 ? `<img src="${item.imgBase64}" class="w-full h-40 object-cover rounded mb-3 border border-stone-300 shadow-sm">` : ''}

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

    html += `</div>`; // Cierre timeline

    // Sección Comer Hoy
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

// --- RENDERIZADO: DETALLE SECRETO (PANTALLA COMPLETA) ---
function renderSecretDetails(diaId, itemIndex) {
    const dia = organizadorViaje.dias.find(d => d.id === diaId);
    if (!dia) return;
    const item = dia.timeline[itemIndex];
    if (!item || !item.detalles) return;

    document.getElementById('app-content').scrollTo(0,0);

    let html = `
        <div class="fade-in pb-10">
            <button onclick="renderDayDetail(${diaId})" class="mb-6 text-sm font-bold text-[var(--gryffindor-red)] flex items-center gap-2 bg-white/50 px-3 py-2 rounded-full border border-red-100 shadow-sm active:bg-red-50">
                <i class="fas fa-arrow-left"></i> Volver al Día
            </button>
            
            <div class="secret-page-border mb-6">
                <div class="text-center mb-6">
                    <i class="fas fa-star text-3xl text-[var(--gold)] mb-2 animate-pulse"></i>
                    <h2 class="text-3xl font-bold text-[var(--gryffindor-red)] magic-font leading-tight">${item.actividad}</h2>
                    <p class="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Archivo Secreto</p>
                </div>

                <div class="mb-8">
                    <h3 class="magic-font text-xl font-bold mb-3 border-b-2 border-[var(--ink)] pb-1 inline-block">Historia y Contexto</h3>
                    <p class="text-lg leading-relaxed text-justify text-stone-800 font-medium">
                        <i class="fas fa-quote-left text-[var(--gryffindor-red)] text-xl mr-2"></i>
                        ${item.detalles.contexto}
                    </p>
                </div>

                <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-200 shadow-inner">
                    <h3 class="magic-font text-lg font-bold mb-4 flex items-center gap-2 text-[var(--ink)]">
                        <i class="fas fa-eye text-[var(--gryffindor-red)]"></i> Lo que no te puedes perder
                    </h3>
                    <ul class="space-y-3">
                        ${item.detalles.lista_ver.map(li => `
                            <li class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-[var(--gold)] mt-1 shrink-0"></i>
                                <span class="text-base text-stone-800 font-medium">${li}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
        </div>
    `;
    
    appContent.innerHTML = html;
}

// --- RENDERIZADO: TRANSPORTE ---
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
                <p class="text-sm mt-2 font-medium">Usa tu móvil (Apple Pay/Google Pay) o tarjeta Contactless directa. NO compres billetes de papel.</p>
            </div>

            <div class="bg-white/70 p-5 rounded-lg shadow mb-6 border border-stone-200">
                <h3 class="font-bold mb-3 border-b border-gray-300 pb-2">Costes y Límites (Caps)</h3>
                <p class="text-base mb-3 text-justify text-stone-800">${organizadorViaje.transporte.detalle}</p>
                <div class="flex justify-between text-xs font-mono bg-gray-100 p-3 rounded mt-2 border border-gray-200">
                    <span class="font-bold text-red-800">Tope Diario: £8.90</span>
                    <span class="font-bold text-red-800">Tope Semanal: £44.70</span>
                </div>
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
                <ul class="text-sm space-y-3">
                    <li class="flex gap-3"><i class="fas fa-ship text-blue-600 mt-1"></i> <div><strong>Uber Boat:</strong> Se paga igual (Contactless). Genial al atardecer para ver Londres iluminado.</div></li>
                    <li class="flex gap-3"><i class="fas fa-train text-purple-600 mt-1"></i> <div><strong>Elizabeth Line:</strong> Súper rápida, moderna y con aire acondicionado.</div></li>
                    <li class="flex gap-3"><i class="fas fa-bus text-red-600 mt-1"></i> <div><strong>Bus Rojo:</strong> £1.75 el viaje. Si coges otro antes de 1h es gratis (Hopper Fare).</div></li>
                </ul>
            </div>
        </div>
    `;
}

// --- RENDERIZADO: COMIDA ---
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
                <p class="text-sm text-gray-700 mt-1">${superm.desc}</p>
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

// --- RENDERIZADO: EXTRAS ---
function renderExtras() {
    setActiveNav('nav-extra');
    let html = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-key"></i> Sala de Menesteres
            </h2>

            <div class="mb-8">
                <h3 class="magic-font text-xl font-bold mb-4 text-center decoration-wavy underline decoration-[var(--gold)]">Checklist</h3>
                <div class="bg-white p-5 rounded-lg shadow-md border border-stone-200">
                    <ul class="space-y-3">
    `;

    organizadorViaje.checklist.forEach(item => {
        html += `
            <li class="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <input type="checkbox" class="w-6 h-6 mt-1 accent-[var(--gryffindor-red)] cursor-pointer shrink-0">
                <span class="text-lg handwritten leading-tight">${item}</span>
            </li>
        `;
    });

    html += `
                </ul>
                </div>
            </div>

            <div>
                <h3 class="magic-font text-xl font-bold mb-4 text-center">Secretos</h3>
                <div class="space-y-4">
    `;

    organizadorViaje.curiosidades_extra.forEach(curio => {
        html += `
            <div class="parchment-box p-5 rounded-lg transform active:scale-[0.99] transition-transform">
                <h4 class="font-bold text-[var(--gryffindor-red)] mb-2 flex items-center gap-2"><i class="fas fa-star text-sm text-[var(--gold)]"></i> ${curio.titulo}</h4>
                <p class="text-base leading-relaxed text-stone-800">${curio.texto}</p>
            </div>
        `;
    });

    html += `</div></div></div>`;
    appContent.innerHTML = html;
}

// --- RENDERIZADO: EXPLORER PASS ---
function renderExplorerPass() {
    setActiveNav('nav-pass');
    
    // Calculamos el valor real de las atracciones
    const valorReal = organizadorViaje.explorer_pass.actividades.reduce((sum, act) => sum + act.precio_taquilla, 0);
    const costePase = parseFloat(organizadorViaje.explorer_pass.precio_pp.replace('£', ''));
    const ahorroPorPersona = valorReal - costePase;

    let html = `
        <div class="fade-in pb-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-ticket-alt"></i> ${organizadorViaje.explorer_pass.titulo}
            </h2>

            <div class="parchment-box p-5 rounded-lg mb-6 shadow-md relative overflow-hidden border-l-4 border-green-600">
                <div class="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl shadow-sm uppercase tracking-wide">
                    Ahorro: £${ahorroPorPersona.toFixed(2)} pp
                </div>
                <h3 class="font-bold text-xl mb-1 text-[var(--ink)]">${organizadorViaje.explorer_pass.subtitulo}</h3>
                <p class="text-[var(--gryffindor-red)] font-bold text-sm mb-3">${organizadorViaje.explorer_pass.precio_total}</p>
                <p class="text-stone-700 text-sm italic font-medium leading-relaxed bg-white/50 p-3 rounded border border-stone-200">
                    <i class="fas fa-info-circle text-[var(--gold)]"></i> ${organizadorViaje.explorer_pass.info}
                </p>
            </div>

            <h3 class="font-bold text-lg mb-3 px-1 border-b-2 border-[var(--gold)] inline-block">Nuestros 4 Créditos:</h3>
            <div class="space-y-4">
    `;

    organizadorViaje.explorer_pass.actividades.forEach((act, index) => {
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
                    <span class="font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded font-mono">£${act.precio_taquilla.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    appContent.innerHTML = html;
}

// Si tuviste que añadir el "window.renderHome..." en el paso anterior, añade también esta:
window.renderExplorerPass = renderExplorerPass;


function openMap(destination) {
    const query = encodeURIComponent(destination);
    window.open(`https://googleusercontent.com/maps.google.com/0${query}&travelmode=transit`, '_blank');
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

