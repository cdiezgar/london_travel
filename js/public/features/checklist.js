import { sb } from "../../core/supabase.js";
import { state } from "../../core/state.js";

export function renderExtras() {
    if (window.setActiveNav) window.setActiveNav('nav-extra');

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
                        ${state.organizadorViaje.checklist.map(item => {
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
                    ${state.organizadorViaje.curiosidades_extra.map(curio => `
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
    document.getElementById('app-content').innerHTML = html;
}

export function openFullscreenMap() {
    const mapContainer = document.getElementById('fullscreen-map-container');
    if (mapContainer) {
        mapContainer.classList.remove('hidden');
        mapContainer.classList.add('flex');
        setTimeout(initMapaDinamico, 150);
    }
}

export function closeFullscreenMap() {
    const mapContainer = document.getElementById('fullscreen-map-container');
    if (mapContainer) {
        mapContainer.classList.add('hidden');
        mapContainer.classList.remove('flex');
    }
}

function initMapaDinamico() {
    setTimeout(() => {
        if (window.londonMap) { window.londonMap.remove(); }

        window.londonMap = L.map('london-map').setView([state.organizadorViaje.config.lat_centro, state.organizadorViaje.config.long_centro], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.londonMap);

        state.organizadorViaje.checklist.forEach(item => {
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

export async function toggleChecklist(id, estadoActual) {
    const itemIndex = state.organizadorViaje.checklist.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        state.organizadorViaje.checklist[itemIndex].completado = !estadoActual;
        renderExtras();
    }

    const { error } = await sb.from('checklist').update({ completado: !estadoActual }).eq('id', id);

    if (error) {
        if (window.customAlert) window.customAlert("Maldición detectada", "Error al guardar en la nube: " + error.message, "fa-skull-crossbones");
        state.organizadorViaje.checklist[itemIndex].completado = estadoActual;
        renderExtras();
    } else {
        localStorage.setItem('travel_data_cache_' + state.currentViajeId, JSON.stringify(state.organizadorViaje));
    }
}

export function toggleSecretos() {
    const content = document.getElementById('secretos-content');
    const chevron = document.getElementById('secretos-chevron');

    if (content && chevron) {
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            chevron.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            chevron.classList.remove('rotate-180');
        }
    }
}
