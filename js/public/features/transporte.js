import { state } from "../../core/state.js";

export function renderTransport() {
    if (window.setActiveNav) window.setActiveNav('nav-trans');
    document.getElementById('app-content').innerHTML = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-center mb-6 text-[var(--gryffindor-red)]">
                <i class="fas fa-bus-alt"></i> Transporte Mágico
            </h2>

            <div class="parchment-box p-6 rounded-lg mb-6 text-center border-l-4 border-yellow-500 shadow-md">
                <h3 class="font-bold text-lg mb-2 flex justify-center items-center gap-2"><i class="fas fa-exclamation-circle text-yellow-600"></i> REGLA DE ORO</h3>
                <p class="text-xl font-bold text-[var(--gryffindor-red)] my-3">${state.organizadorViaje.transporte.consejo_oro}</p>
            </div>

            <div class="bg-white/70 p-5 rounded-lg shadow mb-6 border border-stone-200">
                <h3 class="font-bold mb-3 border-b border-gray-300 pb-2">Detalles</h3>
                <p class="text-base mb-3 text-justify text-stone-800">${state.organizadorViaje.transporte.detalle}</p>
            </div>

            <h3 class="font-bold mb-3 px-1">Apps Esenciales</h3>
            <div class="grid grid-cols-3 gap-3 mb-6">
                ${state.organizadorViaje.transporte.apps.map(app => `
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
