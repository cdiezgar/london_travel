import { state } from "../../core/state.js";

export function renderItineraryList() {
    if (window.setActiveNav) window.setActiveNav('nav-itin');
    let html = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-quidditch"></i> Diario de Viaje
            </h2>
            <div class="space-y-4">
    `;

    state.organizadorViaje.dias.forEach(dia => {
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
    document.getElementById('app-content').innerHTML = html;
}

export function renderDayDetail(id) {
    const dia = state.organizadorViaje.dias.find(d => d.id === id);
    if (!dia) return;

    document.getElementById('app-content').scrollTo(0, 0);

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
        if (item.tipo === 'transporte') icon = 'fa-train-subway';
        if (item.tipo === 'comida') icon = 'fa-utensils';
        if (item.tipo === 'visita') icon = 'fa-eye';
        if (item.tipo === 'museo') icon = 'fa-building-columns';
        if (item.tipo === 'check') icon = 'fa-check-double';
        if (item.tipo === 'caminar') icon = 'fa-walking';
        if (item.tipo === 'relax') icon = 'fa-leaf';

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
                        <button onclick="window.openMap('${item.direccion}')" class="text-xs bg-[var(--ink)] text-white px-3 py-1.5 rounded flex items-center gap-2 active:scale-95 transition">
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
                        ${rest.loc ? `<button onclick="window.openMap('${rest.loc}')" class="text-xs font-bold text-blue-700 p-1">Mapa <i class="fas fa-external-link-alt text-[10px]"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    html += `</div>`;
    document.getElementById('app-content').innerHTML = html;
}

export function renderSecretDetails(diaId, itemIndex) {
    const dia = state.organizadorViaje.dias.find(d => d.id === diaId);
    if (!dia) return;
    const item = dia.timeline[itemIndex];
    if (!item || !item.detalles) return;

    document.getElementById('app-content').scrollTo(0, 0);

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

    document.getElementById('app-content').innerHTML = html;
}
