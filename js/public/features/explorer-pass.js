import { state } from "../../core/state.js";

export function renderExplorerPass() {
    if (window.setActiveNav) window.setActiveNav('nav-pass');

    let html = `
        <div class="fade-in pb-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-ticket-alt"></i> ${state.organizadorViaje.explorer_pass.titulo}
            </h2>

            <div class="parchment-box p-5 rounded-lg mb-6 shadow-md relative overflow-hidden border-l-4 border-green-600">
                <h3 class="font-bold text-xl mb-1 text-[var(--ink)]">${state.organizadorViaje.explorer_pass.subtitulo}</h3>
                <p class="text-[var(--gryffindor-red)] font-bold text-sm mb-3">${state.organizadorViaje.explorer_pass.precio_total}</p>
                <p class="text-stone-700 text-sm italic font-medium leading-relaxed bg-white/50 p-3 rounded border border-stone-200">
                    <i class="fas fa-info-circle text-[var(--gold)]"></i> ${state.organizadorViaje.explorer_pass.info}
                </p>
            </div>

    `;

    state.organizadorViaje.explorer_pass.actividades.forEach(act => {
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
    document.getElementById('app-content').innerHTML = html;
}
