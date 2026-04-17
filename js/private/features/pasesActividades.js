// js/private/features/pasesActividades.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export async function loadPassActivities(paseId) {
    const container = document.getElementById('pass-activities-content');
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-[var(--gold)]"></i></div>';
    
    try {
        const acts = await AdminDataService.getActividadesPase(paseId);
        if (!acts || acts.length === 0) {
            container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay actividades vinculadas a este pase.</p>';
            return;
        }
        
        container.innerHTML = acts.map(a => `
            <div class="flex justify-between items-center bg-white/60 hover:bg-white p-2 sm:p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group gap-2 transition">
                <div onclick='openPassActivityModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/edit">
                    <div class="bg-[var(--parchment)] w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[var(--gold)] shrink-0">
                        <i class="fas ${a.icono || 'fa-ticket-alt'} text-[var(--gryffindor-red)] text-sm sm:text-base"></i>
                    </div>
                    <div class="flex flex-col min-w-0 flex-1 group-hover/edit:text-blue-800 transition">
                        <div class="font-bold text-[var(--ink)] text-base sm:text-lg magic-font truncate" title="${a.nombre}">${a.nombre}</div>
                        <div class="text-xs sm:text-sm text-stone-600 truncate">${a.dia_sugerido || ''} ${a.precio_taquilla ? `• <b class="text-stone-800">£${a.precio_taquilla}</b>` : ''}</div>
                    </div>
                </div>
                <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                    <button onclick="deletePassActivity(${a.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`;
    }
}

export function openPassActivityModal(aData = null) {
    const form = document.getElementById('pass-activity-form');
    form.reset();
    
    if (aData) {
        adminState.editingPassActivityId = aData.id;
        document.getElementById('pass-activity-modal-title').innerHTML = '<i class="fas fa-ticket-alt text-[var(--gold)]"></i> Editar Actividad';
        document.getElementById('pass-act-nombre').value = aData.nombre || '';
        document.getElementById('pass-act-precio').value = aData.precio_taquilla || '';
        document.getElementById('pass-act-dia').value = aData.dia_sugerido || '';
        document.getElementById('pass-act-icono').value = aData.icono || '';
    } else {
        adminState.editingPassActivityId = null;
        document.getElementById('pass-activity-modal-title').innerHTML = '<i class="fas fa-ticket-alt text-[var(--gold)]"></i> Nueva Actividad';
    }
    document.getElementById('pass-activity-modal').classList.remove('hidden');
}

export function closePassActivityModal() {
    document.getElementById('pass-activity-modal').classList.add('hidden');
}

export async function savePassActivity() {
    const form = document.getElementById('pass-activity-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const payload = {
        pase_id: adminState.currentPaseIdForActivity,  
        viaje_id: adminState.currentAdminViajeId,      
        nombre: document.getElementById('pass-act-nombre').value.trim(),
        precio_taquilla: document.getElementById('pass-act-precio').value || "",
        dia_sugerido: document.getElementById('pass-act-dia').value.trim() || "Sin día indicado",
        icono: document.getElementById('pass-act-icono').value.trim() || null
    };
    
    try {
        await AdminDataService.saveActividadPase(payload, adminState.editingPassActivityId);
        closePassActivityModal();
        loadPassActivities(adminState.currentPaseIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error al guardar actividad: " + error.message, "fa-times-circle");
    }
}

export async function deletePassActivity(id) {
    if (!(await customConfirm("Borrar Actividad", "¿Seguro que quieres borrar esta actividad del pase turístico?", "fa-ticket-alt"))) return;
    try {
        await AdminDataService.deleteActividadPase(id);
        loadPassActivities(adminState.currentPaseIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error al borrar: " + error.message, "fa-times-circle");
    }
}