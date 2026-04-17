// js/private/features/accesos.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

let temporalEmails = []; // Memoria temporal local para los correos

export function openShareModal() {
    document.getElementById('share-modal').classList.remove('hidden');
    renderEmailsList();
    validateShareEmail();
}

export function closeShareModal() {
    document.getElementById('share-modal').classList.add('hidden');
    document.getElementById('share-email-input').value = '';
}

export function validateShareEmail() {
    const input = document.getElementById('share-email-input').value.trim();
    const btn = document.getElementById('btn-add-email');
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    
    if (isValid && !temporalEmails.includes(input)) {
        btn.disabled = false;
        btn.classList.remove('bg-stone-300', 'text-stone-500');
        btn.classList.add('bg-[var(--gold)]', 'text-[var(--ink)]', 'hover:bg-yellow-600');
    } else {
        btn.disabled = true;
        btn.classList.add('bg-stone-300', 'text-stone-500');
        btn.classList.remove('bg-[var(--gold)]', 'text-[var(--ink)]', 'hover:bg-yellow-600');
    }
}

export function addEmailToList() {
    const inputEl = document.getElementById('share-email-input');
    const email = inputEl.value.trim().toLowerCase();
    
    if (email && !temporalEmails.includes(email)) {
        temporalEmails.push(email);
        inputEl.value = '';
        validateShareEmail();
        renderEmailsList();
    }
}

export function removeEmailFromList(email) {
    temporalEmails = temporalEmails.filter(e => e !== email);
    renderEmailsList();
    validateShareEmail();
}

export function renderEmailsList() {
    const container = document.getElementById('emails-list-container');
    if (temporalEmails.length === 0) {
        container.innerHTML = '<p class="text-sm italic text-stone-500 text-center py-2">Ningún mago añadido aún.</p>';
        return;
    }
    
    container.innerHTML = temporalEmails.map(email => `
        <div class="flex justify-between items-center bg-white/60 p-2 rounded border border-[#e2d1aa] shadow-sm">
            <span class="font-medium text-stone-800"><i class="fas fa-envelope text-[var(--gold)] mr-2"></i>${email}</span>
            <button type="button" onclick="removeEmailFromList('${email}')" class="text-red-500 hover:text-red-700 p-1 rounded transition">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

export async function sendInvitations() {
    if (temporalEmails.length === 0) {
        customAlert("Atención", "No has añadido ningún correo electrónico.", "fa-exclamation-triangle");
        return;
    }

    try {
        const resultado = await AdminDataService.sendInvitations(adminState.currentAdminViajeId, temporalEmails);
        
        const emailsEncontrados = resultado.exitos || [];
        const emailsNoEncontrados = resultado.fallos || [];

        if (emailsNoEncontrados.length === 0) {
            customAlert("¡Lechuzas Enviadas!", "Las invitaciones se han enviado correctamente a todos los magos.", "fa-check-circle");
            temporalEmails = [];
            closeShareModal();
        } else if (emailsEncontrados.length > 0) {
            const msg = `Se han enviado invitaciones a los magos registrados.<br><br><b class="text-red-600">Advertencia:</b> No se ha podido invitar a los siguientes usuarios porque no existen en el sistema:<br> ${emailsNoEncontrados.join('<br>')}`;
            customAlert("Envío Parcial", msg, "fa-exclamation-triangle");
            temporalEmails = emailsNoEncontrados; 
            renderEmailsList();
        } else {
            customAlert("Error de Invocación", "No existe ninguno de los usuarios indicados en los registros del Ministerio.", "fa-skull-crossbones");
        }
    } catch (error) {
        customAlert("Error", "No se pudo procesar la petición: " + error.message, "fa-times");
    }
}

export async function openManageAccessModal() {
    document.getElementById('manage-access-modal').classList.remove('hidden');
    const container = document.getElementById('access-list-container');
    container.innerHTML = '<p class="text-center italic text-stone-500 py-4"><i class="fas fa-spinner fa-spin mr-2"></i> Consultando el registro del Ministerio...</p>';

    try {
        const data = await AdminDataService.getAccessList(adminState.currentAdminViajeId);
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-stone-600 font-bold py-4">Ningún mago tiene acceso a este viaje aún.</p>';
            return;
        }

        container.innerHTML = data.map(inv => {
            let badgeClass = inv.estado === 'aceptada' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : (inv.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-red-100 text-red-800 border border-red-200');
            
            return `
            <div class="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-[#e2d1aa] shadow-sm">
                <div>
                    <span class="font-bold text-stone-800 block text-lg">${inv.email}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm inline-block mt-1 ${badgeClass}">${inv.estado}</span>
                </div>
                <button onclick="revokeAccess(${inv.invitacion_id})" title="Expulsar" class="text-red-500 hover:text-white hover:bg-red-600 border border-red-500 w-10 h-10 flex items-center justify-center rounded-lg transition active:scale-95 shadow-sm">
                    <i class="fas fa-user-times"></i>
                </button>
            </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-red-600 font-bold text-center py-4">Error al leer los accesos: ${error.message}</p>`;
    }
}

export function closeManageAccessModal() {
    document.getElementById('manage-access-modal').classList.add('hidden');
}

export async function revokeAccess(invitacionId) {
    // Usamos la modal personalizada mágica
    const confirmado = await customConfirm(
        "Expulsar Mago", 
        "¿Estás seguro de que quieres expulsar a este mago de la expedición? Perderá el acceso de inmediato.", 
        "fa-user-times"
    );

    if(!confirmado) return;

    try {
        await AdminDataService.revokeAccess(invitacionId);
        openManageAccessModal(); // Recarga la lista visualmente
    } catch (error) {
        customAlert("Maldición rebotada", error.message, "fa-times-circle");
    }
}