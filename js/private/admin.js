import { adminState } from "../core/adminState.js";
import { AdminDataService } from "../api/adminDataService.js";
import { renderHome, entrarAViaje, reactivarDesdeHome, loadHistorico, reactivarDesdeHistorico } from "./features/lobby.js";
import { customAlert, customConfirm } from "../ui/modals.js";
import { renderDashboardConfig, guardarDashboardConfig, confirmarCambioEstado, cambiarEstadoViaje } from "./features/dashboardConfig.js";
import { loadTable, openForm, closeModal, saveData, deleteData } from "./features/crud.js";
import { loadTimeline, openActivityModal, closeActivityModal, saveActivity, deleteActivity, loadActivityItems, addActivityItem, deleteActivityItem, editActivityItem } from "./features/actividades.js";
import { loadRestaurants, openRestaurantModal, closeRestaurantModal, saveRestaurant, deleteRestaurant } from "./features/restaurantesDia.js";
import { loadPassActivities, openPassActivityModal, closePassActivityModal, savePassActivity, deletePassActivity } from "./features/pasesActividades.js";
import { openShareModal, closeShareModal, validateShareEmail, addEmailToList, removeEmailFromList, sendInvitations, openManageAccessModal, closeManageAccessModal, revokeAccess } from "./features/invitaciones.js";
import { logout } from "../auth/auth.js";

async function init() {
    try {
        const session = await AdminDataService.getSession();
        if (!session) { window.location.href = 'index.html'; return; }
        
        const viajes = await AdminDataService.getMisViajes(session.user.id);
        
        if (!viajes || viajes.length === 0) {
            await customAlert("Atención", "Primero debes crear un viaje en la aplicación principal.", "fa-exclamation-triangle");
            window.location.href = 'index.html';
            return;
        }

        adminState.misViajes = viajes;

        const urlParams = new URLSearchParams(window.location.search);
        const viajeDesdeApp = urlParams.get('viaje');

        if (viajeDesdeApp) {
            if (viajes.some(v => v.id == viajeDesdeApp)) {
                entrarAViaje(viajeDesdeApp);
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                customAlert("¡Acceso denegado!", "Magia oscura detectada. Solo el organizador jefe puede usar la Sala de Configuración", "fa-exclamation-triangle");
                window.history.replaceState({}, document.title, window.location.pathname);
                renderHome(); 
            }
        } else {
            renderHome();
        }
    } catch (error) {
        console.error(error);
        customAlert("Error", "Error de conexión: " + error.message, "fa-times-circle");
    }
}

function renderSidebar() {
    const menu = document.getElementById('sidebar-menu');
    const viajeActual = adminState.misViajes.find(v => v.id == adminState.currentAdminViajeId);
    
    let sidebarContent = `
        <div class="px-6 pb-4 border-b border-[var(--gold)]/30 mb-4">
            <button onclick="renderHome()" class="w-full p-2 bg-[#2b1b17] hover:bg-black text-[var(--gold)] border border-[var(--gold)] rounded font-bold shadow-md transition flex justify-center items-center gap-2">
                <i class="fas fa-arrow-left"></i> Volver al Lobby
            </button>
            <div class="mt-4 text-center">
                <span class="text-[var(--gold)] text-xs font-bold uppercase tracking-widest block mb-1">Administrando:</span>
                <span class="text-white font-bold magic-font text-lg truncate block">${viajeActual ? viajeActual.nombre : ''}</span>
            </div>
        </div>
    `;

    sidebarContent += Object.keys(adminState.schemaMap).map(key => `
        <button onclick="loadTable('${key}')" id="nav-${key}" class="w-full text-left px-6 py-4 hover:bg-[var(--gryffindor-red)] hover:text-white transition flex items-center gap-3 border-l-4 border-transparent text-lg font-medium">
            <i class="fas ${adminState.schemaMap[key].icon} w-6 text-center text-[var(--gold)]"></i>
            ${adminState.schemaMap[key].label}
        </button>
    `).join('');

    menu.innerHTML = sidebarContent;
}

function setActiveMenu(tableKey) {
    document.querySelectorAll('#sidebar-menu button').forEach(btn => {
        btn.classList.remove('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
    });
    const active = document.getElementById(`nav-${tableKey}`);
    if (active) active.classList.add('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', init);

// ==========================================
// EXPOSICIÓN GLOBAL PARA HTML ONCLICKS
// ==========================================
window.init = init;
window.customAlert = customAlert;
window.customConfirm = customConfirm;

// Lobby
window.renderHome = renderHome;
window.entrarAViaje = entrarAViaje;
window.reactivarDesdeHome = reactivarDesdeHome;
window.loadHistorico = loadHistorico;
window.reactivarDesdeHistorico = reactivarDesdeHistorico;

// Menú e interacciones generales
window.renderSidebar = renderSidebar;
window.setActiveMenu = setActiveMenu;
window.toggleAdminMenu = function() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
};
window.goToApp = function() {
    window.location.href = adminState.currentAdminViajeId ? `index.html?viaje=${adminState.currentAdminViajeId}` : 'index.html';
};

window.logoutAdmin = logout;

// Dashboard
window.renderDashboardConfig = renderDashboardConfig;
window.guardarDashboardConfig = guardarDashboardConfig;
window.confirmarCambioEstado = confirmarCambioEstado;
window.cambiarEstadoViaje = cambiarEstadoViaje;

// Tablas CRUD genéricas
window.loadTable = loadTable;
window.openForm = openForm;
window.closeModal = closeModal;
window.saveData = saveData;
window.deleteData = deleteData;

// Actividades
window.loadTimeline = loadTimeline;
window.openActivityModal = openActivityModal;
window.closeActivityModal = closeActivityModal;
window.saveActivity = saveActivity;
window.deleteActivity = deleteActivity;
window.loadActivityItems = loadActivityItems;
window.addActivityItem = addActivityItem;
window.deleteActivityItem = deleteActivityItem;
window.editActivityItem = editActivityItem;

// Restaurantes
window.loadRestaurants = loadRestaurants;
window.openRestaurantModal = openRestaurantModal;
window.closeRestaurantModal = closeRestaurantModal;
window.saveRestaurant = saveRestaurant;
window.deleteRestaurant = deleteRestaurant;

// Pases Turísticos
window.loadPassActivities = loadPassActivities;
window.openPassActivityModal = openPassActivityModal;
window.closePassActivityModal = closePassActivityModal;
window.savePassActivity = savePassActivity;
window.deletePassActivity = deletePassActivity;

// Accesos y Compartir
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.validateShareEmail = validateShareEmail;
window.addEmailToList = addEmailToList;
window.removeEmailFromList = removeEmailFromList;
window.sendInvitations = sendInvitations;
window.openManageAccessModal = openManageAccessModal;
window.closeManageAccessModal = closeManageAccessModal;
window.revokeAccess = revokeAccess;