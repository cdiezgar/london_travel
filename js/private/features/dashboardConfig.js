// js/private/features/dashboardConfig.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export function renderDashboardConfig(configData, isActivo) {
    let container = document.getElementById('dashboard-area');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dashboard-area';
        document.getElementById('content-area').appendChild(container);
    }
    
    container.classList.remove('hidden');
    
    // Generar campos usando el schemaMap del estado global
    const formFields = adminState.schemaMap['configuracion'].columns.filter(c => c.key !== 'id').map(col => {
        const value = configData ? (configData[col.key] || '') : '';
        if (col.type === 'textarea') {
            return `<div class="col-span-1 md:col-span-2"><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font">${col.label}</label>
                    <textarea id="conf-${col.key}" rows="3" class="w-full p-2 border-2 border-[var(--gold)]/50 rounded bg-white/60 focus:outline-none transition">${value}</textarea></div>`;
        }
        return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font">${col.label}</label>
                <input type="text" id="conf-${col.key}" value="${value}" class="w-full p-2 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none transition font-medium"></div>`;
    }).join('');

    container.innerHTML = `
        <div class="parchment-box p-4 sm:p-6 rounded-lg shadow-lg relative mb-24">
            
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 border-b border-[var(--gold)] pb-4 gap-4">
                <h3 class="text-xl sm:text-2xl font-bold text-[var(--gryffindor-red)] magic-font flex items-center shrink-0">
                    <i class="fas fa-cogs text-[var(--gold)] mr-2"></i> Configuración
                </h3>
                
                <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    
                    <button type="button" onclick="openManageAccessModal()" class="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white/80 hover:bg-white text-[var(--ink)] px-3 py-2 sm:px-4 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font text-sm sm:text-base active:scale-95">
                        <i class="fas fa-users-cog"></i> <span>Accesos</span>
                    </button>

                    <button type="button" onclick="openShareModal()" class="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[#1a100d] hover:bg-black text-[var(--gold)] px-3 py-2 sm:px-4 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font text-sm sm:text-base active:scale-95">
                        <i class="fas fa-share-alt"></i> <span>Compartir</span>
                    </button>
                    
                    <div class="flex items-center gap-3 bg-white/70 p-2 sm:p-3 rounded-lg border border-[var(--gold)] shadow-sm w-full sm:w-auto justify-between sm:justify-start mt-2 sm:mt-0">
                        <label class="font-bold text-[var(--ink)] magic-font text-sm">Estado:</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="toggle-activo" class="sr-only peer" ${isActivo ? 'checked' : ''} onchange="confirmarCambioEstado(this.checked)">
                            <div class="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--gryffindor-red)]"></div>
                            <span class="ml-3 text-sm font-bold ${isActivo ? 'text-green-700' : 'text-stone-500'} truncate" id="estado-text">${isActivo ? 'ACTIVO' : 'ARCHIVADO'}</span>
                        </label>
                    </div>

                </div>
            </div>
            
            <form id="dashboard-form" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                ${formFields}
            </form>
            
            <div class="mt-8 flex flex-col sm:flex-row justify-end pt-4 border-t border-[var(--gold)]/30 gap-3 pb-6">
                <button type="button" onclick="guardarDashboardConfig(${configData ? configData.id : 'null'})" class="w-full sm:w-auto bg-[var(--gryffindor-red)] hover:bg-red-900 text-white px-6 py-3 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font flex items-center justify-center active:scale-95">
                    <i class="fas fa-save mr-2"></i> Guardar Cambios
                </button>
            </div>
        </div>
    `;
}

export async function guardarDashboardConfig(existingId) {
    const payload = { viaje_id: adminState.currentAdminViajeId };
    
    adminState.schemaMap['configuracion'].columns.filter(c => c.key !== 'id').forEach(col => {
        let val = document.getElementById(`conf-${col.key}`).value.trim();
        
        if (val === '') {
            payload[col.key] = null;
        } else {
            if (col.type === 'float' || col.type === 'number') {
                payload[col.key] = parseFloat(val);
            } else {
                payload[col.key] = val;
            }
        }
    });

    try {
        await AdminDataService.saveConfiguracion(payload, existingId);
        customAlert("¡Hechizo completado!", "La configuración del viaje se ha guardado correctamente.", "fa-check-circle");
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error al guardar", error.message, "fa-times-circle");
    }
}

export async function confirmarCambioEstado(isChecking) {
    const mensaje = isChecking 
        ? "¿Deseas reactivar este viaje y devolverlo al panel principal?"
        : "¿Estás seguro de que deseas archivar este viaje?<br><br><span class='text-sm text-stone-600 block mt-2'><i class='fas fa-info-circle'></i> Pasará al Histórico y dejará de verse en la app principal.</span>";
    
    const confirmado = await customConfirm("Cambio de Estado", mensaje, isChecking ? "fa-magic" : "fa-archive");
    
    if (confirmado) {
        cambiarEstadoViaje(isChecking);
    } else {
        document.getElementById('toggle-activo').checked = !isChecking;
    }
}

export async function cambiarEstadoViaje(nuevoEstado) {
    try {
        await AdminDataService.updateEstadoViaje(adminState.currentAdminViajeId, nuevoEstado);
        document.getElementById('estado-text').innerText = nuevoEstado ? 'VIAJE ACTIVO' : 'ARCHIVADO';
        document.getElementById('estado-text').className = `ml-3 text-sm font-bold ${nuevoEstado ? 'text-green-700' : 'text-stone-500'}`;
        window.init(); // Recargamos para actualizar menús
    } catch (error) {
        customAlert("Error", "Maldición detectada: " + error.message, "fa-skull-crossbones");
        document.getElementById('toggle-activo').checked = !nuevoEstado;
    }
}