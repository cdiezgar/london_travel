// js/private/features/restaurantesDia.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export async function loadRestaurants(diaId) {
    const container = document.getElementById('restaurants-content');
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-[var(--gold)]"></i></div>';
    
    try {
        const rests = await AdminDataService.getRestaurantesDia(diaId);
        if (!rests || rests.length === 0) {
            container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay reservas de mesas para hoy.</p>';
            return;
        }
        
        container.innerHTML = rests.map(r => `
            <div class="flex justify-between items-center bg-white/60 hover:bg-white p-2 sm:p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group gap-2 transition">
                <div onclick='openRestaurantModal(${JSON.stringify(r).replace(/'/g, "&#39;")})' class="flex flex-col min-w-0 flex-1 cursor-pointer group/edit">
                    <div class="font-bold text-[var(--ink)] group-hover/edit:text-blue-800 text-base sm:text-lg magic-font truncate transition" title="${r.nombre}">${r.nombre}</div>
                    <div class="text-xs sm:text-sm text-stone-600 truncate">${r.desc_texto || ''} ${r.precio ? `• <b class="text-green-800">${r.precio}</b>` : ''}</div>
                </div>
                <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                    <button onclick="deleteRestaurant(${r.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Restaurante"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`;
    }
}

export function openRestaurantModal(rData = null) {
    if (!adminState.currentEditingId) {
        customAlert("¡Alto ahí, mago!", "Primero debes guardar este registro principal usando el botón <b>Guardar</b>. Una vez forjado en la base de datos, podrás añadirle todos los elementos extra que quieras.", "fa-save");
        return;
    }

    const form = document.getElementById('restaurant-form');
    form.reset();
    
    if (rData) {
        adminState.editingRestaurantId = rData.id;
        document.getElementById('restaurant-modal-title').innerHTML = '<i class="fas fa-utensils text-[var(--gold)]"></i> Editar Restaurante';
        document.getElementById('rest-nombre').value = rData.nombre || '';
        document.getElementById('rest-desc').value = rData.desc_texto || '';
        document.getElementById('rest-precio').value = rData.precio || '';
        document.getElementById('rest-loc').value = rData.loc || '';
    } else {
        adminState.editingRestaurantId = null;
        document.getElementById('restaurant-modal-title').innerHTML = '<i class="fas fa-utensils text-[var(--gold)]"></i> Nuevo Restaurante';
    }
    document.getElementById('restaurant-modal').classList.remove('hidden');
}

export function closeRestaurantModal() {
    document.getElementById('restaurant-modal').classList.add('hidden');
}

export async function saveRestaurant() {
    const form = document.getElementById('restaurant-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const payload = {
        dia_id: adminState.currentDiaIdForActivity,
        nombre: document.getElementById('rest-nombre').value.trim(),
        desc_texto: document.getElementById('rest-desc').value.trim() || null,
        precio: document.getElementById('rest-precio').value.trim() || "",
        loc: document.getElementById('rest-loc').value.trim() || null
    };
    
    try {
        await AdminDataService.saveRestauranteDia(payload, adminState.editingRestaurantId);
        closeRestaurantModal();
        loadRestaurants(adminState.currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Maldición rebotada", "Error al guardar restaurante: " + error.message, "fa-times-circle");
    }
}

export async function deleteRestaurant(id) {
    if (!(await customConfirm("Borrar Restaurante", "¿Seguro que quieres borrar este restaurante de los planes del día?", "fa-utensils"))) return;
    try {
        await AdminDataService.deleteRestauranteDia(id);
        loadRestaurants(adminState.currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch (error) {
        customAlert("Error", "Error al borrar: " + error.message, "fa-times-circle");
    }
}