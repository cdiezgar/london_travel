// js/private/features/actividades.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export async function loadTimeline(diaId) {
    const container = document.getElementById('timeline-content');
    container.innerHTML = '<div class="text-center py-6"><i class="fas fa-spinner fa-spin text-3xl text-[var(--gold)]"></i></div>';
    
    try {
        const links = await AdminDataService.getTimeline(diaId);
        if (!links || links.length === 0) {
            container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay magia planeada para hoy. ¡Añade algo!</p>';
            return;
        }

        let html = '<div class="space-y-3 timeline-line pl-4 py-2 ml-2">';
        links.forEach(link => {
            const act = link.actividades;
            if (!act) return;
            
            let icon = 'fa-circle';
            if(act.tipo === 'transporte') icon = 'fa-train-subway';
            if(act.tipo === 'comida') icon = 'fa-utensils';
            if(act.tipo === 'visita') icon = 'fa-eye';
            if(act.tipo === 'museo') icon = 'fa-building-columns';
            if(act.tipo === 'check') icon = 'fa-check-double';
            if(act.tipo === 'caminar') icon = 'fa-walking';
            if(act.tipo === 'relax') icon = 'fa-leaf';

            const actJson = JSON.stringify({
                linkId: link.id, hora: link.hora, actId: act.id, nombre: act.nombre,
                desc: act.desc_texto || '', tipo: act.tipo || 'visita',
                direccion: act.direccion || '', precio: act.precio || '', contexto: act.contexto || '',
                checklist_id: act.checklist_id || ''
            }).replace(/'/g, "&#39;");

            html += `
                <div class="relative group">
                    <div class="absolute -left-[30px] top-2 bg-[var(--parchment)] border-2 border-[var(--gryffindor-red)] rounded-full w-7 h-7 flex items-center justify-center text-[var(--gryffindor-red)] text-xs z-10 shadow-sm">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="flex flex-col parchment-box p-2 sm:p-3 rounded transform transition duration-200 hover:scale-[1.01] hover:shadow-md border border-[#e2d1aa]">
                        <div class="flex justify-between items-start gap-2">
                            <div onclick='openActivityModal(${actJson})' class="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/edit">
                                <span class="bg-[#2b1b17] text-[var(--gold)] text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded font-mono font-bold mt-1 shadow-sm shrink-0">${link.hora}</span>
                                <div class="min-w-0 flex-1 group-hover/edit:text-blue-800 transition">
                                    <div class="font-bold text-[var(--ink)] text-base sm:text-lg magic-font tracking-wide truncate" title="${act.nombre}">${act.nombre}</div>
                                    ${act.desc_texto ? `<p class="text-xs sm:text-sm text-stone-600 mt-0.5 sm:mt-1 truncate italic" title="${act.desc_texto}">${act.desc_texto}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                                <button onclick="deleteActivity(${link.id}, ${act.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`;
    }
}

export async function openActivityModal(actData = null) {
    if (!adminState.currentEditingId) {
        customAlert("¡Alto ahí, mago!", "Primero debes guardar este registro principal usando el botón <b>Guardar</b>. Una vez forjado en la base de datos, podrás añadirle todos los elementos extra que quieras.", "fa-save");
        return;
    }
    
    adminState.editingItemId = null;
    const btnItem = document.getElementById('btn-save-item');
    if(btnItem) btnItem.innerHTML = '<i class="fas fa-plus"></i> Añadir Elemento';

    const form = document.getElementById('activity-form');
    form.reset(); 

    try {
        const checklistItems = await AdminDataService.getChecklistOptions(adminState.currentAdminViajeId);
        const checklistSelect = document.getElementById('act-checklist');
        
        let options = `<option value="">-- Sin vincular --</option>`;
        if (checklistItems) {
            options += checklistItems.map(c => `<option value="${c.id}">${c.item}</option>`).join('');
        }
        checklistSelect.innerHTML = options;
    } catch (error) {
        console.error("Error cargando checklist", error);
    }
    
    if (actData) {
        document.getElementById('activity-modal-title').innerHTML = '<i class="fas fa-magic text-[var(--gold)] mr-2"></i> Editar Actividad';
        adminState.editingLinkId = actData.linkId;
        adminState.editingActivityId = actData.actId;

        document.getElementById('act-hora').value = actData.hora;
        document.getElementById('act-nombre').value = actData.nombre;
        document.getElementById('act-tipo').value = actData.tipo;
        document.getElementById('act-direccion').value = actData.direccion;
        document.getElementById('act-precio').value = actData.precio;
        document.getElementById('act-desc').value = actData.desc;
        document.getElementById('act-contexto').value = actData.contexto;
        document.getElementById('act-checklist').value = actData.checklist_id || ''; 

        document.getElementById('activity-items-wrapper').classList.remove('hidden');
        document.getElementById('activity-items-warning').classList.add('hidden');
        loadActivityItems(actData.actId);
    } else {
        document.getElementById('activity-modal-title').innerHTML = '<i class="fas fa-plus text-[var(--gold)] mr-2"></i> Nueva Actividad';
        adminState.editingLinkId = null;
        adminState.editingActivityId = null;
        document.getElementById('act-tipo').value = 'visita'; 

        document.getElementById('activity-items-wrapper').classList.add('hidden');
        document.getElementById('activity-items-warning').classList.remove('hidden');
    }

    document.getElementById('activity-modal').classList.remove('hidden');
}

export function closeActivityModal() {
    document.getElementById('activity-modal').classList.add('hidden');
}

export async function saveActivity() {
    const form = document.getElementById('activity-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const hora = document.getElementById('act-hora').value;
    const checklistVal = document.getElementById('act-checklist').value;

    const actData = {
        nombre: document.getElementById('act-nombre').value,
        tipo: document.getElementById('act-tipo').value,
        direccion: document.getElementById('act-direccion').value || "",
        precio: document.getElementById('act-precio').value || "",
        desc_texto: document.getElementById('act-desc').value || "",
        contexto: document.getElementById('act-contexto').value || null,
        checklist_id: checklistVal ? parseInt(checklistVal) : null, 
        viaje_id: adminState.currentAdminViajeId
    };

    try {
        if (adminState.editingActivityId) {
            await AdminDataService.updateActivity(adminState.editingActivityId, adminState.editingLinkId, actData, hora);
        } else {
            await AdminDataService.insertActivity(adminState.currentDiaIdForActivity, actData, hora);
        }
        closeActivityModal();
        loadTimeline(adminState.currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error al guardar la actividad: " + error.message, "fa-times-circle");
    }
}

export async function deleteActivity(linkId, actId) {
    if (!(await customConfirm("Desaparecer Actividad", "¿Desaparecer esta actividad mediante el encantamiento Evanesco?", "fa-wand-magic-sparkles"))) return;
    try {
        await AdminDataService.deleteActivity(linkId, actId);
        loadTimeline(adminState.currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error quitando la actividad: " + error.message, "fa-times-circle");
    }
}

// --- ÍTEMS (COSAS QUE VER) ---
export async function loadActivityItems(actId) {
    const container = document.getElementById('activity-items-list');
    container.innerHTML = '<div class="text-center py-2"><i class="fas fa-spinner fa-spin text-[var(--gold)]"></i></div>';
    
    try {
        const items = await AdminDataService.getActivityItems(actId);
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-sm italic text-stone-500">No hay elementos en la lista todavía. Añade el primero abajo.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded border border-[#e2d1aa] shadow-sm">
                <div class="flex flex-col">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-[var(--gold)] mt-1 shrink-0"></i>
                        <span class="text-stone-800 text-base font-medium">${item.item_texto}</span>
                    </div>
                    ${item.descripcion || item.imagen_url ? `<span class="text-xs text-stone-500 ml-7 italic mt-1"><i class="fas fa-info-circle"></i> Tiene detalles guardados</span>` : ''}
                </div>
                <div class="flex items-center shrink-0">
                    <button type="button" onclick='editActivityItem(${JSON.stringify(item).replace(/'/g, "&#39;")})' class="text-blue-700 hover:bg-blue-100 p-1.5 rounded transition" title="Editar elemento">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" onclick="deleteActivityItem(${item.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 rounded ml-1 transition" title="Borrar elemento">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
    }
}

export async function addActivityItem() {
    const inputTxt = document.getElementById('new-item-text');
    const inputDesc = document.getElementById('new-item-desc');
    const inputImg = document.getElementById('new-item-img');

    const text = inputTxt.value.trim();
    if (!text || !adminState.editingActivityId) return;

    const payload = {
        actividad_id: adminState.editingActivityId, 
        item_texto: text,
        descripcion: inputDesc.value.trim() || null,
        imagen_url: inputImg.value.trim() || null
    };

    try {
        await AdminDataService.saveActivityItem(payload, adminState.editingItemId);
        inputTxt.value = ''; inputDesc.value = ''; inputImg.value = '';
        adminState.editingItemId = null; 
        
        const btn = document.getElementById('btn-save-item');
        if(btn) btn.innerHTML = '<i class="fas fa-plus"></i> Añadir Elemento';

        loadActivityItems(adminState.editingActivityId);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error en el elemento: " + error.message, "fa-times-circle");
    }
}

export async function deleteActivityItem(itemId) {
    try {
        await AdminDataService.deleteActivityItem(itemId);
        loadActivityItems(adminState.editingActivityId);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch(error) {
        customAlert("Error", "Error al borrar el elemento: " + error.message, "fa-times-circle");
    }
}

export function editActivityItem(item) {
    adminState.editingItemId = item.id;
    document.getElementById('new-item-text').value = item.item_texto || '';
    document.getElementById('new-item-desc').value = item.descripcion || '';
    document.getElementById('new-item-img').value = item.imagen_url || '';
    
    const btn = document.getElementById('btn-save-item');
    if(btn) btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    document.getElementById('new-item-text').focus();
}