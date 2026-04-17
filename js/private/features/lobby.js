// js/private/features/lobby.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export function renderHome(mostrarArchivados = false) {
    adminState.currentAdminViajeId = null;
    
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
        sidebar.style.display = 'none'; 
        sidebar.classList.add('-translate-x-full');
    }

    const overlay = document.getElementById('admin-overlay') || document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.add('hidden', 'opacity-0');

    const btnHamburguesa = document.querySelector('header button[onclick="toggleAdminMenu()"]');
    if (btnHamburguesa) btnHamburguesa.classList.add('!hidden');

    document.getElementById('view-title').textContent = "Panel de Expediciones";
    document.getElementById('btn-add').classList.add('hidden');

    const tableContainer = document.getElementById('data-table').parentElement;
    if (tableContainer) tableContainer.classList.add('hidden');
    
    let container = document.getElementById('dashboard-area');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dashboard-area';
        document.getElementById('content-area').appendChild(container);
    }
    container.classList.remove('hidden');

    // USAMOS EL ESTADO GLOBAL AQUÍ
    const viajesAMostrar = adminState.misViajes.filter(v => mostrarArchivados ? v.activo === false : v.activo !== false);

    container.innerHTML = `
        <div class="max-w-5xl mx-auto mt-4 pb-24">
            <div class="text-center mb-8">
                <p class="text-stone-600 text-lg mb-5">Selecciona un viaje para administrar su contenido y configuración.</p>
                <button onclick="window.location.href='index.html'" class="bg-white/80 hover:bg-white text-[var(--gryffindor-red)] px-6 py-2.5 rounded-full shadow-md font-bold transition border border-[var(--gold)] magic-font active:scale-95">
                    <i class="fas fa-door-open mr-2"></i> Volver al Andén 9 ¾
                </button>
            </div>

            <div class="flex justify-center gap-4 mb-8 border-b border-[var(--gold)]/30 pb-4 mt-6">
                <button onclick="renderHome(false)" class="px-6 py-2 font-bold rounded transition ${!mostrarArchivados ? 'bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] shadow-md' : 'text-stone-500 hover:text-stone-800'}">
                    <i class="fas fa-plane-departure mr-2"></i> Viajes Activos
                </button>
                <button onclick="renderHome(true)" class="px-6 py-2 font-bold rounded transition ${mostrarArchivados ? 'bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] shadow-md' : 'text-stone-500 hover:text-stone-800'}">
                    <i class="fas fa-archive mr-2"></i> Histórico
                </button>
            </div>

            ${viajesAMostrar.length === 0 ? `
                <div class="text-center py-12 text-stone-400 font-bold magic-font text-xl">
                    No hay viajes en esta sección...
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${viajesAMostrar.map(v => `
                        <div class="parchment-box p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between border ${!mostrarArchivados ? 'border-[var(--gold)]' : 'border-stone-400 opacity-80'}" onclick="${mostrarArchivados ? `reactivarDesdeHome(${v.id})` : `entrarAViaje(${v.id})`}">
                            <div>
                                <h3 class="text-2xl font-bold text-[var(--gryffindor-red)] magic-font mb-2">${v.nombre}</h3>
                                <p class="text-sm text-stone-500 mb-4 font-bold"><i class="fas ${mostrarArchivados ? 'fa-book-dead' : 'fa-check-circle text-green-600'} mr-1"></i> ${mostrarArchivados ? 'Archivado' : 'Activo'}</p>
                            </div>
                            <button class="w-full py-2 bg-[#2b1b17] text-[var(--gold)] rounded font-bold shadow-md hover:bg-black transition border border-[var(--gold)]/50">
                                ${mostrarArchivados ? '<i class="fas fa-undo-alt mr-2"></i> Reactivar Viaje' : '<i class="fas fa-magic mr-2"></i> Administrar'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

export function entrarAViaje(id) {
    adminState.currentAdminViajeId = id;
    
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.style.display = 'flex'; 

    const btnHamburguesa = document.querySelector('header button[onclick="toggleAdminMenu()"]');
    if (btnHamburguesa) btnHamburguesa.classList.remove('!hidden');
    
    // Llamamos a las funciones que aún residen en admin.js mediante window
    window.renderSidebar();
    window.loadTable('configuracion'); 
}

export async function reactivarDesdeHome(id) {
    const confirmado = await customConfirm(
        "Reactivar Expedición", 
        "¿Deseas reactivar este viaje y devolverlo a tu lista de viajes activos?", 
        "fa-undo-alt"
    );

    if (confirmado) {
        try {
            await AdminDataService.updateEstadoViaje(id, true);
            const viaje = adminState.misViajes.find(v => v.id === id);
            if(viaje) viaje.activo = true;
            renderHome(true); 
        } catch (error) {
            customAlert("Maldición detectada", error.message, "fa-skull-crossbones");
        }
    }
}

export async function loadHistorico() {
    adminState.currentTable = 'historico';
    window.setActiveMenu('historico'); // Llamada a función de admin.js
    
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }

    document.getElementById('view-title').textContent = "Histórico de Viajes";
    document.getElementById('btn-add').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');
    const dash = document.getElementById('dashboard-area');
    if(dash) dash.classList.add('hidden');

    try {
        const data = await AdminDataService.getViajesArchivados();
        
        document.getElementById('loading').classList.add('hidden');
        const table = document.getElementById('data-table');
        const thead = document.getElementById('table-head');
        const tbody = document.getElementById('table-body');
        table.classList.remove('hidden');

        thead.innerHTML = `<tr>
            <th class="py-3 px-4 font-bold uppercase text-left w-full text-[var(--gryffindor-red)] magic-font">Viajes Archivados</th>
            <th class="py-3 px-4 text-right whitespace-nowrap text-[var(--gryffindor-red)] magic-font">Acción</th>
        </tr>`;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="py-8 text-center handwritten text-xl text-stone-500">No hay viajes inactivos en el archivo...</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(row => `
            <tr class="hover:bg-stone-100 transition border-b border-[#e2d1aa]/50 bg-white/50">
                <td class="py-4 px-4 text-lg font-bold text-stone-800 magic-font">
                    <i class="fas fa-book-dead text-stone-400 mr-2"></i> ${row.nombre}
                </td>
                <td class="py-4 px-4 text-right">
                    <button onclick="reactivarDesdeHistorico(${row.id})" class="bg-[#2b1b17] hover:bg-black text-[var(--gold)] border border-[var(--gold)] px-4 py-2 rounded shadow-md font-bold transition active:scale-95 text-sm">
                        <i class="fas fa-undo-alt mr-1"></i> Reactivar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        customAlert("Error", "Error cargando archivo: " + error.message, "fa-times-circle");
    }
}

export async function reactivarDesdeHistorico(id) {
    if (await customConfirm("Reactivar Expedición", "¿Deseas reactivar este viaje y devolverlo al menú principal de expediciones?", "fa-undo-alt")) {
        try {
            await AdminDataService.updateEstadoViaje(id, true);
            window.init(); // Llamada a admin.js para recargar todo
            loadHistorico(); 
        } catch(error) {
            customAlert("Error", "Se ha producido un error inesperado: " + error.message, "fa-times-circle");
        }
    }
}