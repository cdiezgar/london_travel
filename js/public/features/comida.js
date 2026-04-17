import { state } from "../../core/state.js";

export function renderFood() {
    if (window.setActiveNav) window.setActiveNav('nav-food');
    let html = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-drumstick-bite"></i> El Gran Comedor
            </h2>

            <div class="mb-8">
                <h3 class="font-bold text-lg mb-3 px-3 border-l-4 border-green-600 bg-green-50 py-2 rounded-r">Supermercados (Base)</h3>
                <div class="space-y-3">
    `;

    state.organizadorViaje.supermercados.forEach(superm => {
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

    state.organizadorViaje.restaurantes_lista.forEach(rest => {
        html += `
            <div class="parchment-box p-4 rounded relative overflow-hidden shadow-sm">
                <div class="absolute top-0 right-0 bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold px-3 py-1 rounded-bl shadow-sm">${rest.tipo}</div>
                <h4 class="font-bold text-xl mt-1 text-[var(--gryffindor-red)]">${rest.nombre}</h4>
                <p class="text-base mb-3 italic text-stone-700">"${rest.nota}"</p>
                <div class="flex justify-between items-center mt-2 border-t border-stone-300 pt-3">
                    <span class="text-xs font-bold bg-stone-200 px-3 py-1 rounded text-stone-700">${rest.precio}</span>
                    <button onclick="window.openMap('${rest.nombre} London')" class="text-xs text-blue-700 font-bold flex items-center gap-1 p-2 active:bg-blue-50 rounded"><i class="fas fa-map-marker-alt"></i> Ver Mapa</button>
                </div>
            </div>
        `;
    });

    html += `</div></div></div>`;
    document.getElementById('app-content').innerHTML = html;
}
