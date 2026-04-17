import { sb } from "../../core/supabase.js";
import { state } from "../../core/state.js";

export function renderGastos() {
    if (window.setActiveNav) window.setActiveNav('nav-gastos');

    const TASA_CAMBIO = state.organizadorViaje.config.tasa_cambio; // Modifica según el cambio actual
    let gastos = state.organizadorViaje.gastos || [];

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
    document.getElementById('app-content').innerHTML = html;
}

export async function addGasto(event) {
    const concepto = document.getElementById('gasto-concepto').value.trim();
    const cantidad = document.getElementById('gasto-cantidad').value;
    if (!concepto || !cantidad || cantidad <= 0) return;

    // Efecto de carga en el botón
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    // Mandamos a Supabase pidiendo que nos devuelva el registro creado (.select())
    const { data, error } = await sb.from('gastos').insert([{
        concepto: concepto,
        cantidad: parseFloat(cantidad),
        viaje_id: state.currentViajeId
    }]).select();

    if (error) {
        window.customAlert("Aviso de Gringotts", "Los duendes reportan un error: " + error.message, "fa-coins");
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.disabled = false;
    } else {
        // Añadimos el nuevo gasto a nuestra lista local
        if (!state.organizadorViaje.gastos) state.organizadorViaje.gastos = [];
        state.organizadorViaje.gastos.push(data[0]); // Metemos el dato real de la BBDD (con su ID)

        // Guardamos caché y redibujamos solo la pantalla de gastos
        localStorage.setItem('travel_data_cache_' + state.currentViajeId, JSON.stringify(state.organizadorViaje));
        renderGastos();
    }
}

export async function deleteGasto(id) {
    if (await window.customConfirm("Borrar Gasto", "¿Seguro que quieres borrar este gasto de la bóveda?", "fa-trash")) {
        // Borramos de Supabase
        const { error } = await sb.from('gastos').delete().eq('id', id);

        if (error) {
            window.customAlert("Error", "Error al borrar: " + error.message, "fa-times-circle");
        } else {
            // Filtramos la lista local para quitar el borrado
            state.organizadorViaje.gastos = state.organizadorViaje.gastos.filter(g => g.id !== id);

            // Actualizamos caché y redibujamos
            localStorage.setItem('travel_data_cache_' + state.currentViajeId, JSON.stringify(state.organizadorViaje));
            renderGastos();
        }
    }
}
